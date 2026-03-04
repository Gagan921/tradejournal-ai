import { Request, Response } from 'express';
import { z } from 'zod';
import { PortfolioService } from '../../services';
import { PortfolioRepository } from '../../repositories';
import { asyncHandler, ApiResponse } from '../../utils';
import { validateBody, validateQuery, validateParams } from '../middleware';

// Create portfolio schema
const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required'),
  description: z.string().optional(),
  type: z.enum(['live', 'paper', 'backtest']).optional(),
  baseCurrency: z.string().length(3).optional(),
  initialCash: z.number().min(0).optional(),
});

// Update portfolio schema
const updatePortfolioSchema = createPortfolioSchema.partial();

// Portfolio params schema
const portfolioParamsSchema = z.object({
  id: z.string().min(1, 'Portfolio ID is required'),
});

// List portfolios query schema
const listPortfoliosQuerySchema = z.object({
  type: z.enum(['live', 'paper', 'backtest']).optional(),
});

// Add holding schema
const addHoldingSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  instrument: z.enum(['stock', 'crypto', 'forex', 'option', 'future', 'etf']).optional(),
  quantity: z.number().positive('Quantity must be positive'),
  avgPrice: z.number().positive('Average price must be positive'),
  currentPrice: z.number().positive('Current price must be positive').optional(),
});

// Update holding schema
const updateHoldingSchema = z.object({
  quantity: z.number().min(0).optional(),
  avgPrice: z.number().positive().optional(),
  currentPrice: z.number().positive().optional(),
});

// Cash operation schema
const cashOperationSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

// Update prices schema
const updatePricesSchema = z.object({
  prices: z.record(z.number().positive()),
});

/**
 * Portfolio controller
 */
export class PortfolioController {
  private portfolioService: PortfolioService;

  constructor() {
    const portfolioRepository = new PortfolioRepository();
    this.portfolioService = new PortfolioService(portfolioRepository);
  }

  /**
   * Create new portfolio
   */
  createPortfolio = [
    validateBody(createPortfolioSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.createPortfolio(
        req.user!._id.toString(),
        req.body
      );
      return ApiResponse.created(res, portfolio);
    }),
  ];

  /**
   * Get all portfolios for user
   */
  getPortfolios = [
    validateQuery(listPortfoliosQuerySchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolios = await this.portfolioService.getPortfolios(
        req.user!._id.toString(),
        req.query.type as string
      );
      return ApiResponse.success(res, portfolios);
    }),
  ];

  /**
   * Get portfolio by ID
   */
  getPortfolioById = [
    validateParams(portfolioParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.getPortfolioById(
        req.params.id,
        req.user!._id.toString()
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Get default portfolio
   */
  getDefaultPortfolio = asyncHandler(async (req: Request, res: Response) => {
    const portfolio = await this.portfolioService.getDefaultPortfolio(req.user!._id.toString());
    if (!portfolio) {
      return ApiResponse.success(res, null);
    }
    return ApiResponse.success(res, portfolio);
  });

  /**
   * Update portfolio
   */
  updatePortfolio = [
    validateParams(portfolioParamsSchema),
    validateBody(updatePortfolioSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.updatePortfolio(
        req.params.id,
        req.user!._id.toString(),
        req.body
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Delete portfolio
   */
  deletePortfolio = [
    validateParams(portfolioParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      await this.portfolioService.deletePortfolio(req.params.id, req.user!._id.toString());
      return ApiResponse.noContent(res);
    }),
  ];

  /**
   * Add holding to portfolio
   */
  addHolding = [
    validateParams(portfolioParamsSchema),
    validateBody(addHoldingSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.addHolding(
        req.params.id,
        req.user!._id.toString(),
        req.body
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Update holding in portfolio
   */
  updateHolding = [
    validateParams(z.object({
      id: z.string().min(1, 'Portfolio ID is required'),
      symbol: z.string().min(1, 'Symbol is required'),
    })),
    validateBody(updateHoldingSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.updateHolding(
        req.params.id,
        req.user!._id.toString(),
        req.params.symbol,
        req.body
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Remove holding from portfolio
   */
  removeHolding = [
    validateParams(z.object({
      id: z.string().min(1, 'Portfolio ID is required'),
      symbol: z.string().min(1, 'Symbol is required'),
    })),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.removeHolding(
        req.params.id,
        req.user!._id.toString(),
        req.params.symbol
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Deposit cash
   */
  depositCash = [
    validateParams(portfolioParamsSchema),
    validateBody(cashOperationSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.depositCash(
        req.params.id,
        req.user!._id.toString(),
        req.body.amount
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Withdraw cash
   */
  withdrawCash = [
    validateParams(portfolioParamsSchema),
    validateBody(cashOperationSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.withdrawCash(
        req.params.id,
        req.user!._id.toString(),
        req.body.amount
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Update prices
   */
  updatePrices = [
    validateParams(portfolioParamsSchema),
    validateBody(updatePricesSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const portfolio = await this.portfolioService.updatePrices(
        req.params.id,
        req.user!._id.toString(),
        req.body.prices
      );
      return ApiResponse.success(res, portfolio);
    }),
  ];

  /**
   * Get portfolio performance
   */
  getPerformance = [
    validateParams(portfolioParamsSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const performance = await this.portfolioService.getPerformance(
        req.params.id,
        req.user!._id.toString()
      );
      return ApiResponse.success(res, performance);
    }),
  ];
}

export default PortfolioController;
