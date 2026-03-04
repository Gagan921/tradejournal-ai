import mongoose, { Schema, Model } from 'mongoose';
import { IPortfolio, IPortfolioDocument, IPortfolioHolding, IPortfolioCash, IPortfolioSummary, IAssetAllocation, IPortfolioSnapshot, IPortfolioSettings } from '../interfaces';

// Portfolio Holding Schema
const PortfolioHoldingSchema = new Schema<IPortfolioHolding>({
  symbol: { type: String, required: true, uppercase: true },
  instrument: { type: String, default: 'stock' },
  quantity: { type: Number, required: true, default: 0 },
  avgPrice: { type: Number, required: true, default: 0 },
  currentPrice: { type: Number, default: 0 },
  marketValue: { type: Number, default: 0 },
  unrealizedPnL: { type: Number, default: 0 },
  unrealizedPnLPercent: { type: Number, default: 0 },
  allocation: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

// Cash Schema
const CashSchema = new Schema<IPortfolioCash>({
  available: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
}, { _id: false });

// Summary Schema
const SummarySchema = new Schema<IPortfolioSummary>({
  totalValue: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  totalUnrealizedPnL: { type: Number, default: 0 },
  totalRealizedPnL: { type: Number, default: 0 },
  totalReturn: { type: Number, default: 0 },
  totalReturnPercent: { type: Number, default: 0 },
  dayChange: { type: Number, default: 0 },
  dayChangePercent: { type: Number, default: 0 },
}, { _id: false });

// Asset Allocation Schema
const AssetAllocationSchema = new Schema<IAssetAllocation>({
  byAssetClass: [{
    class: { type: String, required: true },
    value: { type: Number, required: true },
    percentage: { type: Number, required: true },
  }],
  bySector: [{
    sector: { type: String, required: true },
    value: { type: Number, required: true },
    percentage: { type: Number, required: true },
  }],
  bySymbol: [{
    symbol: { type: String, required: true },
    value: { type: Number, required: true },
    percentage: { type: Number, required: true },
  }],
}, { _id: false });

// Snapshot Schema
const SnapshotSchema = new Schema<IPortfolioSnapshot>({
  date: { type: Date, required: true },
  totalValue: { type: Number, required: true },
  cash: { type: Number, required: true },
  holdingsValue: { type: Number, required: true },
  realizedPnL: { type: Number, default: 0 },
  unrealizedPnL: { type: Number, default: 0 },
}, { _id: false });

// Settings Schema
const SettingsSchema = new Schema<IPortfolioSettings>({
  autoSync: { type: Boolean, default: false },
  syncBroker: { type: String },
  alertsEnabled: { type: Boolean, default: true },
  rebalanceThreshold: { type: Number, default: 5 },
}, { _id: false });

// Main Portfolio Schema
const PortfolioSchema = new Schema<IPortfolioDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Portfolio name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['live', 'paper', 'backtest'],
      default: 'live',
    },
    baseCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    holdings: {
      type: [PortfolioHoldingSchema],
      default: [],
    },
    cash: {
      type: CashSchema,
      default: () => ({ available: 0, reserved: 0, currency: 'USD' }),
    },
    summary: {
      type: SummarySchema,
      default: () => ({}),
    },
    allocation: {
      type: AssetAllocationSchema,
      default: () => ({ byAssetClass: [], bySector: [], bySymbol: [] }),
    },
    snapshots: {
      type: [SnapshotSchema],
      default: [],
    },
    settings: {
      type: SettingsSchema,
      default: () => ({}),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
PortfolioSchema.index({ userId: 1, type: 1 });
PortfolioSchema.index({ userId: 1, isActive: 1 });

// Virtual: holdings count
PortfolioSchema.virtual('holdingsCount').get(function (this: IPortfolioDocument) {
  return this.holdings.length;
});

// Virtual: is empty
PortfolioSchema.virtual('isEmpty').get(function (this: IPortfolioDocument) {
  return this.holdings.length === 0 && this.cash.available === 0;
});

// Instance method: add holding
PortfolioSchema.methods.addHolding = function (
  this: IPortfolioDocument,
  holding: Omit<IPortfolioHolding, 'marketValue' | 'unrealizedPnL' | 'unrealizedPnLPercent' | 'allocation' | 'lastUpdated'>
): void {
  const existingIndex = this.holdings.findIndex((h) => h.symbol === holding.symbol);

  if (existingIndex >= 0) {
    // Update existing holding (average down/up)
    const existing = this.holdings[existingIndex];
    const totalQuantity = existing.quantity + holding.quantity;
    const totalCost = existing.avgPrice * existing.quantity + holding.avgPrice * holding.quantity;
    existing.avgPrice = totalCost / totalQuantity;
    existing.quantity = totalQuantity;
    existing.currentPrice = holding.currentPrice || existing.currentPrice;
    existing.lastUpdated = new Date();
  } else {
    // Add new holding
    this.holdings.push({
      ...holding,
      marketValue: holding.quantity * (holding.currentPrice || holding.avgPrice),
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      allocation: 0,
      lastUpdated: new Date(),
    });
  }

  this.calculateSummary();
  this.calculateAllocation();
};

// Instance method: update holding
PortfolioSchema.methods.updateHolding = function (
  this: IPortfolioDocument,
  symbol: string,
  updates: Partial<IPortfolioHolding>
): void {
  const holding = this.holdings.find((h) => h.symbol === symbol);
  if (!holding) return;

  if (updates.quantity !== undefined) holding.quantity = updates.quantity;
  if (updates.avgPrice !== undefined) holding.avgPrice = updates.avgPrice;
  if (updates.currentPrice !== undefined) holding.currentPrice = updates.currentPrice;

  holding.lastUpdated = new Date();
  this.calculateSummary();
  this.calculateAllocation();
};

// Instance method: remove holding
PortfolioSchema.methods.removeHolding = function (this: IPortfolioDocument, symbol: string): void {
  this.holdings = this.holdings.filter((h) => h.symbol !== symbol);
  this.calculateSummary();
  this.calculateAllocation();
};

// Instance method: calculate summary
PortfolioSchema.methods.calculateSummary = function (this: IPortfolioDocument): void {
  // Calculate holding metrics
  this.holdings.forEach((holding) => {
    holding.marketValue = holding.quantity * holding.currentPrice;
    holding.unrealizedPnL = holding.marketValue - holding.quantity * holding.avgPrice;
    holding.unrealizedPnLPercent = holding.avgPrice > 0
      ? (holding.unrealizedPnL / (holding.quantity * holding.avgPrice)) * 100
      : 0;
  });

  // Calculate portfolio summary
  const holdingsValue = this.holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const holdingsCost = this.holdings.reduce((sum, h) => sum + h.quantity * h.avgPrice, 0);
  const totalUnrealizedPnL = this.holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);

  this.summary.totalValue = holdingsValue + this.cash.available;
  this.summary.totalCost = holdingsCost;
  this.summary.totalUnrealizedPnL = totalUnrealizedPnL;
  this.summary.totalReturn = totalUnrealizedPnL + this.summary.totalRealizedPnL;
  this.summary.totalReturnPercent = holdingsCost > 0
    ? (this.summary.totalReturn / holdingsCost) * 100
    : 0;
};

// Instance method: calculate allocation
PortfolioSchema.methods.calculateAllocation = function (this: IPortfolioDocument): void {
  const totalValue = this.summary.totalValue;

  if (totalValue === 0) return;

  // Calculate by symbol
  this.allocation.bySymbol = this.holdings.map((h) => ({
    symbol: h.symbol,
    value: h.marketValue,
    percentage: (h.marketValue / totalValue) * 100,
  }));

  // Update holding allocations
  this.holdings.forEach((holding) => {
    holding.allocation = (holding.marketValue / totalValue) * 100;
  });

  // Calculate by asset class (simplified)
  const assetClasses: Record<string, number> = {};
  this.holdings.forEach((h) => {
    const assetClass = h.instrument || 'stock';
    assetClasses[assetClass] = (assetClasses[assetClass] || 0) + h.marketValue;
  });

  // Add cash
  assetClasses['cash'] = this.cash.available;

  this.allocation.byAssetClass = Object.entries(assetClasses).map(([className, value]) => ({
    class: className,
    value,
    percentage: (value / totalValue) * 100,
  }));
};

// Pre-save middleware
PortfolioSchema.pre('save', function (next) {
  if (this.isModified('holdings') || this.isModified('cash')) {
    this.calculateSummary();
    this.calculateAllocation();
  }
  next();
});

// Static method: find by user
PortfolioSchema.statics.findByUser = function (userId: string, type?: string) {
  const query: any = { userId, isActive: true };
  if (type) query.type = type;
  return this.find(query).sort({ createdAt: -1 });
};

// Static method: get default portfolio
PortfolioSchema.statics.getDefault = async function (userId: string) {
  return this.findOne({ userId, isActive: true, type: 'live' }).sort({ createdAt: 1 });
};

// Create and export model
export const PortfolioModel: Model<IPortfolioDocument> = mongoose.model<IPortfolioDocument>('Portfolio', PortfolioSchema);

export default PortfolioModel;
