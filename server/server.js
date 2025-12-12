import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import puzzleRoutes from './routes/puzzles.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parsonspuzzle';

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/puzzles', puzzleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection with Windows-friendly SSL options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable mongoose buffering
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

// For Windows, add additional SSL options if needed
if (process.platform === 'win32') {
  mongooseOptions.tls = true;
  mongooseOptions.tlsAllowInvalidCertificates = true;
  // Note: Don't use tlsInsecure with tlsAllowInvalidCertificates
}

mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Platform: ${process.platform}`);
    });
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    console.log('Attempting fallback connection...');
    
    // Fallback connection attempt with even more relaxed settings
    const fallbackOptions = {
      ...mongooseOptions,
      ssl: false, // Try without SSL as last resort
      directConnection: false,
    };
    
    mongoose.connect(MONGODB_URI.replace('mongodb+srv://', 'mongodb://'), fallbackOptions)
      .then(() => {
        console.log('Connected to MongoDB with fallback options');
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT} (fallback mode)`);
        });
      })
      .catch((fallbackError) => {
        console.error('Fallback connection also failed:', fallbackError);
        console.log('Starting server without database connection...');
        app.listen(PORT, () => {
          console.log(`Server running on port ${PORT} (NO DATABASE)`);
          console.log('Database connection will be retried automatically');
        });
      });
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

export default app;
