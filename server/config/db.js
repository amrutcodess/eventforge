import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventforge';
    console.log(`Connecting to MongoDB at ${connStr}...`);
    
    // Attempt standard connection with 3s timeout
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`Local MongoDB connection failed (${err.message}). Starting In-Memory MongoDB Server...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Server connected successfully at ${mongoUri}`);
    } catch (memErr) {
      console.error(`Fatal: Could not connect to any MongoDB instance: ${memErr.message}`);
      process.exit(1);
    }
  }
};
