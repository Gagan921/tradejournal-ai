import { ITradeLeg, ITradeCalculations, ITradeRisk } from '../interfaces';
import { TradeDirection } from '../constants';

/**
 * Calculate average price from legs
 */
export const calculateAveragePrice = (legs: ITradeLeg[]): number => {
  if (legs.length === 0) return 0;

  const totalValue = legs.reduce((sum, leg) => sum + leg.price * leg.quantity, 0);
  const totalQuantity = legs.reduce((sum, leg) => sum + leg.quantity, 0);

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
};

/**
 * Calculate total quantity from legs
 */
export const calculateTotalQuantity = (legs: ITradeLeg[]): number => {
  return legs.reduce((sum, leg) => sum + leg.quantity, 0);
};

/**
 * Calculate total value from legs
 */
export const calculateTotalValue = (legs: ITradeLeg[]): number => {
  return legs.reduce((sum, leg) => sum + leg.price * leg.quantity, 0);
};

/**
 * Calculate PnL for a trade
 */
export const calculatePnL = (
  entries: ITradeLeg[],
  exits: ITradeLeg[],
  direction: TradeDirection,
  fees: number = 0
): { grossPnL: number; netPnL: number } => {
  const totalEntryValue = calculateTotalValue(entries);
  const totalExitValue = calculateTotalValue(exits);
  const totalEntryQty = calculateTotalQuantity(entries);
  const totalExitQty = calculateTotalQuantity(exits);

  if (totalEntryQty === 0 || totalExitQty === 0) {
    return { grossPnL: 0, netPnL: 0 };
  }

  // For partial closes, calculate proportional PnL
  const closedQty = Math.min(totalEntryQty, totalExitQty);
  const avgEntryPrice = calculateAveragePrice(entries);
  const avgExitPrice = calculateAveragePrice(exits);

  let grossPnL = 0;

  if (direction === 'LONG') {
    // Long: (exit - entry) * quantity
    grossPnL = (avgExitPrice - avgEntryPrice) * closedQty;
  } else {
    // Short: (entry - exit) * quantity
    grossPnL = (avgEntryPrice - avgExitPrice) * closedQty;
  }

  const netPnL = grossPnL - fees;

  return { grossPnL, netPnL };
};

/**
 * Calculate return percentage
 */
export const calculateReturnPercent = (
  entries: ITradeLeg[],
  exits: ITradeLeg[],
  direction: TradeDirection
): number => {
  const totalEntryValue = calculateTotalValue(entries);
  const totalExitValue = calculateTotalValue(exits);

  if (totalEntryValue === 0) return 0;

  const { grossPnL } = calculatePnL(entries, exits, direction);

  return (grossPnL / totalEntryValue) * 100;
};

/**
 * Calculate R-multiple (R:R ratio achieved)
 */
export const calculateRMultiple = (
  entries: ITradeLeg[],
  exits: ITradeLeg[],
  direction: TradeDirection,
  stopLoss?: number
): number => {
  if (!stopLoss || entries.length === 0) return 0;

  const avgEntryPrice = calculateAveragePrice(entries);
  const avgExitPrice = calculateAveragePrice(exits);

  // Calculate initial risk (R)
  let initialRisk = 0;
  const totalEntryQty = calculateTotalQuantity(entries);

  if (direction === 'LONG') {
    initialRisk = (avgEntryPrice - stopLoss) * totalEntryQty;
  } else {
    initialRisk = (stopLoss - avgEntryPrice) * totalEntryQty;
  }

  if (initialRisk === 0) return 0;

  // Calculate actual PnL
  let actualPnL = 0;
  if (direction === 'LONG') {
    actualPnL = (avgExitPrice - avgEntryPrice) * totalEntryQty;
  } else {
    actualPnL = (avgEntryPrice - avgExitPrice) * totalEntryQty;
  }

  return actualPnL / initialRisk;
};

/**
 * Calculate holding period in days
 */
export const calculateHoldingPeriod = (entryDate: Date, exitDate?: Date): number => {
  const end = exitDate || new Date();
  const diffTime = Math.abs(end.getTime() - entryDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate position size based on risk
 */
export const calculatePositionSize = (
  accountValue: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number
): number => {
  if (entryPrice === stopLoss) return 0;

  const riskAmount = accountValue * (riskPercent / 100);
  const riskPerShare = Math.abs(entryPrice - stopLoss);

  return Math.floor(riskAmount / riskPerShare);
};

/**
 * Calculate risk/reward ratio
 */
export const calculateRiskRewardRatio = (
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number => {
  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(takeProfit - entryPrice);

  if (risk === 0) return 0;

  return reward / risk;
};

/**
 * Calculate all trade metrics
 */
export const calculateTradeMetrics = (
  entries: ITradeLeg[],
  exits: ITradeLeg[],
  direction: TradeDirection,
  fees: number = 0,
  stopLoss?: number
): ITradeCalculations => {
  const totalEntryQuantity = calculateTotalQuantity(entries);
  const totalExitQuantity = calculateTotalQuantity(exits);
  const avgEntryPrice = calculateAveragePrice(entries);
  const avgExitPrice = calculateAveragePrice(exits);

  const { grossPnL, netPnL } = calculatePnL(entries, exits, direction, fees);
  const returnPercent = calculateReturnPercent(entries, exits, direction);
  const rMultiple = calculateRMultiple(entries, exits, direction, stopLoss);

  const holdingPeriod =
    entries.length > 0
      ? calculateHoldingPeriod(
          entries[0].date,
          exits.length > 0 ? exits[exits.length - 1].date : undefined
        )
      : 0;

  return {
    totalEntryQuantity,
    totalExitQuantity,
    avgEntryPrice,
    avgExitPrice,
    totalFees: fees,
    grossPnL,
    netPnL,
    returnPercent,
    rMultiple,
    holdingPeriod,
  };
};

/**
 * Calculate trade statistics from array of trades
 */
export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number;
  grossPnL: number;
  netPnL: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  expectancy: number;
  avgHoldingPeriod: number;
  totalFees: number;
}

export const calculateTradeStatistics = (
  trades: Array<{ calculations: ITradeCalculations }>
): TradeStats => {
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
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

  const winningTrades = trades.filter((t) => t.calculations.netPnL > 0).length;
  const losingTrades = trades.filter((t) => t.calculations.netPnL < 0).length;
  const breakevenTrades = trades.filter((t) => t.calculations.netPnL === 0).length;

  const wins = trades.filter((t) => t.calculations.netPnL > 0);
  const losses = trades.filter((t) => t.calculations.netPnL < 0);

  const grossPnL = trades.reduce((sum, t) => sum + t.calculations.grossPnL, 0);
  const netPnL = trades.reduce((sum, t) => sum + t.calculations.netPnL, 0);
  const totalFees = trades.reduce((sum, t) => sum + t.calculations.totalFees, 0);

  const totalWinAmount = wins.reduce((sum, t) => sum + t.calculations.netPnL, 0);
  const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + t.calculations.netPnL, 0));

  const avgWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.calculations.netPnL)) : 0;
  const largestLoss =
    losses.length > 0 ? Math.min(...losses.map((t) => t.calculations.netPnL)) : 0;

  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount;

  const winRate = winningTrades / totalTrades;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

  const avgHoldingPeriod =
    trades.reduce((sum, t) => sum + t.calculations.holdingPeriod, 0) / totalTrades;

  return {
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    winRate: winRate * 100,
    grossPnL,
    netPnL,
    avgWin,
    avgLoss,
    largestWin,
    largestLoss,
    profitFactor,
    expectancy,
    avgHoldingPeriod,
    totalFees,
  };
};
