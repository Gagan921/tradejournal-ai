import { Request, Response } from 'express';
import { z } from 'zod';
import { TradeService } from '../../services';
import { TradeRepository, UserRepository } from '../../repositories';
import { asyncHandler, ApiResponse } from '../../utils';
import { validateBody, validateQuery, validateParams } from '../middleware';
import { TRADE_CONSTANTS } from '../../constants';

// Entry/Exit leg schema
const tradeLegSchema = z.object({
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  date: z.string().datetime().or(z.date()),
  orderType: z.enum(['market', 'limit', 'stop', 'stop_limit']).optional(),
  notes: z.string().optional(),
});

// Create trade schema
const createTradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  instrument: z.enum(['stock', 'crypto', 'forex', 'option', 'future', 'etf']).optional(),
  market: z.enum(['us_equity', 'crypto', 'forex', 'international']).optional(),
  direction: z.enum(['LONG', 'SHORT']),
  entries: z.array(tradeLegSchema).min(1, 'At least one entry is required'),
  exits: z.array(tradeLegSchema).optional(),
  risk: z
    .object({
      initialRisk: z.number().optional(),
      riskPercent: z.number().optional(),
      stopLoss: z.number().optional(),
      takeProfit: z.number().optional(),
      riskRewardRatio: z.number().optional(),
      positionSize: z.number().optional(),
    })
    .optional(),
  strategyId: z.string().optional(),
  setup: z
    .object({
      type: z.string().optional(),
      timeframe: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', 'D', 'W', 'M']).optional(),
      entryCriteria: z.array(z.string()).optional(),
      exitCriteria: z.array(z.string()).optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  psychology: z
    .object({
      preTradeMood: z.enum(['confident', 'neutral', 'anxious', 'fomo', 'hesitant', 'revengeful', 'fearful', 'greedy']).optional(),
      postTradeMood: z.enum(['confident', 'neutral', 'anxious', 'fomo', 'hesitant', 'revengeful', 'fearful', 'greedy']).optional(),
      disciplineScore: z.number().min(1).max(10).optional(),
      notes: z.string().optional(),
      mistakes: z
        .array(
          z.object({
            type: z.enum([
              'chased_entry',
              'no_stop_loss',
              'moved_stop',
              'averaged_down',
              'averaged_up',
              'overtraded',
              'revenge_trading',
              'missed_setup',
              'too_early',
              'too_late',
              'wrong_size',
              'ignored_plan',
              'emotional',
              'fomo_trade',
            ]),
            description: z.string().optional(),
            severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
          })
        )
        .optional(),
    })
    .optional(),
  marketContext: z
    .object({
      marketTrend: z.enum(['bullish', 'bearish', 'neutral']).optional(),
      sector: z.string().optional(),
      marketCondition: z.enum(['trending_up', 'trending_down', 'ranging', 'volatile', 'low_volume']).optional(),
      newsImpact: z.string().optional(),
      correlation: z.array(z.string()).optional(),
    })
    .optional(),
  checklist: z
    .object({
      preTrade: z.array(z.object({ item: z.string(), checked: z.boolean(), checkedAt: z.string().datetime().or(z.date()).optional() })).optional(),
      postTrade: z.array(z.object({ item: z.string(), checked: z.boolean(), checkedAt: z.string().datetime().or(z.date()).optional() })).optional(),
    })
    .optional(),
});

// Update trade schema
const updateTradeSchema = createTradeSchema.partial();

// Trade params schema
const tradeParamsSchema = z.object({
  id: z.string().min(1, 'Trade ID is required'),
});

// List trades query schema
const listTradesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['OPEN', 'CLOSED', 'PARTIAL']).optional(),
  direction: z.enum(['LONG', 'SHORT']).optional(),
  symbol: z.string().optional(),
  strategyId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'symbol', 'calculations.netPnL']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Add exit schema
const addExitSchema = z.object({
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive'),
  date: z.string().datetime().or(z.date()),
  orderType: z.enum(['market', 'limit', 'stop', 'stop_limit']).optional(),
  reason: z.enum(['target', 'stop_loss', 'trailing_stop', 'manual', 'time_based', 'breakeven']).optional(),
  notes: z.string().optional(),
});

/**
 * Trade controller
 */
export class TradeController {
  private tradeService: TradeService;

  constructor() {
    const tradeRepository = new TradeRepository();
    const userRepository = new UserRepository();
    this.tradeService = new TradeService(tradeRepository, userRepository);
  }

  /**
   * Create new trade
   */
  createTrade = [
    validateBody(createTradeSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const trade = await this.tradeService.createTrade(req.user!._id.toString(), req.body);
      return ApiResponse.created(res, trade);
    }),
  ];

  /**
   * Get all trades for user
   */
  getTrades = [
    validateQuery(listTradesQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
      const query = req.query as any;

      const filter: any = {};
      if (query.status) filter.status = query.status;
      if (query.direction) filter.direction = query.direction;
      if (query.symbol) filter.symbol = query.symbol;
      if (query.strategyId) filter.strategyId = query.strategyId;
      if (query.tags) filter.tags = query.tags.split(',');
      if (query.from || query.to) {
        filter.dateRange = {
          start: query.from ? new Date(query.from) : new Date(0),
          end: query.to ? new Date(query.to) : new Date(),
        };
      }

      const result = await this.tradeService.getTrades(req.user!._id.toString(), {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        filter,
      });

      return ApiResponse.paginated(res, result);
    }),
  ];

  /**
   * Get trade by ID
   */
  getTradeById = [
    validateParams(tradeParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const trade = await this.tradeService.getTradeById(req.params.id, req.user!._id.toString());
      return ApiResponse.success(res, trade);
    }),
  ];

  /**
   * Update trade
   */
  updateTrade = [
    validateParams(tradeParamsSchema),
    validateBody(updateTradeSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const trade = await this.tradeService.updateTrade(
        req.params.id,
        req.user!._id.toString(),
        req.body
      );
      return ApiResponse.success(res, trade);
    }),
  ];

  /**
   * Delete trade
   */
  deleteTrade = [
    validateParams(tradeParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await this.tradeService.deleteTrade(req.params.id, req.user!._id.toString());
      return ApiResponse.noContent(res);
    }),
  ];

  /**
   * Add exit to trade
   */
  addExit = [
    validateParams(tradeParamsSchema),
    validateBody(addExitSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const trade = await this.tradeService.addExit(
        req.params.id,
        req.user!._id.toString(),
        req.body
      );
      return ApiResponse.success(res, trade);
    }),
  ];

  /**
   * Get trade statistics
   */
  getStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as any;
    const dateRange = from || to ? { start: new Date(from || 0), end: new Date(to || Date.now()) } : undefined;

    const stats = await this.tradeService.getStatistics(req.user!._id.toString(), dateRange);
    return ApiResponse.success(res, stats);
  });

  /**
   * Get distinct symbols
   */
  getSymbols = asyncHandler(async (req: Request, res: Response) => {
    const symbols = await this.tradeService.getSymbols(req.user!._id.toString());
    return ApiResponse.success(res, symbols);
  });

  /**
   * Get distinct tags
   */
  getTags = asyncHandler(async (req: Request, res: Response) => {
    const tags = await this.tradeService.getTags(req.user!._id.toString());
    return ApiResponse.success(res, tags);
  });

  /**
   * Get equity curve
   */
  getEquityCurve = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query as any;
    const dateRange = from || to ? { start: new Date(from || 0), end: new Date(to || Date.now()) } : undefined;

    const curve = await this.tradeService.getEquityCurve(req.user!._id.toString(), dateRange);
    return ApiResponse.success(res, curve);
  });
}

export default TradeController;
