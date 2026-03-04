import { Document, Types } from 'mongoose';
import { IBaseEntity } from './common.interface';

// Portfolio Holding
export interface IPortfolioHolding {
  symbol: string;
  instrument: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  allocation: number;
  lastUpdated: Date;
}

// Cash
export interface IPortfolioCash {
  available: number;
  reserved: number;
  currency: string;
}

// Portfolio Summary
export interface IPortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalUnrealizedPnL: number;
  totalRealizedPnL: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

// Asset Allocation
export interface IAssetAllocation {
  byAssetClass: Array<{
    class: string;
    value: number;
    percentage: number;
  }>;
  bySector: Array<{
    sector: string;
    value: number;
    percentage: number;
  }>;
  bySymbol: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
}

// Portfolio Snapshot
export interface IPortfolioSnapshot {
  date: Date;
  totalValue: number;
  cash: number;
  holdingsValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
}

// Portfolio Settings
export interface IPortfolioSettings {
  autoSync: boolean;
  syncBroker?: string;
  alertsEnabled: boolean;
  rebalanceThreshold: number;
}

// Main Portfolio Interface
export interface IPortfolio extends IBaseEntity {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  type: 'live' | 'paper' | 'backtest';
  baseCurrency: string;
  holdings: IPortfolioHolding[];
  cash: IPortfolioCash;
  summary: IPortfolioSummary;
  allocation: IAssetAllocation;
  snapshots: IPortfolioSnapshot[];
  settings: IPortfolioSettings;
  isActive: boolean;
}

// Portfolio Document (Mongoose)
export interface IPortfolioDocument extends IPortfolio, Document {
  addHolding(holding: Omit<IPortfolioHolding, 'marketValue' | 'unrealizedPnL' | 'unrealizedPnLPercent' | 'allocation' | 'lastUpdated'>): void;
  updateHolding(symbol: string, updates: Partial<IPortfolioHolding>): void;
  removeHolding(symbol: string): void;
  calculateSummary(): void;
  calculateAllocation(): void;
}

// Portfolio DTOs
export interface CreatePortfolioDTO {
  name: string;
  description?: string;
  type?: 'live' | 'paper' | 'backtest';
  baseCurrency?: string;
  initialCash?: number;
}

export interface UpdatePortfolioDTO {
  name?: string;
  description?: string;
  settings?: Partial<IPortfolioSettings>;
}

export interface AddHoldingDTO {
  symbol: string;
  instrument?: string;
  quantity: number;
  avgPrice: number;
  currentPrice?: number;
}

export interface UpdateHoldingDTO {
  quantity?: number;
  avgPrice?: number;
  currentPrice?: number;
}

// Portfolio Response
export interface PortfolioResponse extends Omit<IPortfolio, 'userId'> {
  id: string;
  userId: string;
}

// Portfolio Performance
export interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weekChange: number;
  weekChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
}
