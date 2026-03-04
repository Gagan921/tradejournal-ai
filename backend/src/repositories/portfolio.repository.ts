import { BaseRepository } from './base.repository';
import { PortfolioModel } from '../models';
import { IPortfolio, IPortfolioDocument, CreatePortfolioDTO, UpdatePortfolioDTO, AddHoldingDTO, UpdateHoldingDTO, PortfolioPerformance } from '../interfaces';
import { NotFoundError, ValidationError } from '../utils';

/**
 * Portfolio repository
 */
export class PortfolioRepository extends BaseRepository<IPortfolio> {
  constructor() {
    super(PortfolioModel as any);
  }

  /**
   * Find portfolios by user
   */
  async findByUser(userId: string, type?: string): Promise<IPortfolio[]> {
    return PortfolioModel.find({ userId, isActive: true, ...(type && { type }) })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<IPortfolio[]>;
  }

  /**
   * Find portfolio by ID and user
   */
  async findByIdAndUser(id: string, userId: string): Promise<IPortfolio | null> {
    return PortfolioModel.findOne({ _id: id, userId, isActive: true })
      .lean()
      .exec() as Promise<IPortfolio | null>;
  }

  /**
   * Get default portfolio for user
   */
  async getDefault(userId: string): Promise<IPortfolio | null> {
    return PortfolioModel.findOne({ userId, isActive: true, type: 'live' })
      .sort({ createdAt: 1 })
      .lean()
      .exec() as Promise<IPortfolio | null>;
  }

  /**
   * Create portfolio
   */
  async createPortfolio(userId: string, data: CreatePortfolioDTO): Promise<IPortfolio> {
    const portfolio = await this.create({
      userId,
      name: data.name,
      description: data.description,
      type: data.type || 'live',
      baseCurrency: data.baseCurrency || 'USD',
      cash: {
        available: data.initialCash || 0,
        reserved: 0,
        currency: data.baseCurrency || 'USD',
      },
      holdings: [],
      summary: {
        totalValue: data.initialCash || 0,
        totalCost: 0,
        totalUnrealizedPnL: 0,
        totalRealizedPnL: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
      },
      allocation: {
        byAssetClass: data.initialCash ? [{ class: 'cash', value: data.initialCash, percentage: 100 }] : [],
        bySector: [],
        bySymbol: [],
      },
      snapshots: [],
      settings: {
        autoSync: false,
        alertsEnabled: true,
        rebalanceThreshold: 5,
      },
    } as Partial<IPortfolio>);

    return portfolio;
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(id: string, userId: string, data: UpdatePortfolioDTO): Promise<IPortfolio | null> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.settings !== undefined) updateData.settings = data.settings;

    return PortfolioModel.findOneAndUpdate(
      { _id: id, userId, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .lean()
      .exec() as Promise<IPortfolio | null>;
  }

  /**
   * Add holding to portfolio
   */
  async addHolding(
    portfolioId: string,
    userId: string,
    holding: AddHoldingDTO
  ): Promise<IPortfolio | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    }).exec();

    if (!portfolio) return null;

    portfolio.addHolding({
      symbol: holding.symbol.toUpperCase(),
      instrument: holding.instrument || 'stock',
      quantity: holding.quantity,
      avgPrice: holding.avgPrice,
      currentPrice: holding.currentPrice || holding.avgPrice,
    });

    await portfolio.save();
    return portfolio.toObject() as IPortfolio;
  }

  /**
   * Update holding in portfolio
   */
  async updateHolding(
    portfolioId: string,
    userId: string,
    symbol: string,
    updates: UpdateHoldingDTO
  ): Promise<IPortfolio | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    }).exec();

    if (!portfolio) return null;

    portfolio.updateHolding(symbol.toUpperCase(), updates);
    await portfolio.save();

    return portfolio.toObject() as IPortfolio;
  }

  /**
   * Remove holding from portfolio
   */
  async removeHolding(
    portfolioId: string,
    userId: string,
    symbol: string
  ): Promise<IPortfolio | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    }).exec();

    if (!portfolio) return null;

    portfolio.removeHolding(symbol.toUpperCase());
    await portfolio.save();

    return portfolio.toObject() as IPortfolio;
  }

  /**
   * Update cash
   */
  async updateCash(
    portfolioId: string,
    userId: string,
    amount: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<IPortfolio | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    }).exec();

    if (!portfolio) return null;

    if (operation === 'add') {
      portfolio.cash.available += amount;
    } else if (operation === 'subtract') {
      portfolio.cash.available -= amount;
    } else if (operation === 'set') {
      portfolio.cash.available = amount;
    }

    portfolio.calculateSummary();
    portfolio.calculateAllocation();
    await portfolio.save();

    return portfolio.toObject() as IPortfolio;
  }

  /**
   * Update prices for holdings
   */
  async updatePrices(
    portfolioId: string,
    userId: string,
    prices: Record<string, number>
  ): Promise<IPortfolio | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    }).exec();

    if (!portfolio) return null;

    Object.entries(prices).forEach(([symbol, price]) => {
      const holding = portfolio.holdings.find((h) => h.symbol === symbol.toUpperCase());
      if (holding) {
        holding.currentPrice = price;
        holding.lastUpdated = new Date();
      }
    });

    portfolio.calculateSummary();
    portfolio.calculateAllocation();
    await portfolio.save();

    return portfolio.toObject() as IPortfolio;
  }

  /**
   * Add snapshot
   */
  async addSnapshot(portfolioId: string, userId: string): Promise<IPortfolio | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    }).exec();

    if (!portfolio) return null;

    const snapshot = {
      date: new Date(),
      totalValue: portfolio.summary.totalValue,
      cash: portfolio.cash.available,
      holdingsValue: portfolio.summary.totalValue - portfolio.cash.available,
      realizedPnL: portfolio.summary.totalRealizedPnL,
      unrealizedPnL: portfolio.summary.totalUnrealizedPnL,
    };

    // Keep only last 90 snapshots (3 months of daily snapshots)
    if (portfolio.snapshots.length >= 90) {
      portfolio.snapshots.shift();
    }

    portfolio.snapshots.push(snapshot);
    await portfolio.save();

    return portfolio.toObject() as IPortfolio;
  }

  /**
   * Archive portfolio
   */
  async archivePortfolio(id: string, userId: string): Promise<boolean> {
    const result = await PortfolioModel.findOneAndUpdate(
      { _id: id, userId, isActive: true },
      { isActive: false },
      { new: true }
    ).exec();

    return result !== null;
  }

  /**
   * Get performance metrics
   */
  async getPerformance(portfolioId: string, userId: string): Promise<PortfolioPerformance | null> {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
    })
      .select('snapshots summary')
      .lean()
      .exec();

    if (!portfolio) return null;

    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    const oneYear = 365 * oneDay;

    const snapshots = portfolio.snapshots || [];

    const getValueAt = (timeAgo: number): number | null => {
      const targetDate = new Date(now.getTime() - timeAgo);
      const snapshot = snapshots
        .filter((s) => new Date(s.date) <= targetDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      return snapshot ? snapshot.totalValue : null;
    };

    const currentValue = portfolio.summary.totalValue;
    const dayAgoValue = getValueAt(oneDay);
    const weekAgoValue = getValueAt(oneWeek);
    const monthAgoValue = getValueAt(oneMonth);
    const yearAgoValue = getValueAt(oneYear);

    const calculateChange = (previousValue: number | null): { change: number; percent: number } => {
      if (!previousValue || previousValue === 0) return { change: 0, percent: 0 };
      const change = currentValue - previousValue;
      return {
        change,
        percent: (change / previousValue) * 100,
      };
    };

    const dayChange = calculateChange(dayAgoValue);
    const weekChange = calculateChange(weekAgoValue);
    const monthChange = calculateChange(monthAgoValue);
    const yearChange = calculateChange(yearAgoValue);

    return {
      totalReturn: portfolio.summary.totalReturn,
      totalReturnPercent: portfolio.summary.totalReturnPercent,
      dayChange: dayChange.change,
      dayChangePercent: dayChange.percent,
      weekChange: weekChange.change,
      weekChangePercent: weekChange.percent,
      monthChange: monthChange.change,
      monthChangePercent: monthChange.percent,
      yearChange: yearChange.change,
      yearChangePercent: yearChange.percent,
    };
  }

  /**
   * Get holdings by symbol
   */
  async getHolding(portfolioId: string, userId: string, symbol: string) {
    const portfolio = await PortfolioModel.findOne({
      _id: portfolioId,
      userId,
      isActive: true,
      'holdings.symbol': symbol.toUpperCase(),
    })
      .select('holdings.$')
      .lean()
      .exec();

    return portfolio?.holdings?.[0] || null;
  }
}
