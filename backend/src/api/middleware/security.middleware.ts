import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';
import { env, isProduction } from '../../config';

/**
 * Configure Helmet security headers
 */
export const configureHelmet = (app: Express): void => {
  app.use(
    helmet({
      contentSecurityPolicy: isProduction()
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", env.CLIENT_URL],
            },
          }
        : false, // Disable CSP in development
      crossOriginEmbedderPolicy: isProduction(),
      hsts: isProduction()
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
    })
  );
};

/**
 * Configure CORS
 */
export const configureCors = (app: Express): void => {
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        env.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
      ];

      if (allowedOrigins.includes(origin) || !isProduction()) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'Accept',
    ],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: 86400, // 24 hours
  };

  app.use(cors(corsOptions));
};
