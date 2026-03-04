import { FilterQuery } from 'mongoose';
import { BaseRepository } from './base.repository';
import { TradeModel } from '../models';
import { ITrade, ITradeDocument, CreateTradeDTO, UpdateTradeDTO, TradeFilter, TradeListQuery, TradeStatistics, TradeImportResult } from '../interfaces';
import { TRADE_CONSTANTS } from '../constants';
import { calculateTradeMetrics, calculateTradeStatistics } from '../utils';

/**
 * Trade repository
 */
export class TradeRepository extends BaseRepository<ITrade> {
  constructor() {
    super(TradeModel as any);
  }

  /**
   * Find trades by user with filtering
   */
  async findByUser(userId: string, query: TradeListQuery = {}): Promise<{
    trades: ITrade[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { filter = {}, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    // Build filter query
    const mongoFilter: FilterQuery<ITrade> = { userId, isArchived: false };

    if (filter.status) {
      mongoFilter.status = filter.status;
    }

    if (filter.direction) {
      mongoFilter.direction = filter.direction;
    }

    if (filter.symbol) {
      mongoFilter.symbol = filter.symbol.toUpperCase();
    }

    if (filter.instrument) {
      mongoFilter.instrument = filter.instrument;
    }

    if (filter.strategyId) {
      mongoFilter['strategy._id'] = filter.strategyId;
    }

    if (filter.tags && filter.tags.length > 0) {
      mongoFilter.tags = { $in: filter.tags };
    }

    if (filter.dateRange) {
      mongoFilter.createdAt = {
        $gte: filter.dateRange.start,
        $lte: filter.dateRange.end,
      };
    }

    if (filter.minPnL !== undefined) {
      mongoFilter['calculations.netPnL'] = { $gte: filter.minPnL };
    }

    if (filter.maxPnL !== undefined) {
      mongoFilter['calculations.netPnL'] = {
        ...mongoFilter['calculations.netPnL'],
        $lte: filter.maxPnL,
      };
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Execute query
    const [trades, total] = await Promise.all([
      TradeModel.find(mongoFilter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as Promise<ITrade[]>,
      TradeModel.countDocuments(mongoFilter).exec(),
    ]);

    return {
      trades,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find trade by ID and user
   */
  async findByIdAndUser(id: string, userId: string): Promise<ITrade | null> {
    return TradeModel.findOne({ _id: id, userId, isArchived: false })
      .lean()
      .exec() as Promise<ITrade | null>;
  }

  /**
   * Create new trade
   */
  async createTrade(userId: string, data: CreateTradeDTO): Promise<ITrade> {
    // Calculate initial metrics
    const calculations = calculateTradeMetrics(
      data.entries,
      data.exits || [],
      data.direction,
      data.risk?.stopLoss
    );

    const trade = await this.create({
      userId,
      symbol: data.symbol.toUpperCase(),
      instrument: data.instrument || 'stock',
      market: data.market || 'us_equity',
      direction: data.direction,
      entries: data.entries,
      exits: data.exits || [],
      calculations,
      risk: data.risk || {},
      strategy: data.strategyId ? { _id: data.strategyId, name: '' } : undefined,
      setup: data.setup,
      tags: data.tags || [],
      psychology: data.psychology,
      marketContext: data.marketContext,
      checklist: data.checklist,
    } as Partial<ITrade>);

    return trade;
  }

  /**
   * Update trade
   */
  async updateTrade(id: string, userId: string, data: UpdateTradeDTO): Promise<ITrade | null> {
    const updateData: any = {};

    if (data.entries !== undefined) {
      updateData.entries = data.entries;
    }

    if (data.exits !== undefined) {
      updateData.exits = data.exits;
    }

    if (data.risk !== undefined) {
      updateData.risk = data.risk;
    }

    if (data.strategyId !== undefined) {
      if (data.strategyId) {
        updateData['strategy._id'] = data.strategyId;
      } else {
        updateData.strategy = undefined;
      }
    }

    if (data.setup !== undefined) {
      updateData.setup = data.setup;
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags;
    }

    if (data.psychology !== undefined) {
      updateData.psychology = data.psychology;
    }

    if (data.marketContext !== undefined) {
      updateData.marketContext = data.marketContext;
    }

    if (data.checklist !== undefined) {
      updateData.checklist = data.checklist;
    }

    // Recalculate metrics if entries or exits changed
    if (data.entries !== undefined || data.exits !== undefined) {
      const trade = await this.findByIdAndUser(id, userId);
      if (trade) {
        const entries = data.entries || trade.entries;
        const exits = data.exits || trade.exits;
        const calculations = calculateTradeMetrics(
          entries,
          exits,
          trade.direction,
          data.risk?.stopLoss || trade.risk?.stopLoss
        );
        updateData.calculations = calculations;
      }
    }

    return TradeModel.findOneAndUpdate(
      { _id: id, userId, isArchived: false },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .lean()
      .exec() as Promise<ITrade | null>;
  }

  /**
   * Add screenshot to trade
   */
  async addScreenshot(
    id: string,
    userId: string,
    screenshot: { url: string; thumbnailUrl?: string; caption?: string; type: string }
  ): Promise<ITrade | null> {
    return TradeModel.findOneAndUpdate(
      { _id: id, userId, isArchived: false },
      { $push: { screenshots: screenshot } },
      { new: true }
    )
      .lean()
      .exec() as Promise<ITrade | null>;
  }

  /**
   * Remove screenshot from trade
   */
  async removeScreenshot(id: string, userId: string, screenshotId: string): Promise<ITrade | null> {
    return TradeModel.findOneAndUpdate(
      { _id: id, userId, isArchived: false },
      { $pull: { screenshots: { _id: screenshotId } } },
      { new: true }
    )
      .lean()
      .exec() as Promise<ITrade | null>;
  }

  /**
   * Add AI insight to trade
   */
  async addAIInsight(
    id: string,
    userId: string,
    insight: {
      type: string;
      category: string;
      title: string;
      description: string;
      confidence: number;
    }
  ): Promise<ITrade | null> {
    return TradeModel.findOneAndUpdate(
      { _id: id, userId, isArchived: false },
      {
        $push: {
          aiInsights: {
            ...insight,
            generatedAt: new Date(),
            acknowledged: false,
          },
        },
      },
      { new: true }
    )
      .lean()
      .exec() as Promise<ITrade | null>;
  }

  /**
   * Archive trade (soft delete)
   */
  async archiveTrade(id: string, userId: string): Promise<boolean> {
    const result = await TradeModel.findOneAndUpdate(
      { _id: id, userId, isArchived: false },
      { isArchived: true },
      { new: true }
    ).exec();

    return result !== null;
  }

  /**
   * Get trade statistics for user
   */
  async getStatistics(userId: string, dateRange?: { start: Date; end: Date }): Promise<TradeStatistics> {
    const matchStage: any = { userId, isArchived: false };

    if (dateRange) {
      matchStage.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const stats = await TradeModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTrades: { $sum: 1 },
          winningTrades: {
            $sum: { $cond: [{ $gt: ['$calculations.netPnL', 0] }, 1, 0] },
          },
          losingTrades: {
            $sum: { $cond: [{ $lt: ['$calculations.netPnL', 0] }, 1, 0] },
          },
          grossPnL: { $sum: '$calculations.grossPnL' },
          netPnL: { $sum: '$calculations.netPnL' },
          totalFees: { $sum: '$calculations.totalFees' },
          largestWin: { $max: '$calculations.netPnL' },
          largestLoss: { $min: '$calculations.netPnL' },
          avgWin: {
            $avg: {
              $cond: [{ $gt: ['$calculations.netPnL', 0] }, '$calculations.netPnL', null],
            },
          },
          avgLoss: {
            $avg: {
              $cond: [{ $lt: ['$calculations.netPnL', 0] }, '$calculations.netPnL', null],
            },
          },
          avgHoldingPeriod: { $avg: '$calculations.holdingPeriod' },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        grossPnL: 0,
        netPnL: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        avgHoldingPeriod: 0,
        totalFees: 0,
      };
    }

    const s = stats[0];
    const winRate = s.totalTrades > 0 ? (s.winningTrades / s.totalTrades) * 100 : 0;
    const profitFactor = s.avgLoss !== 0 ? Math.abs(s.avgWin / s.avgLoss) : s.avgWin;
    const expectancy = (winRate / 100) * s.avgWin - (1 - winRate / 100) * Math.abs(s.avgLoss);

    return {
      totalTrades: s.totalTrades,
      winningTrades: s.winningTrades,
      losingTrades: s.losingTrades,
      winRate,
      grossPnL: s.grossPnL,
      netPnL: s.netPnL,
      avgWin: s.avgWin || 0,
      avgLoss: s.avgLoss || 0,
      largestWin: s.largestWin,
      largestLoss: s.largestLoss,
      profitFactor,
      expectancy,
      avgHoldingPeriod: s.avgHoldingPeriod || 0,
      totalFees: s.totalFees,
    };
  }

  /**
   * Get distinct symbols for user
   */
  async getDistinctSymbols(userId: string): Promise<string[]> {
    return TradeModel.distinct('symbol', { userId, isArchived: false }).exec();
  }

  /**
   * Get distinct tags for user
   */
  async getDistinctTags(userId: string): Promise<string[]> {
    return TradeModel.distinct('tags', { userId, isArchived: false }).exec();
  }

  /**
   * Get trade count for user
   */
  async getCount(userId: string, filter: Partial<TradeFilter> = {}): Promise<number> {
    const mongoFilter: FilterQuery<ITrade> = { userId, isArchived: false };

    if (filter.status) {
      mongoFilter.status = filter.status;
    }

    if (filter.dateRange) {
      mongoFilter.createdAt = {
        $gte: filter.dateRange.start,
        $lte: filter.dateRange.end,
      };
    }

    return TradeModel.countDocuments(mongoFilter).exec();
  }

  /**
   * Import trades from CSV/data
   */
  async importTrades(userId: string, trades: CreateTradeDTO[]): Promise<TradeImportResult> {
    const result: TradeImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < trades.length; i++) {
      try {
        await this.createTrade(userId, trades[i]);
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Get equity curve data
   */
  async getEquityCurve(
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{ date: Date; equity: number; pnl: number }[]> {
    const matchStage: any = { userId, isArchived: false, status: 'CLOSED' };

    if (dateRange) {
      matchStage.closedAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const trades = await TradeModel.find(matchStage)
      .sort({ closedAt: 1 })
      .select('calculations.netPnL closedAt')
      .lean()
      .exec();

    let equity = 0;
    const curve = trades.map((trade: any) => {
      equity += trade.calculations.netPnL;
      return {
        date: trade.closedAt,
        equity,
        pnl: trade.calculations.netPnL,
      };
    });

    return curve;
  }
}
