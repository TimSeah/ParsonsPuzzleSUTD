import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('Platform:', process.platform);
console.log('Node version:', process.version);
console.log('Connection string (sanitized):', MONGODB_URI.replace(/\/\/[^@]+@/, '//***:***@'));

const testConnection = async () => {
  // Define options here so they're in scope for the whole function
  const mongooseOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    maxPoolSize: 10,
  };

  if (process.platform === 'win32') {
    mongooseOptions.tls = true;
    mongooseOptions.tlsAllowInvalidCertificates = true;
    // Note: Don't use tlsInsecure with tlsAllowInvalidCertificates
  }

  try {
    console.log('Attempting connection with options:', mongooseOptions);
    
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Successfully connected to MongoDB Atlas!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL/TLS Error Detected. Trying alternative approaches...\n');
      
      // Try with different SSL options
      const alternativeOptions = [
        { ssl: false, directConnection: false },
        { tls: false },
        { tlsInsecure: true, tlsAllowInvalidHostnames: true, tlsAllowInvalidCertificates: true }
      ];
      
      for (const [index, options] of alternativeOptions.entries()) {
        try {
          console.log(`Attempting alternative ${index + 1}:`, options);
          await mongoose.connect(MONGODB_URI, { ...mongooseOptions, ...options });
          console.log(`✅ Alternative ${index + 1} succeeded!`);
          break;
        } catch (altError) {
          console.log(`❌ Alternative ${index + 1} failed:`, altError.message);
        }
      }
    }
  } finally {
    await mongoose.connection.close();
    console.log('Connection test completed.');
  }
};

testConnection();
