# TradeMind - Backend Folder Structure

---

## 1. Project Structure Overview

```
backend/
├── src/
│   ├── config/                    # Configuration management
│   │   ├── database.ts            # MongoDB connection
│   │   ├── redis.ts               # Redis connection
│   │   ├── env.ts                 # Environment validation
│   │   ├── logger.ts              # Winston logger setup
│   │   └── index.ts               # Config exports
│   │
│   ├── api/                       # API Layer (Controllers & Routes)
│   │   ├── controllers/           # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── trade.controller.ts
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── strategy.controller.ts
│   │   │   ├── journal.controller.ts
│   │   │   ├── workflow.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── upload.controller.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── routes/                # Route definitions
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── trade.routes.ts
│   │   │   ├── portfolio.routes.ts
│   │   │   ├── strategy.routes.ts
│   │   │   ├── journal.routes.ts
│   │   │   ├── workflow.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── analytics.routes.ts
│   │   │   ├── upload.routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── middleware/            # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── rateLimit.middleware.ts
│   │   │   ├── requestId.middleware.ts
│   │   │   ├── security.middleware.ts
│   │   │   └── index.ts
│   │   │
│   │   └── validators/            # Request validation schemas
│   │       ├── auth.validator.ts
│   │       ├── trade.validator.ts
│   │       ├── user.validator.ts
│   │       └── index.ts
│   │
│   ├── services/                  # Business Logic Layer
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── trade.service.ts
│   │   ├── portfolio.service.ts
│   │   ├── strategy.service.ts
│   │   ├── journal.service.ts
│   │   ├── workflow.service.ts
│   │   ├── ai.service.ts
│   │   ├── analytics.service.ts
│   │   ├── upload.service.ts
│   │   ├── notification.service.ts
│   │   ├── email.service.ts
│   │   ├── cache.service.ts
│   │   └── index.ts
│   │
│   ├── repositories/              # Data Access Layer
│   │   ├── base.repository.ts     # Generic CRUD base class
│   │   ├── user.repository.ts
│   │   ├── trade.repository.ts
│   │   ├── portfolio.repository.ts
│   │   ├── strategy.repository.ts
│   │   ├── journal.repository.ts
│   │   ├── workflow.repository.ts
│   │   ├── aiInsight.repository.ts
│   │   ├── notification.repository.ts
│   │   └── index.ts
│   │
│   ├── models/                    # Database Models (Mongoose)
│   │   ├── user.model.ts
│   │   ├── trade.model.ts
│   │   ├── portfolio.model.ts
│   │   ├── strategy.model.ts
│   │   ├── journal.model.ts
│   │   ├── workflow.model.ts
│   │   ├── aiInsight.model.ts
│   │   ├── notification.model.ts
│   │   ├── upload.model.ts
│   │   ├── refreshToken.model.ts
│   │   └── index.ts
│   │
│   ├── interfaces/                # TypeScript Interfaces
│   │   ├── user.interface.ts
│   │   ├── trade.interface.ts
│   │   ├── portfolio.interface.ts
│   │   ├── strategy.interface.ts
│   │   ├── common.interface.ts
│   │   ├── api.interface.ts
│   │   └── index.ts
│   │
│   ├── types/                     # TypeScript Types & Enums
│   │   ├── enums.ts
│   │   ├── express.d.ts           # Express type extensions
│   │   └── index.ts
│   │
│   ├── utils/                     # Utility Functions
│   │   ├── apiResponse.ts         # Standardized API responses
│   │   ├── asyncHandler.ts        # Async error wrapper
│   │   ├── calculations.ts        # Trade/PnL calculations
│   │   ├── dateHelpers.ts         # Date manipulation
│   │   ├── encryption.ts          # Encryption utilities
│   │   ├── jwt.ts                 # JWT helpers
│   │   ├── password.ts            # Password hashing
│   │   ├── s3.ts                  # S3/MinIO utilities
│   │   ├── validators.ts          # Custom validators
│   │   └── index.ts
│   │
│   ├── jobs/                      # Background Job Processors
│   │   ├── queues.ts              # Queue definitions
│   │   ├── workers/               # Worker implementations
│   │   │   ├── ai.worker.ts
│   │   │   ├── email.worker.ts
│   │   │   ├── analytics.worker.ts
│   │   │   ├── image.worker.ts
│   │   │   └── index.ts
│   │   └── schedulers/            # Cron jobs
│   │       ├── dailyReport.job.ts
│   │       ├── cleanup.job.ts
│   │       └── index.ts
│   │
│   ├── integrations/              # External Service Integrations
│   │   ├── openai/                # OpenAI integration
│   │   │   ├── client.ts
│   │   │   ├── prompts.ts
│   │   │   └── types.ts
│   │   ├── stripe/                # Stripe integration
│   │   │   ├── client.ts
│   │   │   ├── webhooks.ts
│   │   │   └── types.ts
│   │   ├── sendgrid/              # Email service
│   │   │   ├── client.ts
│   │   │   └── templates.ts
│   │   └── marketData/            # Market data providers
│   │       ├── finnhub.client.ts
│   │       └── types.ts
│   │
│   ├── constants/                 # Application Constants
│   │   ├── httpStatus.ts
│   │   ├── errorCodes.ts
│   │   ├── tradeConstants.ts
│   │   └── index.ts
│   │
│   ├── seeds/                     # Database seeders
│   │   ├── user.seed.ts
│   │   ├── strategy.seed.ts
│   │   └── index.ts
│   │
│   └── app.ts                     # Express app setup
│   └── server.ts                  # Server entry point
│
├── tests/                         # Test Suite
│   ├── unit/                      # Unit tests
│   │   ├── services/
│   │   ├── utils/
│   │   └── repositories/
│   ├── integration/               # Integration tests
│   │   ├── api/
│   │   └── services/
│   ├── e2e/                       # End-to-end tests
│   │   └── flows/
│   ├── fixtures/                  # Test data
│   ├── helpers/                   # Test utilities
│   └── setup.ts                   # Test configuration
│
├── prisma/                        # Prisma ORM (if using PostgreSQL)
│   ├── schema.prisma
│   └── migrations/
│
├── scripts/                       # Utility scripts
│   ├── db-migrate.ts
│   ├── db-seed.ts
│   └── generate-keys.ts
│
├── logs/                          # Application logs (gitignored)
│   ├── error.log
│   ├── combined.log
│   └── exceptions.log
│
├── uploads/                       # Temporary uploads (gitignored)
│
├── .env.example                   # Environment template
├── .env.development
├── .env.production
├── .env.test
│
├── .eslintrc.js                   # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── .gitignore
│
├── docker-compose.yml             # Local development stack
├── Dockerfile                     # Production build
├── Dockerfile.dev                 # Development build
│
├── jest.config.js                 # Jest configuration
├── tsconfig.json                  # TypeScript configuration
├── package.json
└── README.md
```

---

## 2. Layer Responsibilities

### 2.1 API Layer (Controllers)

```typescript
// Example: trade.controller.ts
import { Request, Response, NextFunction } from 'express';
import { TradeService } from '../../services';
import { ApiResponse } from '../../utils';
import { asyncHandler } from '../../utils';

export class TradeController {
  constructor(private tradeService: TradeService) {}

  createTrade = asyncHandler(async (req: Request, res: Response) => {
    const trade = await this.tradeService.createTrade(
      req.user.id,
      req.body
    );
    return ApiResponse.created(res, trade, 'Trade created successfully');
  });

  getTrades = asyncHandler(async (req: Request, res: Response) => {
    const { trades, pagination } = await this.tradeService.getTrades(
      req.user.id,
      req.query
    );
    return ApiResponse.success(res, trades, pagination);
  });

  // ... other methods
}
```

**Responsibilities:**
- Handle HTTP requests/responses
- Extract and validate request data
- Call appropriate services
- Format responses
- Handle HTTP-specific concerns (status codes, headers)

---

### 2.2 Service Layer

```typescript
// Example: trade.service.ts
import { TradeRepository, PortfolioRepository } from '../repositories';
import { TradeCalculationUtil } from '../utils';
import { QueueService } from './queue.service';
import { NotFoundError, ValidationError } from '../utils/errors';

export class TradeService {
  constructor(
    private tradeRepo: TradeRepository,
    private portfolioRepo: PortfolioRepository,
    private queueService: QueueService
  ) {}

  async createTrade(userId: string, data: CreateTradeDTO): Promise<Trade> {
    // Validate business rules
    await this.validateTradeData(userId, data);
    
    // Calculate PnL and metrics
    const calculations = TradeCalculationUtil.calculate(data);
    
    // Create trade
    const trade = await this.tradeRepo.create({
      userId,
      ...data,
      calculations
    });
    
    // Update portfolio
    await this.portfolioRepo.updateHoldings(userId, trade);
    
    // Queue AI analysis
    await this.queueService.addAIJob('trade_review', {
      userId,
      tradeId: trade.id
    });
    
    return trade;
  }

  // ... other methods
}
```

**Responsibilities:**
- Implement business logic
- Orchestrate multiple repositories
- Enforce business rules
- Handle transactions
- Queue background jobs
- No HTTP-specific code

---

### 2.3 Repository Layer

```typescript
// Example: trade.repository.ts
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';
import { ITrade, TradeFilter, TradePagination } from '../interfaces';

export class TradeRepository extends BaseRepository<ITrade> {
  constructor(private tradeModel: Model<ITrade>) {
    super(tradeModel);
  }

  async findByUser(
    userId: string,
    filter: TradeFilter,
    pagination: TradePagination
  ): Promise<{ trades: ITrade[]; total: number }> {
    const query = this.buildQuery(userId, filter);
    
    const [trades, total] = await Promise.all([
      this.tradeModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean()
        .exec(),
      this.tradeModel.countDocuments(query)
    ]);
    
    return { trades, total };
  }

  async getTradeStats(userId: string, period: DateRange): Promise<TradeStats> {
    return this.tradeModel.aggregate([
      { $match: { userId, createdAt: { $gte: period.start, $lte: period.end } } },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          winningTrades: { 
            $sum: { $cond: [{ $gt: ['$calculations.netPnL', 0] }, 1, 0] }
          },
          totalPnL: { $sum: '$calculations.netPnL' },
          avgWin: { $avg: { $cond: [{ $gt: ['$calculations.netPnL', 0] }, '$calculations.netPnL', null] } },
          avgLoss: { $avg: { $cond: [{ $lt: ['$calculations.netPnL', 0] }, '$calculations.netPnL', null] } }
        }
      }
    ]);
  }

  // ... other methods
}
```

**Responsibilities:**
- Data access and persistence
- Query building
- Database-specific operations
- Return plain objects (not models)
- No business logic

---

### 2.4 Model Layer

```typescript
// Example: trade.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ITrade } from '../interfaces';

const TradeSchema = new Schema<ITrade>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    direction: {
      type: String,
      enum: ['LONG', 'SHORT'],
      required: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED', 'PARTIAL'],
      default: 'OPEN'
    },
    entries: [{
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      date: { type: Date, required: true },
      orderType: { type: String, enum: ['market', 'limit', 'stop'] },
      notes: String
    }],
    calculations: {
      totalEntryQuantity: Number,
      totalExitQuantity: Number,
      avgEntryPrice: Number,
      avgExitPrice: Number,
      grossPnL: Number,
      netPnL: Number,
      returnPercent: Number,
      rMultiple: Number
    },
    // ... other fields
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, status: 1 });
TradeSchema.index({ userId: 1, symbol: 1 });

// Virtuals
TradeSchema.virtual('isWinning').get(function() {
  return this.calculations?.netPnL > 0;
});

// Methods
TradeSchema.methods.calculatePnL = function() {
  // PnL calculation logic
};

// Statics
TradeSchema.statics.findWinningTrades = function(userId: string) {
  return this.find({
    userId,
    'calculations.netPnL': { $gt: 0 }
  });
};

export const TradeModel = mongoose.model<ITrade>('Trade', TradeSchema);
```

**Responsibilities:**
- Define schema structure
- Define indexes
- Define virtuals
- Define instance and static methods
- Data type enforcement

---

## 3. Dependency Injection Pattern

```typescript
// src/container.ts - Simple DI container
import { UserRepository, TradeRepository } from './repositories';
import { UserService, TradeService, AIService } from './services';
import { UserController, TradeController } from './api/controllers';

export class Container {
  // Repositories
  readonly userRepository = new UserRepository();
  readonly tradeRepository = new TradeRepository();
  
  // Services
  readonly userService = new UserService(this.userRepository);
  readonly tradeService = new TradeService(
    this.tradeRepository,
    this.portfolioRepository
  );
  readonly aiService = new AIService(this.tradeRepository);
  
  // Controllers
  readonly userController = new UserController(this.userService);
  readonly tradeController = new TradeController(this.tradeService);
}

// Usage in routes
const container = new Container();

router.get('/trades', 
  authMiddleware,
  container.tradeController.getTrades
);
```

---

## 4. Error Handling Strategy

```typescript
// src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, 'BAD_REQUEST', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', `${resource} not found${id ? `: ${id}` : ''}`);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: Record<string, any>) {
    super(422, 'VALIDATION_ERROR', message, details);
  }
}

// Error middleware
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
  }

  // Log unexpected errors
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
};
```

---

## 5. File Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Controllers | `{name}.controller.ts` | `trade.controller.ts` |
| Routes | `{name}.routes.ts` | `trade.routes.ts` |
| Services | `{name}.service.ts` | `trade.service.ts` |
| Repositories | `{name}.repository.ts` | `trade.repository.ts` |
| Models | `{name}.model.ts` | `trade.model.ts` |
| Interfaces | `{name}.interface.ts` | `trade.interface.ts` |
| Validators | `{name}.validator.ts` | `trade.validator.ts` |
| Middleware | `{name}.middleware.ts` | `auth.middleware.ts` |
| Utils | `{name}.ts` | `calculations.ts` |
| Tests | `{name}.test.ts` | `trade.service.test.ts` |

---

## 6. Import Organization

```typescript
// 1. External dependencies
import express from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';

// 2. Internal absolute imports
import { logger } from '@/config';
import { TradeService } from '@/services';
import { ApiResponse } from '@/utils';

// 3. Internal relative imports (same directory)
import { tradeValidator } from './validators';
import { TradeMapper } from './mappers';

// 4. Types
import type { Request, Response } from 'express';
import type { ITrade } from '@/interfaces';
```

---

*Document Version: 1.0*
*Last Updated: 2024*
