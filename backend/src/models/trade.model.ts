import mongoose, { Schema, Model } from 'mongoose';
import { ITrade, ITradeDocument, ITradeLeg, ITradeCalculations, ITradeRisk, IStrategyReference, ITradeSetup, ITradeScreenshot, ITradeMistake, ITradePsychology, ITradeAIInsight, IChecklistItem, ITradeChecklist, IMarketContext } from '../interfaces';
import { TRADE_CONSTANTS, TradeDirection, TradeStatus, OrderType, Instrument, Market, ExitReason, Timeframe, Mood, MistakeType, MarketCondition } from '../constants';
import { calculateTradeMetrics } from '../utils';

// Trade Leg Schema (Entry/Exit)
const TradeLegSchema = new Schema<ITradeLeg>({
  price: { type: Number, required: [true, 'Price is required'] },
  quantity: { type: Number, required: [true, 'Quantity is required'], min: 0 },
  date: { type: Date, required: [true, 'Date is required'] },
  orderType: { type: String, enum: Object.values(TRADE_CONSTANTS.ORDER_TYPES), default: 'market' },
  notes: { type: String },
}, { _id: true });

// Calculations Schema
const CalculationsSchema = new Schema<ITradeCalculations>({
  totalEntryQuantity: { type: Number, default: 0 },
  totalExitQuantity: { type: Number, default: 0 },
  avgEntryPrice: { type: Number, default: 0 },
  avgExitPrice: { type: Number, default: 0 },
  totalFees: { type: Number, default: 0 },
  grossPnL: { type: Number, default: 0 },
  netPnL: { type: Number, default: 0 },
  returnPercent: { type: Number, default: 0 },
  rMultiple: { type: Number, default: 0 },
  holdingPeriod: { type: Number, default: 0 },
}, { _id: false });

// Risk Schema
const RiskSchema = new Schema<ITradeRisk>({
  initialRisk: { type: Number, default: 0 },
  riskPercent: { type: Number, default: 0 },
  stopLoss: { type: Number },
  takeProfit: { type: Number },
  riskRewardRatio: { type: Number },
  positionSize: { type: Number },
}, { _id: false });

// Strategy Reference Schema
const StrategyReferenceSchema = new Schema<IStrategyReference>({
  _id: { type: Schema.Types.ObjectId, ref: 'Strategy', required: true },
  name: { type: String, required: true },
}, { _id: false });

// Setup Schema
const SetupSchema = new Schema<ITradeSetup>({
  type: { type: String },
  timeframe: { type: String, enum: Object.values(TRADE_CONSTANTS.TIMEFRAMES) },
  entryCriteria: [{ type: String }],
  exitCriteria: [{ type: String }],
}, { _id: false });

// Screenshot Schema
const ScreenshotSchema = new Schema<ITradeScreenshot>({
  url: { type: String, required: true },
  thumbnailUrl: { type: String },
  caption: { type: String },
  type: { type: String, enum: ['entry', 'exit', 'analysis', 'mistake'], default: 'analysis' },
  takenAt: { type: Date, default: Date.now },
}, { _id: true });

// Mistake Schema
const MistakeSchema = new Schema<ITradeMistake>({
  type: { type: String, enum: Object.values(TRADE_CONSTANTS.MISTAKE_TYPES), required: true },
  description: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
}, { _id: false });

// Psychology Schema
const PsychologySchema = new Schema<ITradePsychology>({
  preTradeMood: { type: String, enum: Object.values(TRADE_CONSTANTS.MOODS) },
  postTradeMood: { type: String, enum: Object.values(TRADE_CONSTANTS.MOODS) },
  disciplineScore: { type: Number, min: 1, max: 10 },
  notes: { type: String },
  mistakes: [MistakeSchema],
}, { _id: false });

// AI Insight Schema
const AIInsightSchema = new Schema<ITradeAIInsight>({
  type: { type: String, enum: ['mistake', 'pattern', 'suggestion', 'risk'], required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1 },
  generatedAt: { type: Date, default: Date.now },
  acknowledged: { type: Boolean, default: false },
  helpful: { type: Boolean },
}, { _id: true });

// Checklist Item Schema
const ChecklistItemSchema = new Schema<IChecklistItem>({
  item: { type: String, required: true },
  checked: { type: Boolean, default: false },
  checkedAt: { type: Date },
}, { _id: false });

// Checklist Schema
const ChecklistSchema = new Schema<ITradeChecklist>({
  preTrade: [ChecklistItemSchema],
  postTrade: [ChecklistItemSchema],
}, { _id: false });

// Market Context Schema
const MarketContextSchema = new Schema<IMarketContext>({
  marketTrend: { type: String, enum: ['bullish', 'bearish', 'neutral'] },
  sector: { type: String },
  marketCondition: { type: String, enum: Object.values(TRADE_CONSTANTS.MARKET_CONDITIONS) },
  newsImpact: { type: String },
  correlation: [{ type: String }],
}, { _id: false });

// Main Trade Schema
const TradeSchema = new Schema<ITradeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    instrument: {
      type: String,
      enum: Object.values(TRADE_CONSTANTS.INSTRUMENTS),
      default: 'stock',
    },
    market: {
      type: String,
      enum: Object.values(TRADE_CONSTANTS.MARKETS),
      default: 'us_equity',
    },
    direction: {
      type: String,
      enum: Object.values(TRADE_CONSTANTS.DIRECTIONS),
      required: [true, 'Direction is required'],
    },
    status: {
      type: String,
      enum: Object.values(TRADE_CONSTANTS.STATUS),
      default: 'OPEN',
    },
    entries: {
      type: [TradeLegSchema],
      required: [true, 'At least one entry is required'],
      validate: {
        validator: (entries: ITradeLeg[]) => entries.length > 0,
        message: 'At least one entry is required',
      },
    },
    exits: {
      type: [TradeLegSchema],
      default: [],
    },
    calculations: {
      type: CalculationsSchema,
      default: () => ({}),
    },
    risk: {
      type: RiskSchema,
      default: () => ({}),
    },
    strategy: {
      type: StrategyReferenceSchema,
    },
    setup: {
      type: SetupSchema,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    screenshots: {
      type: [ScreenshotSchema],
      default: [],
    },
    psychology: {
      type: PsychologySchema,
    },
    aiInsights: {
      type: [AIInsightSchema],
      default: [],
    },
    checklist: {
      type: ChecklistSchema,
    },
    marketContext: {
      type: MarketContextSchema,
    },
    parentTradeId: {
      type: Schema.Types.ObjectId,
      ref: 'Trade',
    },
    childTradeIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Trade',
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    importedFrom: {
      type: String,
    },
    brokerTradeId: {
      type: String,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Indexes
TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, status: 1 });
TradeSchema.index({ userId: 1, symbol: 1 });
TradeSchema.index({ userId: 1, 'strategy._id': 1 });
TradeSchema.index({ userId: 1, tags: 1 });
TradeSchema.index({ userId: 1, 'calculations.netPnL': 1 });
TradeSchema.index({ userId: 1, closedAt: -1 });
TradeSchema.index({ 'aiInsights.type': 1 }, { sparse: true });

// Virtual: isWinning
TradeSchema.virtual('isWinning').get(function (this: ITradeDocument) {
  return this.calculations?.netPnL > 0;
});

// Virtual: isClosed
TradeSchema.virtual('isClosed').get(function (this: ITradeDocument) {
  return this.status === 'CLOSED';
});

// Instance method: calculate PnL
TradeSchema.methods.calculatePnL = function (this: ITradeDocument): void {
  const metrics = calculateTradeMetrics(
    this.entries,
    this.exits,
    this.direction,
    this.risk?.stopLoss
  );

  this.calculations = {
    ...this.calculations,
    ...metrics,
  };

  // Update status based on entries and exits
  const totalEntryQty = metrics.totalEntryQuantity;
  const totalExitQty = metrics.totalExitQuantity;

  if (totalExitQty === 0) {
    this.status = 'OPEN';
  } else if (totalExitQty >= totalEntryQty) {
    this.status = 'CLOSED';
    if (!this.closedAt) {
      this.closedAt = new Date();
    }
  } else {
    this.status = 'PARTIAL';
  }
};

// Instance method: add entry
TradeSchema.methods.addEntry = function (this: ITradeDocument, entry: ITradeLeg): void {
  this.entries.push(entry);
  this.calculatePnL();
};

// Instance method: add exit
TradeSchema.methods.addExit = function (this: ITradeDocument, exit: ITradeLeg): void {
  this.exits.push(exit);
  this.calculatePnL();
};

// Pre-save middleware
TradeSchema.pre('save', function (next) {
  // Calculate PnL before saving
  if (this.isModified('entries') || this.isModified('exits')) {
    this.calculatePnL();
  }

  // Update closedAt when trade is closed
  if (this.status === 'CLOSED' && !this.closedAt) {
    this.closedAt = new Date();
  }

  next();
});

// Static method: find by user
TradeSchema.statics.findByUser = function (userId: string, options: any = {}) {
  const query = this.find({ userId, isArchived: false });

  if (options.status) {
    query.where('status', options.status);
  }

  if (options.symbol) {
    query.where('symbol', options.symbol.toUpperCase());
  }

  if (options.strategyId) {
    query.where('strategy._id', options.strategyId);
  }

  if (options.tags && options.tags.length > 0) {
    query.where('tags').in(options.tags);
  }

  if (options.dateRange) {
    query.where('createdAt').gte(options.dateRange.start).lte(options.dateRange.end);
  }

  return query.sort({ createdAt: -1 });
};

// Static method: get statistics
TradeSchema.statics.getStatistics = async function (userId: string, dateRange?: { start: Date; end: Date }) {
  const matchStage: any = { userId };

  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  const stats = await this.aggregate([
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
  const expectancy = winRate / 100 * s.avgWin - (1 - winRate / 100) * Math.abs(s.avgLoss);

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
};

// Create and export model
export const TradeModel: Model<ITradeDocument> = mongoose.model<ITradeDocument>('Trade', TradeSchema);

export default TradeModel;
