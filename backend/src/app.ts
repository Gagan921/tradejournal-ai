import express, { Application } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import routes from './api/routes';
import {
  configureHelmet,
  configureCors,
  requestIdMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from './api/middleware';
import { morganStream } from './config';

/**
 * Create Express application
 */
export const createApp = (): Application => {
  const app = express();

  // Security middleware
  configureHelmet(app);
  configureCors(app);

  // Request ID middleware
  app.use(requestIdMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Logging
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms', {
      stream: morganStream,
      skip: (req) => req.path === '/api/v1/health',
    })
  );

  // API routes
  app.use('/api/v1', routes);

  // 404 handler
  app.use(notFoundMiddleware);

  // Error handler
  app.use(errorMiddleware);

  return app;
};

export default createApp;
