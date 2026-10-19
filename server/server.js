import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import puzzleRoutes from './routes/puzzles.js';
import generationRoutes from './routes/generation.js';
import {
  connectDatabase,
  databaseState,
  isDatabaseConnected,
  stopDatabase,
} from './services/database.js';

const app = express();
const PORT = Number(process.env.PORT);
const ASSISTANT_NAME = process.env.OPENAI_ASSISTANT_NAME;
const OPENAI_MODEL = process.env.OPENAI_MODEL;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS),
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS),
  skip: req => req.path === '/api/health',
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Middleware
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production') {
      return callback(null, origin === process.env.FRONTEND_URL);
    }
    const isLocalDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    return callback(isLocalDevelopmentOrigin ? null : new Error('Origin not allowed by CORS'), isLocalDevelopmentOrigin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/generate', generationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const connected = isDatabaseConnected();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'OK' : 'STARTING',
    database: databaseState(),
    assistant: ASSISTANT_NAME,
    model: OPENAI_MODEL,
    timestamp: new Date().toISOString(),
  });
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

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`OpenAI assistant: ${ASSISTANT_NAME} (${OPENAI_MODEL})`);
  void connectDatabase();
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend before starting another one.`);
  } else {
    console.error('Backend server error:', error);
  }
  process.exit(1);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await stopDatabase();
    process.exit(0);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export default app;
