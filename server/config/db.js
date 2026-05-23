import mongoose from 'mongoose';
import env from './env.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[DB] MongoDB connection error: ${error.message}`);
    if (env.MONGO_URI?.includes('mongodb.net')) {
      console.error('[DB] Atlas tips: check MONGO_URI user/password, database name "shadownet", and Network Access IP whitelist.');
      console.error('[DB] Guide: docs/MONGODB_ATLAS.md');
    }
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[DB] MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected. Attempting reconnect...');
  });
};

export default connectDB;
