import { createApp } from './app';
import {
  env,
  logger,
  connectDatabase,
  disconnectDatabase,
  connectRedis,
  disconnectRedis,
} from './config';
import { unhandledRejectionHandler, uncaughtExceptionHandler } from './api/middleware';

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to databases
    logger.info('Connecting to databases...');
    await connectDatabase();
    await connectRedis();
    logger.info('Database connections established');

    // Create Express app
    const app = createApp();

    // Start server
    const PORT = env.PORT;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`API URL: ${env.API_URL}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      // Close HTTP server
      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connections
        await disconnectRedis();
        await disconnectDatabase();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections and uncaught exceptions
process.on('unhandledRejection', unhandledRejectionHandler);
process.on('uncaughtException', uncaughtExceptionHandler);

// Start server
startServer();
