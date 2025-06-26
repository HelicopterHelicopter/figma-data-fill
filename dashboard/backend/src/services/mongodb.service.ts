import mongoose from 'mongoose';

export class MongoDBService {
  private static instance: MongoDBService;
  private isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }
      
      await mongoose.connect(mongoUri);
      
      this.isConnected = true;
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', error);
      throw error;
    }
  }

  public getConnection() {
    return mongoose.connection;
  }

  public isConnectionReady(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
} 