import { HTTP_STATUS } from '../constants';

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: Record<string, unknown>) {
    super(HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', message, details);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(HTTP_STATUS.UNAUTHORIZED, code, message);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', message);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      HTTP_STATUS.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      `${resource} not found${id ? `: ${id}` : ''}`
    );
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: Record<string, unknown>) {
    super(HTTP_STATUS.CONFLICT, 'RESOURCE_CONFLICT', message, details);
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: Record<string, unknown>) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', message, details);
  }
}

/**
 * Rate Limit Error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED',
      'Too many requests, please try again later',
      { retryAfter }
    );
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR', message, undefined, false);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE', message);
  }
}

/**
 * Authentication specific errors
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor() {
    super('Invalid email or password', 'AUTH_INVALID_CREDENTIALS');
  }
}

export class TokenExpiredError extends UnauthorizedError {
  constructor() {
    super('Token has expired', 'AUTH_TOKEN_EXPIRED');
  }
}

export class TokenInvalidError extends UnauthorizedError {
  constructor() {
    super('Invalid token', 'AUTH_TOKEN_INVALID');
  }
}

export class EmailNotVerifiedError extends UnauthorizedError {
  constructor() {
    super('Email not verified', 'AUTH_EMAIL_NOT_VERIFIED');
  }
}

export class AccountLockedError extends UnauthorizedError {
  constructor(lockoutUntil: Date) {
    super('Account temporarily locked', 'AUTH_ACCOUNT_LOCKED');
    // Add lockout time to error
    (this as any).lockoutUntil = lockoutUntil;
  }
}
