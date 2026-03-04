import { TradeRepository, UserRepository } from '../repositories';
import {
  CreateTradeDTO,
  UpdateTradeDTO,
  TradeFilter,
  TradeListQuery,
  TradeStatistics,
  ITrade,
  PaginatedResult,
} from '../interfaces';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils';
import { TRADE_CONSTANTS } from '../constants';
import { logger } from '../config';

/**
 * Trade service
 */
export class TradeService {
  constructor(
    private tradeRepository: TradeRepository,
    private userRepository: UserRepository
  ) {}

  /**
   * Create new trade
   */
  async createTrade(userId: string, data: CreateTradeDTO): Promise<ITrade> {
    // Validate entries
    if (!data.entries || data.entries.length === 0) {
      throw new ValidationError('At least one entry is required');
    }

    // Validate entry prices and quantities
    for (const entry of data.entries) {
      if (entry.price <= 0) {
        throw new ValidationError('Entry price must be greater than 0');
      }
      if (entry.quantity <= 0) {
        throw new ValidationError('Entry quantity must be greater than 0');
      }
    }

    // Validate exits if provided
    if (data.exits && data.exits.length > 0) {
      for (const exit of data.exits) {
        if (exit.price <= 0) {
          throw new ValidationError('Exit price must be greater than 0');
        }
        if (exit.quantity <= 0) {
          throw new ValidationError('Exit quantity must be greater than 0');
        }
      }

      // Check if total exit quantity exceeds entry quantity
      const totalEntryQty = data.entries.reduce((sum, e) => sum + e.quantity, 0);
      const totalExitQty = data.exits.reduce((sum, e) => sum + e.quantity, 0);

      if (totalExitQty > totalEntryQty) {
        throw new ValidationError('Total exit quantity cannot exceed total entry quantity');
      }
    }

    // Check user's trade limit
    const user = await this.userRepository.findById(userId);
    if (user) {
      const plan = user.subscription?.plan || 'free';
      const limit = TRADE_CONSTANTS.PLAN_LIMITS[plan as keyof typeof TRADE_CONSTANTS.PLAN_LIMITS];

      if (limit.maxTradesPerMonth > 0 && user.usage.tradesThisMonth >= limit.maxTradesPerMonth) {
        throw new ForbiddenError('Monthly trade limit exceeded. Please upgrade your plan.');
      }
    }

    // Create trade
    const trade = await this.tradeRepository.createTrade(userId, data);

    // Increment user's trade count
    await this.userRepository.incrementUsage(userId, 'tradesThisMonth');

    logger.info('Trade created', { userId, tradeId: trade._id, symbol: trade.symbol });

    return trade;
  }

  /**
   * Get trades for user
   */
  async getTrades(userId: string, query: TradeListQuery = {}): Promise<PaginatedResult<ITrade>> {
    const { trades, total, page, totalPages } = await this.tradeRepository.findByUser(userId, query);

    return {
      data: trades,
      pagination: {
        page,
        limit: query.limit || 20,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get trade by ID
   */
  async getTradeById(tradeId: string, userId: string): Promise<ITrade> {
    const trade = await this.tradeRepository.findByIdAndUser(tradeId, userId);

    if (!trade) {
      throw new NotFoundError('Trade', tradeId);
    }

    return trade;
  }

  /**
   * Update trade
   */
  async updateTrade(tradeId: string, userId: string, data: UpdateTradeDTO): Promise<ITrade> {
    // Check if trade exists
    const existingTrade = await this.tradeRepository.findByIdAndUser(tradeId, userId);
    if (!existingTrade) {
      throw new NotFoundError('Trade', tradeId);
    }

    // Validate entries if provided
    if (data.entries) {
      for (const entry of data.entries) {
        if (entry.price <= 0) {
          throw new ValidationError('Entry price must be greater than 0');
        }
        if (entry.quantity <= 0) {
          throw new ValidationError('Entry quantity must be greater than 0');
        }
      }
    }

    // Validate exits if provided
    if (data.exits) {
      for (const exit of data.exits) {
        if (exit.price <= 0) {
          throw new ValidationError('Exit price must be greater than 0');
        }
        if (exit.quantity <= 0) {
          throw new ValidationError('Exit quantity must be greater than 0');
        }
      }

      // Check if total exit quantity exceeds entry quantity
      const entries = data.entries || existingTrade.entries;
      const totalEntryQty = entries.reduce((sum, e) => sum + e.quantity, 0);
      const totalExitQty = data.exits.reduce((sum, e) => sum + e.quantity, 0);

      if (totalExitQty > totalEntryQty) {
        throw new ValidationError('Total exit quantity cannot exceed total entry quantity');
      }
    }

    // Update trade
    const updated = await this.tradeRepository.updateTrade(tradeId, userId, data);

    if (!updated) {
      throw new NotFoundError('Trade', tradeId);
    }

    logger.info('Trade updated', { userId, tradeId, symbol: updated.symbol });

    return updated;
  }

  /**
   * Delete trade (archive)
   */
  async deleteTrade(tradeId: string, userId: string): Promise<void> {
    const success = await this.tradeRepository.archiveTrade(tradeId, userId);

    if (!success) {
      throw new NotFoundError('Trade', tradeId);
    }

    logger.info('Trade archived', { userId, tradeId });
  }

  /**
   * Add screenshot to trade
   */
  async addScreenshot(
    tradeId: string,
    userId: string,
    screenshot: { url: string; thumbnailUrl?: string; caption?: string; type: string }
  ): Promise<ITrade> {
    // Check if trade exists
    const trade = await this.tradeRepository.findByIdAndUser(tradeId, userId);
    if (!trade) {
      throw new NotFoundError('Trade', tradeId);
    }

    // Check screenshot limit
    if (trade.screenshots.length >= TRADE_CONSTANTS.UPLOAD.MAX_FILES_PER_TRADE) {
      throw new ValidationError(
        `Maximum ${TRADE_CONSTANTS.UPLOAD.MAX_FILES_PER_TRADE} screenshots allowed per trade`
      );
    }

    const updated = await this.tradeRepository.addScreenshot(tradeId, userId, screenshot);

    if (!updated) {
      throw new NotFoundError('Trade', tradeId);
    }

    logger.info('Screenshot added to trade', { userId, tradeId });

    return updated;
  }

  /**
   * Remove screenshot from trade
   */
  async removeScreenshot(tradeId: string, userId: string, screenshotId: string): Promise<ITrade> {
    const updated = await this.tradeRepository.removeScreenshot(tradeId, userId, screenshotId);

    if (!updated) {
      throw new NotFoundError('Trade or screenshot');
    }

    logger.info('Screenshot removed from trade', { userId, tradeId, screenshotId });

    return updated;
  }

  /**
   * Get trade statistics
   */
  async getStatistics(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TradeStatistics> {
    return this.tradeRepository.getStatistics(userId, dateRange);
  }

  /**
   * Get distinct symbols for user
   */
  async getSymbols(userId: string): Promise<string[]> {
    return this.tradeRepository.getDistinctSymbols(userId);
  }

  /**
   * Get distinct tags for user
   */
  async getTags(userId: string): Promise<string[]> {
    return this.tradeRepository.getDistinctTags(userId);
  }

  /**
   * Get equity curve
   */
  async getEquityCurve(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{ date: Date; equity: number; pnl: number }[]> {
    return this.tradeRepository.getEquityCurve(userId, dateRange);
  }

  /**
   * Import trades
   */
  async importTrades(userId: string, trades: CreateTradeDTO[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    // Check user's trade limit
    const user = await this.userRepository.findById(userId);
    if (user) {
      const plan = user.subscription?.plan || 'free';
      const limit = TRADE_CONSTANTS.PLAN_LIMITS[plan as keyof typeof TRADE_CONSTANTS.PLAN_LIMITS];

      const remainingTrades = limit.maxTradesPerMonth - user.usage.tradesThisMonth;

      if (limit.maxTradesPerMonth > 0 && remainingTrades <= 0) {
        throw new ForbiddenError('Monthly trade limit exceeded. Please upgrade your plan.');
      }

      if (limit.maxTradesPerMonth > 0 && trades.length > remainingTrades) {
        throw new ValidationError(
          `You can only import ${remainingTrades} more trades this month. Please upgrade your plan.`
        );
      }
    }

    const result = await this.tradeRepository.importTrades(userId, trades);

    // Increment user's trade count
    if (result.success > 0) {
      for (let i = 0; i < result.success; i++) {
        await this.userRepository.incrementUsage(userId, 'tradesThisMonth');
      }
    }

    logger.info('Trades imported', { userId, success: result.success, failed: result.failed });

    return result;
  }

  /**
   * Add exit to trade (close position)
   */
  async addExit(
    tradeId: string,
    userId: string,
    exit: { price: number; quantity: number; date: Date; orderType?: string; reason?: string; notes?: string }
  ): Promise<ITrade> {
    // Check if trade exists
    const trade = await this.tradeRepository.findByIdAndUser(tradeId, userId);
    if (!trade) {
      throw new NotFoundError('Trade', tradeId);
    }

    // Check if trade is already closed
    if (trade.status === 'CLOSED') {
      throw new ValidationError('Trade is already closed');
    }

    // Validate exit
    if (exit.price <= 0) {
      throw new ValidationError('Exit price must be greater than 0');
    }
    if (exit.quantity <= 0) {
      throw new ValidationError('Exit quantity must be greater than 0');
    }

    // Check if exit quantity exceeds remaining position
    const totalEntryQty = trade.calculations.totalEntryQuantity;
    const totalExitQty = trade.calculations.totalExitQuantity + exit.quantity;

    if (totalExitQty > totalEntryQty) {
      throw new ValidationError('Exit quantity exceeds remaining position');
    }

    // Add exit
    const exits = [...trade.exits, exit];

    const updated = await this.tradeRepository.updateTrade(tradeId, userId, { exits });

    if (!updated) {
      throw new NotFoundError('Trade', tradeId);
    }

    logger.info('Exit added to trade', { userId, tradeId, exitPrice: exit.price });

    return updated;
  }
}
