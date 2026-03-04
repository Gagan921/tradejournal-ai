import Redis from 'ioredis';
import { env, isDevelopment } from './env';
import { logger } from './logger';

// Redis client instance
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(env.REDIS_URL, {
    password: env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  // Event listeners
  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client reconnecting...');
  });

  redisClient.on('end', () => {
    logger.warn('Redis client connection ended');
    redisClient = null;
  });

  return redisClient;
};

/**
 * Connect to Redis
 */
export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  // Skip if already connected or connecting (avoids "already connecting/connected" error)
  if (client.status === 'ready' || client.status === 'connecting' || client.status === 'connect') {
    return;
  }
  try {
    await client.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

/**
 * Disconnect from Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected successfully');
  }
};

/**
 * Check Redis health
 */
export const checkRedisHealth = async (): Promise<{ healthy: boolean; latency: number }> => {
  const client = getRedisClient();
  const start = Date.now();
  try {
    await client.ping();
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
 * Cache utility functions
 */
export const cacheUtils = {
  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },

  /**
   * Set cached value with optional TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  },

  /**
   * Delete cached value
   */
  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  },

  /**
   * Delete cached values by pattern
   */
  async delPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  },

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const client = getRedisClient();
    return await client.incrby(key, amount);
  },

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<void> {
    const client = getRedisClient();
    await client.expire(key, seconds);
  },

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    const client = getRedisClient();
    return await client.ttl(key);
  },
};

/**
 * Rate limiting utility
 */
export const rateLimitUtils = {
  /**
   * Check if request is within rate limit
   */
  async isAllowed(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const client = getRedisClient();
    const windowKey = `ratelimit:${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;

    const current = await client.incr(windowKey);
    if (current === 1) {
      await client.expire(windowKey, windowSeconds);
    }

    const ttl = await client.ttl(windowKey);
    const remaining = Math.max(0, maxRequests - current);
    const resetTime = Date.now() + ttl * 1000;

    return {
      allowed: current <= maxRequests,
      remaining,
      resetTime,
    };
  },
};

export default getRedisClient;
