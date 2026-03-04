import { Request, Response } from 'express';
import { z } from 'zod';
import { AIService } from '../../services';
import { TradeRepository, UserRepository } from '../../repositories';
import { asyncHandler, ApiResponse } from '../../utils';
import { validateBody, validateParams, validateQuery } from '../middleware';
import { aiRateLimiter } from '../middleware';

// Analyze trade schema
const analyzeTradeSchema = z.object({
  tradeId: z.string().min(1, 'Trade ID is required'),
});

// Detect patterns schema
const detectPatternsSchema = z.object({
  tradeIds: z.array(z.string()).optional(),
});

// Analyze journal schema
const analyzeJournalSchema = z.object({
  entries: z.array(z.object({
    type: z.string(),
    content: z.string(),
    psychology: z.object({
      overallMood: z.string().optional(),
      disciplineRating: z.number().optional(),
    }).optional(),
    createdAt: z.string().or(z.date()),
  })).min(1, 'At least one entry is required'),
});

// Strategy feedback schema
const strategyFeedbackSchema = z.object({
  strategy: z.object({
    _id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    rules: z.object({
      entryConditions: z.array(z.object({ condition: z.string() })).optional(),
      exitConditions: z.array(z.object({ condition: z.string() })).optional(),
    }).optional(),
    performance: z.object({
      winRate: z.number().optional(),
      profitFactor: z.number().optional(),
      expectancy: z.number().optional(),
      totalPnL: z.number().optional(),
      maxDrawdown: z.number().optional(),
    }).optional(),
  }),
  tradeIds: z.array(z.string()).optional(),
});

// AI params schema
const aiParamsSchema = z.object({
  tradeId: z.string().min(1, 'Trade ID is required'),
});

// List insights query schema
const listInsightsQuerySchema = z.object({
  type: z.enum(['mistake', 'pattern', 'suggestion', 'risk']).optional(),
  acknowledged: z.string().transform((v) => v === 'true').optional(),
});

/**
 * AI controller
 */
export class AIController {
  private aiService: AIService;

  constructor() {
    const tradeRepository = new TradeRepository();
    const userRepository = new UserRepository();
    this.aiService = new AIService(tradeRepository, userRepository);
  }

  /**
   * Analyze a trade
   */
  analyzeTrade = [
    aiRateLimiter,
    validateBody(analyzeTradeSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.aiService.analyzeTrade(
        req.user!._id.toString(),
        req.body.tradeId
      );

      // TODO: Save insights to database

      return ApiResponse.success(res, {
        insights: result.insights,
        analysis: result.analysis,
        meta: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
        },
      });
    }),
  ];

  /**
   * Detect patterns across trades
   */
  detectPatterns = [
    aiRateLimiter,
    validateBody(detectPatternsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.aiService.detectPatterns(
        req.user!._id.toString(),
        req.body.tradeIds
      );

      return ApiResponse.success(res, {
        patterns: result.patterns,
        meta: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
        },
      });
    }),
  ];

  /**
   * Analyze journal entries
   */
  analyzeJournal = [
    aiRateLimiter,
    validateBody(analyzeJournalSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.aiService.analyzeJournal(
        req.user!._id.toString(),
        req.body.entries
      );

      return ApiResponse.success(res, {
        analysis: result.analysis,
        meta: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
        },
      });
    }),
  ];

  /**
   * Get strategy feedback
   */
  getStrategyFeedback = [
    aiRateLimiter,
    validateBody(strategyFeedbackSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.aiService.getStrategyFeedback(
        req.user!._id.toString(),
        req.body.strategy,
        req.body.tradeIds
      );

      return ApiResponse.success(res, {
        feedback: result.feedback,
        meta: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
        },
      });
    }),
  ];

  /**
   * Evaluate risk profile
   */
  evaluateRisk = [
    aiRateLimiter,
    asyncHandler(async (req: Request, res: Response) => {
      const result = await this.aiService.evaluateRisk(
        req.user!._id.toString(),
        req.body.portfolio
      );

      return ApiResponse.success(res, {
        evaluation: result.evaluation,
        meta: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime,
        },
      });
    }),
  ];

  /**
   * Get AI insights for a trade
   */
  getTradeInsights = [
    validateParams(aiParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const tradeRepository = new TradeRepository();
      const trade = await tradeRepository.findByIdAndUser(
        req.params.tradeId,
        req.user!._id.toString()
      );

      if (!trade) {
        return ApiResponse.error(res, 404, 'NOT_FOUND', 'Trade not found');
      }

      return ApiResponse.success(res, trade.aiInsights || []);
    }),
  ];

  /**
   * Acknowledge an insight
   */
  acknowledgeInsight = [
    validateParams(z.object({
      tradeId: z.string(),
      insightId: z.string(),
    })),
    asyncHandler(async (req: Request, res: Response) => {
      // TODO: Implement insight acknowledgment
      return ApiResponse.success(res, { message: 'Insight acknowledged' });
    }),
  ];

  /**
   * Rate an insight as helpful
   */
  rateInsight = [
    validateParams(z.object({
      tradeId: z.string(),
      insightId: z.string(),
    })),
    validateBody(z.object({
      helpful: z.boolean(),
    })),
    asyncHandler(async (req: Request, res: Response) => {
      // TODO: Implement insight rating
      return ApiResponse.success(res, { message: 'Insight rated' });
    }),
  ];
}

export default AIController;
