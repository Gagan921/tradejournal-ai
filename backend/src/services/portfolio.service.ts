import { PortfolioRepository } from '../repositories';
import { CreatePortfolioDTO, UpdatePortfolioDTO, AddHoldingDTO, UpdateHoldingDTO, IPortfolio } from '../interfaces';
import { NotFoundError, ValidationError } from '../utils';
import { logger } from '../config';

/**
 * Portfolio service
 */
export class PortfolioService {
  constructor(private portfolioRepository: PortfolioRepository) {}

  /**
   * Create new portfolio
   */
  async createPortfolio(userId: string, data: CreatePortfolioDTO): Promise<IPortfolio> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Portfolio name is required');
    }

    const portfolio = await this.portfolioRepository.createPortfolio(userId, data);

    logger.info('Portfolio created', { userId, portfolioId: portfolio._id, name: portfolio.name });

    return portfolio;
  }

  /**
   * Get all portfolios for user
   */
  async getPortfolios(userId: string, type?: string): Promise<IPortfolio[]> {
    return this.portfolioRepository.findByUser(userId, type);
  }

  /**
   * Get portfolio by ID
   */
  async getPortfolioById(portfolioId: string, userId: string): Promise<IPortfolio> {
    const portfolio = await this.portfolioRepository.findByIdAndUser(portfolioId, userId);

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    return portfolio;
  }

  /**
   * Get default portfolio
   */
  async getDefaultPortfolio(userId: string): Promise<IPortfolio | null> {
    return this.portfolioRepository.getDefault(userId);
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(
    portfolioId: string,
    userId: string,
    data: UpdatePortfolioDTO
  ): Promise<IPortfolio> {
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Portfolio name cannot be empty');
    }

    const portfolio = await this.portfolioRepository.updatePortfolio(portfolioId, userId, data);

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    logger.info('Portfolio updated', { userId, portfolioId });

    return portfolio;
  }

  /**
   * Delete portfolio (archive)
   */
  async deletePortfolio(portfolioId: string, userId: string): Promise<void> {
    const success = await this.portfolioRepository.archivePortfolio(portfolioId, userId);

    if (!success) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    logger.info('Portfolio archived', { userId, portfolioId });
  }

  /**
   * Add holding to portfolio
   */
  async addHolding(
    portfolioId: string,
    userId: string,
    data: AddHoldingDTO
  ): Promise<IPortfolio> {
    // Validate input
    if (!data.symbol || data.symbol.trim().length === 0) {
      throw new ValidationError('Symbol is required');
    }

    if (data.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than 0');
    }

    if (data.avgPrice <= 0) {
      throw new ValidationError('Average price must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.addHolding(portfolioId, userId, data);

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    logger.info('Holding added to portfolio', {
      userId,
      portfolioId,
      symbol: data.symbol,
      quantity: data.quantity,
    });

    return portfolio;
  }

  /**
   * Update holding in portfolio
   */
  async updateHolding(
    portfolioId: string,
    userId: string,
    symbol: string,
    data: UpdateHoldingDTO
  ): Promise<IPortfolio> {
    if (data.quantity !== undefined && data.quantity < 0) {
      throw new ValidationError('Quantity cannot be negative');
    }

    if (data.avgPrice !== undefined && data.avgPrice <= 0) {
      throw new ValidationError('Average price must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.updateHolding(
      portfolioId,
      userId,
      symbol,
      data
    );

    if (!portfolio) {
      throw new NotFoundError('Portfolio or holding');
    }

    logger.info('Holding updated', { userId, portfolioId, symbol });

    return portfolio;
  }

  /**
   * Remove holding from portfolio
   */
  async removeHolding(portfolioId: string, userId: string, symbol: string): Promise<IPortfolio> {
    const portfolio = await this.portfolioRepository.removeHolding(portfolioId, userId, symbol);

    if (!portfolio) {
      throw new NotFoundError('Portfolio or holding');
    }

    logger.info('Holding removed from portfolio', { userId, portfolioId, symbol });

    return portfolio;
  }

  /**
   * Deposit cash
   */
  async depositCash(portfolioId: string, userId: string, amount: number): Promise<IPortfolio> {
    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.updateCash(portfolioId, userId, amount, 'add');

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    logger.info('Cash deposited', { userId, portfolioId, amount });

    return portfolio;
  }

  /**
   * Withdraw cash
   */
  async withdrawCash(portfolioId: string, userId: string, amount: number): Promise<IPortfolio> {
    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const portfolio = await this.portfolioRepository.findByIdAndUser(portfolioId, userId);

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    if (portfolio.cash.available < amount) {
      throw new ValidationError('Insufficient cash available');
    }

    const updated = await this.portfolioRepository.updateCash(
      portfolioId,
      userId,
      amount,
      'subtract'
    );

    logger.info('Cash withdrawn', { userId, portfolioId, amount });

    return updated!;
  }

  /**
   * Update prices
   */
  async updatePrices(
    portfolioId: string,
    userId: string,
    prices: Record<string, number>
  ): Promise<IPortfolio> {
    const portfolio = await this.portfolioRepository.updatePrices(portfolioId, userId, prices);

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    return portfolio;
  }

  /**
   * Get performance metrics
   */
  async getPerformance(portfolioId: string, userId: string) {
    const performance = await this.portfolioRepository.getPerformance(portfolioId, userId);

    if (!performance) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    return performance;
  }

  /**
   * Sync portfolio with trades
   * Updates holdings based on closed trades
   */
  async syncWithTrades(portfolioId: string, userId: string, trades: any[]): Promise<IPortfolio> {
    const portfolio = await this.portfolioRepository.findByIdAndUser(portfolioId, userId);

    if (!portfolio) {
      throw new NotFoundError('Portfolio', portfolioId);
    }

    // Process trades to update holdings
    for (const trade of trades) {
      if (trade.status !== 'CLOSED') continue;

      const symbol = trade.symbol;
      const netPnL = trade.calculations?.netPnL || 0;
      const direction = trade.direction;
      const totalQuantity = trade.calculations?.totalEntryQuantity || 0;

      // Find or create holding
      let holding = portfolio.holdings.find((h) => h.symbol === symbol);

      if (direction === 'LONG') {
        if (netPnL > 0) {
          // Profit - add to realized PnL
          // This is simplified - in reality you'd track cost basis
        }
      }

      // Update cash based on trade PnL
      if (netPnL !== 0) {
        await this.portfolioRepository.updateCash(
          portfolioId,
          userId,
          netPnL,
          netPnL > 0 ? 'add' : 'subtract'
        );
      }
    }

    // Recalculate portfolio
    const updated = await this.portfolioRepository.findByIdAndUser(portfolioId, userId);
    return updated!;
  }
}
