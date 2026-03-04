export const TRADE_CONSTANTS = {
  // Trade Directions
  DIRECTIONS: {
    LONG: 'LONG',
    SHORT: 'SHORT',
  } as const,

  // Trade Status
  STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    PARTIAL: 'PARTIAL',
  } as const,

  // Order Types
  ORDER_TYPES: {
    MARKET: 'market',
    LIMIT: 'limit',
    STOP: 'stop',
    STOP_LIMIT: 'stop_limit',
  } as const,

  // Instruments
  INSTRUMENTS: {
    STOCK: 'stock',
    CRYPTO: 'crypto',
    FOREX: 'forex',
    OPTION: 'option',
    FUTURE: 'future',
    ETF: 'etf',
  } as const,

  // Markets
  MARKETS: {
    US_EQUITY: 'us_equity',
    CRYPTO: 'crypto',
    FOREX: 'forex',
    INTERNATIONAL: 'international',
  } as const,

  // Exit Reasons
  EXIT_REASONS: {
    TARGET: 'target',
    STOP_LOSS: 'stop_loss',
    TRAILING_STOP: 'trailing_stop',
    MANUAL: 'manual',
    TIME_BASED: 'time_based',
    BREAKEVEN: 'breakeven',
  } as const,

  // Strategy Categories
  STRATEGY_CATEGORIES: {
    DAY_TRADING: 'day_trading',
    SWING: 'swing',
    POSITION: 'position',
    SCALPING: 'scalping',
    INVESTING: 'investing',
  } as const,

  // Timeframes
  TIMEFRAMES: {
    M1: '1m',
    M5: '5m',
    M15: '15m',
    M30: '30m',
    H1: '1h',
    H4: '4h',
    D1: 'D',
    W1: 'W',
    M1_TF: 'M',
  } as const,

  // Psychology Moods
  MOODS: {
    CONFIDENT: 'confident',
    NEUTRAL: 'neutral',
    ANXIOUS: 'anxious',
    FOMO: 'fomo',
    HESITANT: 'hesitant',
    REVENGEFUL: 'revengeful',
    FEARFUL: 'fearful',
    GREEDY: 'greedy',
  } as const,

  // Mistake Types
  MISTAKE_TYPES: {
    CHASED_ENTRY: 'chased_entry',
    NO_STOP_LOSS: 'no_stop_loss',
    MOVED_STOP: 'moved_stop',
    AVERAGED_DOWN: 'averaged_down',
    AVERAGED_UP: 'averaged_up',
    OVERTRADED: 'overtraded',
    REVENGE_TRADING: 'revenge_trading',
    MISSED_SETUP: 'missed_setup',
    TOO_EARLY: 'too_early',
    TOO_LATE: 'too_late',
    WRONG_SIZE: 'wrong_size',
    IGNORED_PLAN: 'ignored_plan',
    EMOTIONAL: 'emotional',
    FOMO_TRADE: 'fomo_trade',
  } as const,

  // Market Conditions
  MARKET_CONDITIONS: {
    TRENDING_UP: 'trending_up',
    TRENDING_DOWN: 'trending_down',
    RANGING: 'ranging',
    VOLATILE: 'volatile',
    LOW_VOLUME: 'low_volume',
  } as const,

  // Workflow Types
  WORKFLOW_TYPES: {
    PRE_TRADE: 'pre_trade',
    POST_TRADE: 'post_trade',
    DAILY_REVIEW: 'daily_review',
    WEEKLY_REVIEW: 'weekly_review',
  } as const,

  // AI Insight Types
  AI_INSIGHT_TYPES: {
    TRADE_REVIEW: 'trade_review',
    PATTERN: 'pattern',
    RISK_ALERT: 'risk_alert',
    SUGGESTION: 'suggestion',
    JOURNAL_ANALYSIS: 'journal_analysis',
  } as const,

  // AI Insight Categories
  AI_INSIGHT_CATEGORIES: {
    MISTAKE: 'mistake',
    OPPORTUNITY: 'opportunity',
    RISK: 'risk',
    IMPROVEMENT: 'improvement',
    PSYCHOLOGY: 'psychology',
  } as const,

  // Subscription Plans
  PLANS: {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
  } as const,

  // Limits by Plan
  PLAN_LIMITS: {
    free: {
      maxTradesPerMonth: 100,
      maxAiInsightsPerMonth: 10,
      maxStorageGB: 1,
      maxStrategies: 5,
    },
    pro: {
      maxTradesPerMonth: 1000,
      maxAiInsightsPerMonth: 100,
      maxStorageGB: 10,
      maxStrategies: 50,
    },
    enterprise: {
      maxTradesPerMonth: -1, // unlimited
      maxAiInsightsPerMonth: -1,
      maxStorageGB: 100,
      maxStrategies: -1,
    },
  },

  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/csv'],
    MAX_FILES_PER_TRADE: 10,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

// Type exports
export type TradeDirection = (typeof TRADE_CONSTANTS.DIRECTIONS)[keyof typeof TRADE_CONSTANTS.DIRECTIONS];
export type TradeStatus = (typeof TRADE_CONSTANTS.STATUS)[keyof typeof TRADE_CONSTANTS.STATUS];
export type OrderType = (typeof TRADE_CONSTANTS.ORDER_TYPES)[keyof typeof TRADE_CONSTANTS.ORDER_TYPES];
export type Instrument = (typeof TRADE_CONSTANTS.INSTRUMENTS)[keyof typeof TRADE_CONSTANTS.INSTRUMENTS];
export type Market = (typeof TRADE_CONSTANTS.MARKETS)[keyof typeof TRADE_CONSTANTS.MARKETS];
export type ExitReason = (typeof TRADE_CONSTANTS.EXIT_REASONS)[keyof typeof TRADE_CONSTANTS.EXIT_REASONS];
export type StrategyCategory = (typeof TRADE_CONSTANTS.STRATEGY_CATEGORIES)[keyof typeof TRADE_CONSTANTS.STRATEGY_CATEGORIES];
export type Timeframe = (typeof TRADE_CONSTANTS.TIMEFRAMES)[keyof typeof TRADE_CONSTANTS.TIMEFRAMES];
export type Mood = (typeof TRADE_CONSTANTS.MOODS)[keyof typeof TRADE_CONSTANTS.MOODS];
export type MistakeType = (typeof TRADE_CONSTANTS.MISTAKE_TYPES)[keyof typeof TRADE_CONSTANTS.MISTAKE_TYPES];
export type MarketCondition = (typeof TRADE_CONSTANTS.MARKET_CONDITIONS)[keyof typeof TRADE_CONSTANTS.MARKET_CONDITIONS];
export type WorkflowType = (typeof TRADE_CONSTANTS.WORKFLOW_TYPES)[keyof typeof TRADE_CONSTANTS.WORKFLOW_TYPES];
export type AiInsightType = (typeof TRADE_CONSTANTS.AI_INSIGHT_TYPES)[keyof typeof TRADE_CONSTANTS.AI_INSIGHT_TYPES];
export type AiInsightCategory = (typeof TRADE_CONSTANTS.AI_INSIGHT_CATEGORIES)[keyof typeof TRADE_CONSTANTS.AI_INSIGHT_CATEGORIES];
export type PlanType = (typeof TRADE_CONSTANTS.PLANS)[keyof typeof TRADE_CONSTANTS.PLANS];
