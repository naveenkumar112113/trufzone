import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabase } from './seed';

let mongoServer: MongoMemoryServer | null = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/turfhub';
    
    if (process.env.NODE_ENV === 'test') {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB: Connected to in-memory test database');
      await seedDatabase();
      return;
    }

    try {
      // Try local MongoDB with short timeout
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      await seedDatabase();
    } catch (localErr: any) {
      console.warn(`Local MongoDB unavailable (${localErr.message}). Starting embedded MongoMemoryServer...`);
      mongoServer = await MongoMemoryServer.create();
      const memUri = mongoServer.getUri();
      const conn = await mongoose.connect(memUri);
      console.log(`MongoDB Connected (Embedded In-Memory): ${conn.connection.host}`);
      await seedDatabase();
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};
