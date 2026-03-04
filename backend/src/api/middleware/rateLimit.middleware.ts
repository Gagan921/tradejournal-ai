import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../../config';
import { env } from '../../config';
import { RateLimitError } from '../../utils';

/**
 * Standard API rate limiter
 */
export const apiRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => getRedisClient().call(...args),
  }),
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    return (req.user?.id as string) || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    const retryAfter = Math.ceil(parseInt(env.RATE_LIMIT_WINDOW_MS, 10) / 1000);
    throw new RateLimitError(retryAfter);
  },
});

/**
 * Strict rate limiter for auth endpoints
 */
export const authRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => getRedisClient().call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    return req.body?.email || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    throw new RateLimitError(15 * 60);
  },
});

/**
 * Upload rate limiter
 */
export const uploadRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => getRedisClient().call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.user?.id as string) || req.ip || 'unknown';
  },
});

/**
 * AI analysis rate limiter
 */
export const aiRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => getRedisClient().call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 AI requests per hour (adjust based on plan)
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.user?.id as string) || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    throw new RateLimitError(60 * 60);
  },
});

/**
 * Custom rate limit middleware with configurable options
 */
interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args: string[]) => getRedisClient().call(...args),
      prefix: options.keyPrefix || 'rl:',
    }),
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      return (req.user?.id as string) || req.ip || 'unknown';
    },
  });
};
