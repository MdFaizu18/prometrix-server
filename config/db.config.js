// MongoDB connection using Mongoose
// Handles connection lifecycle and emits clear logs per environment
import mongoose from 'mongoose';
import config from './env.config.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      // These are the recommended options for production stability
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected');
    });
  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
