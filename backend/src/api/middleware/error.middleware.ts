import { Request, Response, NextFunction } from 'express';
import { logger } from '../../config';
import { AppError, HTTP_STATUS } from '../../utils';
import { env, isDevelopment } from '../../config';

/**
 * Global error handler middleware
 */
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle known application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;

    // Log operational errors
    if (err.isOperational) {
      logger.warn('Operational error', {
        code: errorCode,
        message,
        statusCode,
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      });
    } else {
      // Log programming errors with stack trace
      logger.error('Programming error', {
        code: errorCode,
        message,
        stack: err.stack,
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      });
    }
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = { errors: (err as any).errors };

    logger.warn('Validation error', {
      message: err.message,
      requestId: req.requestId,
    });
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorCode = 'INVALID_ID_FORMAT';
    message = 'Invalid ID format';

    logger.warn('Cast error', {
      message: err.message,
      requestId: req.requestId,
    });
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = HTTP_STATUS.CONFLICT;
    errorCode = 'DUPLICATE_KEY';
    message = 'Resource already exists';
    details = { field: Object.keys((err as any).keyValue)[0] };

    logger.warn('Duplicate key error', {
      message: err.message,
      requestId: req.requestId,
    });
  } else {
    // Unknown error
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      requestId: req.requestId,
      path: req.path,
      method: req.method,
    });
  }

  // Build error response
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      ...(details && { details }),
    },
  };

  // Include stack trace in development
  if (isDevelopment() && err.stack) {
    errorResponse.error.stack = err.stack.split('\n');
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  });
};

/**
 * Unhandled rejection handler
 */
export const unhandledRejectionHandler = (reason: Error): void => {
  logger.error('Unhandled Rejection', {
    error: reason.message,
    stack: reason.stack,
  });

  // Give the server time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
};

/**
 * Uncaught exception handler
 */
export const uncaughtExceptionHandler = (error: Error): void => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });

  // Give the server time to log the error before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
};
