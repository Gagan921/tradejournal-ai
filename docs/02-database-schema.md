# TradeMind - Database Schema Design

---

## 1. Overview

This document defines the complete database schema for the TradeMind platform using a polyglot persistence approach.

**Storage Strategy:**
- **MongoDB**: Primary document store for flexible, relational data
- **Redis**: Cache, sessions, and job queues
- **PostgreSQL**: Time-series analytics and audit logs (future)
- **S3/MinIO**: Object storage for files

---

## 2. MongoDB Collections

### 2.1 Users Collection

```javascript
// Collection: users
{
  _id: ObjectId,                    // Primary key
  
  // Authentication
  email: String,                    // Unique, indexed
  passwordHash: String,             // bcrypt hash
  emailVerified: Boolean,           // Default: false
  emailVerificationToken: String,   // Hashed, TTL index
  
  // Profile
  profile: {
    firstName: String,
    lastName: String,
    avatar: String,                 // S3 URL
    timezone: String,               // IANA timezone
    currency: String,               // Default: 'USD'
    language: String                // Default: 'en'
  },
  
  // Trading Preferences
  tradingPreferences: {
    defaultCommission: Number,      // Per trade
    defaultCommissionType: String,  // 'fixed' | 'percentage'
    riskPerTrade: Number,           // Percentage (e.g., 1 = 1%)
    defaultStrategy: ObjectId,      // Reference to strategies
    tradingHours: {
      start: String,                // "09:30"
      end: String                   // "16:00"
    }
  },
  
  // Subscription & Billing
  subscription: {
    plan: String,                   // 'free' | 'pro' | 'enterprise'
    status: String,                 // 'active' | 'cancelled' | 'past_due'
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: Boolean
  },
  
  // Usage Limits (for free tier)
  usage: {
    tradesThisMonth: Number,
    aiInsightsThisMonth: Number,
    storageUsed: Number,            // Bytes
    lastResetDate: Date
  },
  
  // Security
  security: {
    twoFactorEnabled: Boolean,
    twoFactorSecret: String,        // Encrypted
    loginAttempts: Number,
    lockoutUntil: Date,
    lastLoginAt: Date,
    lastLoginIp: String,
    passwordChangedAt: Date
  },
  
  // OAuth
  oauth: {
    google: { id: String, email: String },
    github: { id: String, email: String }
  },
  
  // Roles & Permissions
  role: String,                     // 'user' | 'admin' | 'moderator'
  permissions: [String],
  
  // Metadata
  isActive: Boolean,                // Soft delete
  createdAt: Date,
  updatedAt: Date
}

// Indexes
users.createIndex({ email: 1 }, { unique: true })
users.createIndex({ "oauth.google.id": 1 }, { sparse: true })
users.createIndex({ "oauth.github.id": 1 }, { sparse: true })
users.createIndex({ "subscription.stripeCustomerId": 1 }, { sparse: true })
users.createIndex({ emailVerificationToken: 1 }, { expireAfterSeconds: 86400 })
users.createIndex({ createdAt: -1 })
```

---

### 2.2 Trades Collection

```javascript
// Collection: trades
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // Basic Info
  symbol: String,                   // "AAPL", indexed
  instrument: String,               // 'stock' | 'crypto' | 'forex' | 'option' | 'future'
  market: String,                   // 'us_equity' | 'crypto' | 'forex'
  
  // Trade Direction & Status
  direction: String,                // 'LONG' | 'SHORT'
  status: String,                   // 'OPEN' | 'CLOSED' | 'PARTIAL'
  
  // Entry/Exit Details
  entries: [{
    _id: ObjectId,
    price: Number,                  // Required
    quantity: Number,               // Required
    date: Date,                     // Required
    orderType: String,              // 'market' | 'limit' | 'stop' | 'stop_limit'
    notes: String
  }],
  
  exits: [{
    _id: ObjectId,
    price: Number,
    quantity: Number,
    date: Date,
    orderType: String,
    reason: String,                 // 'target' | 'stop_loss' | 'trailing_stop' | 'manual'
    notes: String
  }],
  
  // Calculated Fields (denormalized for performance)
  calculations: {
    totalEntryQuantity: Number,
    totalExitQuantity: Number,
    avgEntryPrice: Number,
    avgExitPrice: Number,
    totalFees: Number,
    grossPnL: Number,               // Before fees
    netPnL: Number,                 // After fees
    returnPercent: Number,          // Percentage return
    rMultiple: Number,              // R:R ratio achieved
    holdingPeriod: Number           // Days
  },
  
  // Risk Management
  risk: {
    initialRisk: Number,            // Dollar amount at risk
    riskPercent: Number,            // % of account
    stopLoss: Number,
    takeProfit: Number,
    riskRewardRatio: Number,        // Planned R:R
    positionSize: Number            // Calculated position size
  },
  
  // Strategy
  strategy: {
    _id: ObjectId,                  // Reference
    name: String                    // Denormalized
  },
  
  // Setup & Analysis
  setup: {
    type: String,                   // 'breakout' | 'pullback' | 'reversal' | etc.
    timeframe: String,              // '1m' | '5m' | '15m' | '1h' | '4h' | 'D' | 'W' | 'M'
    entryCriteria: [String],
    exitCriteria: [String]
  },
  
  // Tags
  tags: [String],                   // Indexed
  
  // Screenshots
  screenshots: [{
    _id: ObjectId,
    url: String,                    // S3 URL
    thumbnailUrl: String,
    caption: String,
    type: String,                   // 'entry' | 'exit' | 'analysis' | 'mistake'
    takenAt: Date
  }],
  
  // Psychology & Emotions
  psychology: {
    preTradeMood: String,           // 'confident' | 'neutral' | 'anxious' | 'fomo' | 'hesitant'
    postTradeMood: String,
    disciplineScore: Number,        // 1-10
    notes: String,
    mistakes: [{
      type: String,                 // 'chased_entry' | 'no_stop_loss' | 'moved_stop' | etc.
      description: String,
      severity: String              // 'low' | 'medium' | 'high' | 'critical'
    }]
  },
  
  // AI Insights
  aiInsights: [{
    _id: ObjectId,
    type: String,                   // 'mistake' | 'pattern' | 'suggestion' | 'risk'
    category: String,
    title: String,
    description: String,
    confidence: Number,             // 0-1
    generatedAt: Date,
    acknowledged: Boolean,
    helpful: Boolean                // User feedback
  }],
  
  // Workflow Checklist
  checklist: {
    preTrade: [{
      item: String,
      checked: Boolean,
      checkedAt: Date
    }],
    postTrade: [{
      item: String,
      checked: Boolean,
      checkedAt: Date
    }]
  },
  
  // Market Context
  marketContext: {
    marketTrend: String,            // 'bullish' | 'bearish' | 'neutral'
    sector: String,
    marketCondition: String,        // 'trending' | 'ranging' | 'volatile'
    newsImpact: String,
    correlation: [String]           // Related symbols
  },
  
  // Linked Trade (for scaling in/out)
  parentTradeId: ObjectId,          // If this is a partial close/add
  childTradeIds: [ObjectId],
  
  // Metadata
  isArchived: Boolean,
  importedFrom: String,             // 'csv' | 'broker_api' | null
  brokerTradeId: String,            // External ID
  createdAt: Date,
  updatedAt: Date,
  closedAt: Date
}

// Indexes
trades.createIndex({ userId: 1, createdAt: -1 })
trades.createIndex({ userId: 1, status: 1 })
trades.createIndex({ userId: 1, symbol: 1 })
trades.createIndex({ userId: 1, "strategy._id": 1 })
trades.createIndex({ userId: 1, tags: 1 })
trades.createIndex({ userId: 1, "calculations.netPnL": 1 })
trades.createIndex({ userId: 1, closedAt: -1 })
trades.createIndex({ "aiInsights.type": 1 }, { sparse: true })
```

---

### 2.3 Strategies Collection

```javascript
// Collection: strategies
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed, null for system strategies
  
  // Basic Info
  name: String,                     // Required, indexed
  description: String,
  category: String,                 // 'day_trading' | 'swing' | 'position' | 'scalping' | 'investing'
  
  // Strategy Rules
  rules: {
    entryConditions: [{
      condition: String,
      required: Boolean,
      order: Number
    }],
    exitConditions: [{
      condition: String,
      type: String,                 // 'profit' | 'loss' | 'breakeven' | 'trailing'
      order: Number
    }],
    riskRules: {
      maxRiskPerTrade: Number,      // %
      maxRiskPerDay: Number,
      maxPositions: Number,
      minRiskReward: Number
    }
  },
  
  // Performance Metrics (denormalized, updated by cron)
  performance: {
    totalTrades: Number,
    winningTrades: Number,
    losingTrades: Number,
    winRate: Number,
    avgWin: Number,
    avgLoss: Number,
    profitFactor: Number,
    expectancy: Number,
    totalPnL: Number,
    maxDrawdown: Number,
    lastUpdated: Date
  },
  
  // Timeframes this strategy works on
  timeframes: [String],
  
  // Instruments this strategy applies to
  instruments: [String],
  
  // Tags
  tags: [String],
  
  // Is this a system/default strategy?
  isSystem: Boolean,
  isActive: Boolean,
  isPublic: Boolean,                // Share with community (future)
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
strategies.createIndex({ userId: 1, name: 1 })
strategies.createIndex({ userId: 1, category: 1 })
strategies.createIndex({ isSystem: 1, isActive: 1 })
```

---

### 2.4 Portfolios Collection

```javascript
// Collection: portfolios
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // Portfolio Info
  name: String,
  description: String,
  type: String,                     // 'live' | 'paper' | 'backtest'
  baseCurrency: String,             // Default: 'USD'
  
  // Current Holdings
  holdings: [{
    symbol: String,
    instrument: String,
    quantity: Number,
    avgPrice: Number,
    currentPrice: Number,
    marketValue: Number,
    unrealizedPnL: Number,
    unrealizedPnLPercent: Number,
    allocation: Number,             // % of portfolio
    lastUpdated: Date
  }],
  
  // Cash
  cash: {
    available: Number,
    reserved: Number,               // For open orders
    currency: String
  },
  
  // Performance Summary
  summary: {
    totalValue: Number,             // holdings + cash
    totalCost: Number,
    totalUnrealizedPnL: Number,
    totalRealizedPnL: Number,
    totalReturn: Number,
    totalReturnPercent: Number,
    dayChange: Number,
    dayChangePercent: Number
  },
  
  // Asset Allocation
  allocation: {
    byAssetClass: [{
      class: String,                // 'stocks' | 'crypto' | 'bonds' | 'cash'
      value: Number,
      percentage: Number
    }],
    bySector: [{
      sector: String,
      value: Number,
      percentage: Number
    }],
    bySymbol: [{
      symbol: String,
      value: Number,
      percentage: Number
    }]
  },
  
  // Historical Snapshots (kept for 90 days, then aggregated)
  snapshots: [{
    date: Date,
    totalValue: Number,
    cash: Number,
    holdingsValue: Number,
    realizedPnL: Number,
    unrealizedPnL: Number
  }],
  
  // Settings
  settings: {
    autoSync: Boolean,              // Sync with broker
    syncBroker: String,             // Broker name
    alertsEnabled: Boolean,
    rebalanceThreshold: Number      // % deviation before rebalance alert
  },
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
portfolios.createIndex({ userId: 1, type: 1 })
portfolios.createIndex({ userId: 1, isActive: 1 })
```

---

### 2.5 Trade Journal Collection

```javascript
// Collection: journal_entries
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // Entry Type
  type: String,                     // 'daily' | 'weekly' | 'monthly' | 'trade_review' | 'lesson'
  
  // Date Range (for daily/weekly/monthly)
  period: {
    start: Date,
    end: Date
  },
  
  // Linked Trade (for trade_review)
  tradeId: ObjectId,
  
  // Content
  title: String,
  content: String,                  // Markdown supported
  
  // Market Conditions
  marketConditions: {
    overallTrend: String,
    volatility: String,             // 'low' | 'medium' | 'high'
    volume: String,                 // 'low' | 'normal' | 'high'
    keyEvents: [String]
  },
  
  // Performance Summary (for daily/weekly/monthly)
  performance: {
    totalTrades: Number,
    winningTrades: Number,
    losingTrades: Number,
    winRate: Number,
    grossPnL: Number,
    netPnL: Number,
    largestWin: Number,
    largestLoss: Number,
    avgWin: Number,
    avgLoss: Number
  },
  
  // Psychological State
  psychology: {
    overallMood: String,
    stressLevel: Number,            // 1-10
    focusLevel: Number,             // 1-10
    disciplineRating: Number,       // 1-10
    notes: String
  },
  
  // Lessons Learned
  lessons: [{
    type: String,                   // 'technical' | 'psychological' | 'risk_management'
    description: String,
    actionItems: [String]
  }],
  
  // Goals
  goals: {
    set: [{
      description: String,
      target: String,
      deadline: Date
    }],
    achieved: [{
      description: String,
      achievedAt: Date
    }]
  },
  
  // AI Analysis
  aiAnalysis: {
    summary: String,
    patterns: [String],
    suggestions: [String],
    moodAnalysis: String,
    generatedAt: Date
  },
  
  // Tags
  tags: [String],
  
  // Privacy
  isPrivate: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
journal_entries.createIndex({ userId: 1, type: 1, createdAt: -1 })
journal_entries.createIndex({ userId: 1, tradeId: 1 })
journal_entries.createIndex({ userId: 1, "period.start": 1 })
```

---

### 2.6 Workflows/Checklists Collection

```javascript
// Collection: workflows
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // Workflow Info
  name: String,
  description: String,
  type: String,                     // 'pre_trade' | 'post_trade' | 'daily_review' | 'weekly_review'
  
  // Is this a template?
  isTemplate: Boolean,
  templateId: ObjectId,             // If created from template
  
  // Checklist Items
  items: [{
    _id: ObjectId,
    order: Number,
    text: String,
    description: String,
    isRequired: Boolean,
    category: String                // Optional grouping
  }],
  
  // Usage Stats
  stats: {
    timesUsed: Number,
    completionRate: Number,         // Average completion %
    lastUsed: Date
  },
  
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// Workflow Instances (completed checklists)
// Collection: workflow_instances
{
  _id: ObjectId,
  userId: ObjectId,
  workflowId: ObjectId,
  tradeId: ObjectId,                // Optional - linked trade
  
  // Instance Data
  type: String,                     // 'pre_trade' | 'post_trade' | etc.
  completedAt: Date,
  
  // Responses
  responses: [{
    itemId: ObjectId,
    checked: Boolean,
    checkedAt: Date,
    notes: String
  }],
  
  // Scoring
  score: {
    total: Number,
    completed: Number,
    percentage: Number,
    requiredCompleted: Boolean
  },
  
  createdAt: Date
}

// Indexes
workflows.createIndex({ userId: 1, type: 1 })
workflows.createIndex({ isTemplate: 1, type: 1 })
workflow_instances.createIndex({ userId: 1, workflowId: 1 })
workflow_instances.createIndex({ userId: 1, tradeId: 1 })
```

---

### 2.7 AI Insights Collection

```javascript
// Collection: ai_insights
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // Insight Type
  type: String,                     // 'trade_review' | 'pattern' | 'risk_alert' | 'suggestion' | 'journal_analysis'
  
  // Source
  source: {
    type: String,                   // 'trade' | 'journal' | 'portfolio' | 'system'
    id: ObjectId                    // Reference to source document
  },
  
  // Content
  title: String,
  summary: String,
  details: String,
  
  // Categorization
  category: String,                 // 'mistake' | 'opportunity' | 'risk' | 'improvement' | 'psychology'
  severity: String,                 // 'info' | 'low' | 'medium' | 'high' | 'critical'
  
  // AI Metadata
  aiMetadata: {
    model: String,                  // 'gpt-4' | 'gpt-4o'
    promptVersion: String,
    tokensUsed: Number,
    confidence: Number,             // 0-1
    processingTime: Number          // ms
  },
  
  // User Interaction
  userFeedback: {
    acknowledged: Boolean,
    acknowledgedAt: Date,
    helpful: Boolean,               // thumbs up/down
    notes: String
  },
  
  // Related Insights
  relatedInsights: [ObjectId],
  
  // Expiry (for time-sensitive insights)
  expiresAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}

// Indexes
ai_insights.createIndex({ userId: 1, type: 1, createdAt: -1 })
ai_insights.createIndex({ userId: 1, "source.id": 1 })
ai_insights.createIndex({ userId: 1, category: 1 })
ai_insights.createIndex({ userId: 1, severity: 1 })
ai_insights.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

### 2.8 Notifications Collection

```javascript
// Collection: notifications
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // Notification Content
  type: String,                     // 'trade_alert' | 'ai_insight' | 'reminder' | 'system' | 'billing'
  title: String,
  message: String,
  
  // Data Payload
  data: {
    actionType: String,             // 'view_trade' | 'view_insight' | 'subscribe' | etc.
    actionId: ObjectId,
    url: String
  },
  
  // Delivery Channels
  channels: {
    inApp: { sent: Boolean, sentAt: Date },
    email: { sent: Boolean, sentAt: Date, emailId: String },
    push: { sent: Boolean, sentAt: Date }
  },
  
  // User State
  read: Boolean,
  readAt: Date,
  
  // Priority
  priority: String,                 // 'low' | 'normal' | 'high' | 'urgent'
  
  // Scheduled (for reminders)
  scheduledFor: Date,
  
  createdAt: Date
}

// Indexes
notifications.createIndex({ userId: 1, read: 1, createdAt: -1 })
notifications.createIndex({ userId: 1, type: 1 })
notifications.createIndex({ scheduledFor: 1 }, { sparse: true })
notifications.createIndex({ createdAt: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
```

---

### 2.9 Uploads/Files Collection

```javascript
// Collection: uploads
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  // File Info
  originalName: String,
  fileName: String,                 // Generated UUID
  mimeType: String,
  size: Number,                     // Bytes
  
  // Storage
  storage: {
    provider: String,               // 's3' | 'minio' | 'local'
    bucket: String,
    key: String,                    // Path in bucket
    url: String,                    // Public URL
    thumbnailKey: String,           // For images
    thumbnailUrl: String
  },
  
  // Usage
  entityType: String,               // 'trade' | 'journal' | 'avatar' | 'export'
  entityId: ObjectId,
  
  // Metadata
  metadata: {
    width: Number,                  // For images
    height: Number,
    duration: Number,               // For videos
    ocrText: String                 // Extracted text (future)
  },
  
  // Processing Status
  status: String,                   // 'pending' | 'processing' | 'completed' | 'failed'
  processingError: String,
  
  createdAt: Date
}

// Indexes
uploads.createIndex({ userId: 1, entityType: 1, entityId: 1 })
uploads.createIndex({ userId: 1, createdAt: -1 })
```

---

### 2.10 Refresh Tokens Collection

```javascript
// Collection: refresh_tokens
{
  _id: ObjectId,
  userId: ObjectId,                 // Indexed
  
  tokenHash: String,                // Hashed token
  device: {
    type: String,                   // 'desktop' | 'mobile' | 'tablet'
    name: String,
    os: String,
    browser: String
  },
  ipAddress: String,
  
  // Expiry
  expiresAt: Date,
  
  // Status
  revoked: Boolean,
  revokedAt: Date,
  replacedByToken: ObjectId,
  
  createdAt: Date,
  lastUsedAt: Date
}

// Indexes
refresh_tokens.createIndex({ userId: 1, createdAt: -1 })
refresh_tokens.createIndex({ tokenHash: 1 }, { unique: true })
refresh_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## 3. Redis Data Structures

### 3.1 Session Management

```
Key Pattern: session:{userId}:{sessionId}
Type: Hash
TTL: 7 days

Fields:
- userId: string
- email: string
- role: string
- permissions: JSON array
- createdAt: timestamp
- lastActivity: timestamp
- ipAddress: string
- userAgent: string
```

### 3.2 Rate Limiting

```
Key Pattern: ratelimit:{identifier}:{window}
Type: String (counter) or Redis Cell
TTL: Window duration

Examples:
- ratelimit:ip:192.168.1.1:1min
- ratelimit:user:user123:1min
- ratelimit:apikey:key123:1hour
```

### 3.3 Cache

```
Key Pattern: cache:{entity}:{id}
Type: String (JSON)
TTL: Varies by entity

Examples:
- cache:user:user123 (TTL: 1 hour)
- cache:portfolio:user123 (TTL: 5 minutes)
- cache:trade:trade456 (TTL: 15 minutes)
- cache:analytics:daily:user123 (TTL: 10 minutes)
```

### 3.4 BullMQ Queues

```
Queue Names:
- ai:insights
- email:notifications
- trade:analytics
- image:processing
- notification:push
- export:generation

Redis Keys (BullMQ managed):
- bull:ai:insights:wait
- bull:ai:insights:active
- bull:ai:insights:completed
- bull:ai:insights:failed
- bull:ai:insights:delayed
```

### 3.5 Real-time Data

```
Key Pattern: realtime:{type}:{identifier}
Type: Various

Examples:
- realtime:portfolio:{userId} - Hash of current portfolio
- realtime:market:{symbol} - String (JSON) of latest quote
- realtime:ws:{roomId} - Set of connected socket IDs
```

---

## 4. PostgreSQL Schema (Future - Analytics)

### 4.1 Time-Series Price Data

```sql
-- Table: market_prices
CREATE TABLE market_prices (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open DECIMAL(18, 8),
    high DECIMAL(18, 8),
    low DECIMAL(18, 8),
    close DECIMAL(18, 8),
    volume BIGINT,
    source VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TimescaleDB hypertable
SELECT create_hypertable('market_prices', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Indexes
CREATE INDEX idx_market_prices_symbol_time ON market_prices (symbol, timestamp DESC);
```

### 4.2 Audit Logs

```sql
-- Table: audit_logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(24),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes
CREATE INDEX idx_audit_logs_user_created ON audit_logs (user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action, created_at DESC);
```

---

## 5. Data Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     ENTITY RELATIONSHIPS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User (1) ────────────────────────► (*) Trade                   │
│     │                                  │                        │
│     │                                  │                        │
│     ▼                                  ▼                        │
│  (*) Strategy                    (*) Screenshot (S3)            │
│     │                                  │                        │
│     │                                  │                        │
│     ▼                                  ▼                        │
│  (*) Portfolio                   (*) AI Insight                 │
│     │                                                            │
│     │                                                            │
│     ▼                                                            │
│  (*) Journal Entry                                               │
│     │                                                            │
│     │                                                            │
│     ▼                                                            │
│  (*) Workflow                                                    │
│     │                                                            │
│     │                                                            │
│     ▼                                                            │
│  (*) Notification                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Indexing Strategy Summary

| Collection | Primary Index | Secondary Indexes | Purpose |
|------------|---------------|-------------------|---------|
| users | email (unique) | oauth ids, stripe ids | Fast auth lookups |
| trades | userId + createdAt | symbol, status, strategy, tags | Trade filtering |
| strategies | userId + name | category, isSystem | Strategy management |
| portfolios | userId + type | isActive | Portfolio retrieval |
| journal | userId + type + createdAt | tradeId, period | Journal browsing |
| workflows | userId + type | isTemplate | Workflow retrieval |
| ai_insights | userId + type + createdAt | source.id, category | Insight filtering |
| notifications | userId + read + createdAt | type, scheduledFor | Inbox queries |
| uploads | userId + entityType + entityId | createdAt | File management |
| refresh_tokens | userId + createdAt | tokenHash (unique) | Token validation |

---

## 7. Data Retention Policies

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Refresh tokens | Until expiry | Auto-delete (TTL) |
| Email verification tokens | 24 hours | Auto-delete (TTL) |
| Notifications | 90 days | Auto-delete (TTL) |
| AI insights | 1 year | Archive to S3 |
| Trade snapshots | 90 days | Aggregate to daily |
| Audit logs | 2 years | Partition & archive |
| Market prices | 5 years | Compress old data |
| User sessions | 7 days | Auto-delete (TTL) |

---

*Document Version: 1.0*
*Last Updated: 2024*
