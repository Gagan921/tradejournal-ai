import { Document, Types } from 'mongoose';
import { IBaseEntity, DateRange, PaginatedResult, PaginationParams } from './common.interface';
import {
  TradeDirection,
  TradeStatus,
  OrderType,
  Instrument,
  Market,
  ExitReason,
  Timeframe,
  Mood,
  MistakeType,
  MarketCondition,
} from '../constants';

// Entry/Exit Leg
export interface ITradeLeg {
  _id?: Types.ObjectId;
  price: number;
  quantity: number;
  date: Date;
  orderType: OrderType;
  notes?: string;
}

// Trade Calculations
export interface ITradeCalculations {
  totalEntryQuantity: number;
  totalExitQuantity: number;
  avgEntryPrice: number;
  avgExitPrice: number;
  totalFees: number;
  grossPnL: number;
  netPnL: number;
  returnPercent: number;
  rMultiple: number;
  holdingPeriod: number; // days
}

// Risk Management
export interface ITradeRisk {
  initialRisk: number;
  riskPercent: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
  positionSize?: number;
}

// Strategy Reference
export interface IStrategyReference {
  _id: Types.ObjectId;
  name: string;
}

// Setup
export interface ITradeSetup {
  type?: string;
  timeframe?: Timeframe;
  entryCriteria?: string[];
  exitCriteria?: string[];
}

// Screenshot
export interface ITradeScreenshot {
  _id?: Types.ObjectId;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  type: 'entry' | 'exit' | 'analysis' | 'mistake';
  takenAt?: Date;
}

// Mistake
export interface ITradeMistake {
  type: MistakeType;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Psychology
export interface ITradePsychology {
  preTradeMood?: Mood;
  postTradeMood?: Mood;
  disciplineScore?: number;
  notes?: string;
  mistakes?: ITradeMistake[];
}

// AI Insight
export interface ITradeAIInsight {
  _id?: Types.ObjectId;
  type: 'mistake' | 'pattern' | 'suggestion' | 'risk';
  category: string;
  title: string;
  description: string;
  confidence: number;
  generatedAt: Date;
  acknowledged?: boolean;
  helpful?: boolean;
}

// Checklist Item
export interface IChecklistItem {
  item: string;
  checked: boolean;
  checkedAt?: Date;
}

// Checklist
export interface ITradeChecklist {
  preTrade?: IChecklistItem[];
  postTrade?: IChecklistItem[];
}

// Market Context
export interface IMarketContext {
  marketTrend?: 'bullish' | 'bearish' | 'neutral';
  sector?: string;
  marketCondition?: MarketCondition;
  newsImpact?: string;
  correlation?: string[];
}

// Main Trade Interface
export interface ITrade extends IBaseEntity {
  userId: Types.ObjectId;
  symbol: string;
  instrument: Instrument;
  market: Market;
  direction: TradeDirection;
  status: TradeStatus;
  entries: ITradeLeg[];
  exits: ITradeLeg[];
  calculations: ITradeCalculations;
  risk: ITradeRisk;
  strategy?: IStrategyReference;
  setup?: ITradeSetup;
  tags: string[];
  screenshots: ITradeScreenshot[];
  psychology?: ITradePsychology;
  aiInsights: ITradeAIInsight[];
  checklist?: ITradeChecklist;
  marketContext?: IMarketContext;
  parentTradeId?: Types.ObjectId;
  childTradeIds: Types.ObjectId[];
  isArchived: boolean;
  importedFrom?: string;
  brokerTradeId?: string;
  closedAt?: Date;
}

// Trade Document (Mongoose)
export interface ITradeDocument extends ITrade, Document {
  calculatePnL(): void;
  isWinning(): boolean;
  isClosed(): boolean;
  addEntry(entry: ITradeLeg): void;
  addExit(exit: ITradeLeg): void;
}

// Trade DTOs
export interface CreateTradeDTO {
  symbol: string;
  instrument?: Instrument;
  market?: Market;
  direction: TradeDirection;
  entries: Omit<ITradeLeg, '_id'>[];
  exits?: Omit<ITradeLeg, '_id'>[];
  risk?: Partial<ITradeRisk>;
  strategyId?: string;
  setup?: ITradeSetup;
  tags?: string[];
  psychology?: Partial<ITradePsychology>;
  marketContext?: Partial<IMarketContext>;
  checklist?: ITradeChecklist;
}

export interface UpdateTradeDTO {
  entries?: Omit<ITradeLeg, '_id'>[];
  exits?: Omit<ITradeLeg, '_id'>[];
  risk?: Partial<ITradeRisk>;
  strategyId?: string;
  setup?: ITradeSetup;
  tags?: string[];
  psychology?: Partial<ITradePsychology>;
  marketContext?: Partial<IMarketContext>;
  checklist?: ITradeChecklist;
}

export interface AddScreenshotDTO {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  type: 'entry' | 'exit' | 'analysis' | 'mistake';
}

// Trade Filter
export interface TradeFilter {
  status?: TradeStatus;
  direction?: TradeDirection;
  symbol?: string;
  instrument?: Instrument;
  strategyId?: string;
  tags?: string[];
  dateRange?: DateRange;
  minPnL?: number;
  maxPnL?: number;
  isArchived?: boolean;
}

// Trade List Query
export interface TradeListQuery extends PaginationParams {
  filter?: TradeFilter;
}

// Trade Response
export interface TradeResponse extends Omit<ITrade, 'userId'> {
  id: string;
  userId: string;
  isWinning: boolean;
}

// Trade Statistics
export interface TradeStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
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

// Trade Import
export interface TradeImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}
