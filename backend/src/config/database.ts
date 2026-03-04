import mongoose from 'mongoose';
import { getMongoUri, isDevelopment } from './env';
import { logger } from './logger';

// Connection options
const mongooseOptions: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
};

// Connection state tracking
let isConnected = false;

/**
 * Connect to MongoDB
 */
export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('Using existing MongoDB connection');
    return;
  }

  const uri = getMongoUri();

  try {
    mongoose.set('strictQuery', true);

    if (isDevelopment()) {
      mongoose.set('debug', (collectionName: string, method: string, ...args: any[]) => {
        logger.debug(`Mongoose: ${collectionName}.${method}`, { args });
      });
    }

    await mongoose.connect(uri, mongooseOptions);

    isConnected = true;
    logger.info('MongoDB connected successfully');

    // Event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async () => {
  logger.info('Shutting down MongoDB connection...');
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during MongoDB shutdown:', error);
    process.exit(1);
  }
};

/**
 * Check database health
 */
export const checkDatabaseHealth = async (): Promise<{ healthy: boolean; latency: number }> => {
  const start = Date.now();
  try {
    await mongoose.connection.db.admin().ping();
    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
    };
  }
};

/**
 * Get connection status
 */
export const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
  };
};

export default mongoose;
