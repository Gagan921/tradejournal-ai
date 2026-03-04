# TradeMind - AI Trading Journal Platform
## High-Level System Architecture

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Web App   │  │  Mobile App │  │  PWA (TWA)  │  │  Chrome Ext │  │  API Clients│   │
│  │   (React)   │  │ (React Nat) │  │   (Future)  │  │   (Future)  │  │  (Future)   │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────┼──────────┘
          │                │                │                │                │
          └────────────────┴────────────────┴────────────────┴────────────────┘
                                           │
                              ┌────────────┴────────────┐
                              │      CDN (CloudFlare)   │
                              │   - Static assets       │
                              │   - DDoS protection     │
                              │   - Edge caching        │
                              └────────────┬────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                              GATEWAY LAYER                                                │
│  ┌───────────────────────────────────────┴─────────────────────────────────────────────┐  │
│  │                              Nginx (Reverse Proxy)                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │ Rate Limit  │  │   SSL/TLS   │  │  Gzip/Brotli│  │  WebSocket  │  │  Load Bal │  │  │
│  │  │   (Redis)   │  │  (Let'sEnc) │  │ Compression │  │   Upgrade   │  │  (Future) │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                              API LAYER (Node.js + Express)                                │
│  ┌───────────────────────────────────────┴─────────────────────────────────────────────┐  │
│  │                              API Gateway / Router                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │   /api/v1   │  │   /auth     │  │   /trades   │  │  /portfolio │  │  /ai      │  │  │
│  │  │   (health)  │  │  (OAuth/JWT)│  │   (CRUD)    │  │  (tracking) │  │ (insights)│  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │  /analytics │  │  /workflows │  │ /uploads    │  │ /webhooks   │  │ /admin    │  │  │
│  │  │  (reports)  │  │(checklists) │  │ (S3 signed) │  │  (stripe)   │  │ (mgmt)    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           MIDDLEWARE STACK                                           │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐  │  │
│  │  │ Request │ │  CORS   │ │  Auth   │ │ Validate│ │  Rate   │ │ Request │ │ Error  │  │  │
│  │  │  ID Gen │ │ Headers │ │  JWT    │ │  Joi/Zod│ │  Limit  │ │ Logger  │ │Handler │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                           SERVICE LAYER (Business Logic)                                  │
│  ┌───────────────────────────────────────┴─────────────────────────────────────────────┐  │
│  │                                                                                      │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │  │
│  │   │AuthService  │  │TradeService │  │PortfolioSvc │  │ AIService   │  │Analytics│  │  │
│  │   │             │  │             │  │             │  │             │  │ Service │  │  │
│  │   │- Register   │  │- Create     │  │- Holdings   │  │- Analyze    │  │- Stats  │  │  │
│  │   │- Login      │  │- Update     │  │- Allocation │  │- Suggest    │  │- Reports│  │  │
│  │   │- OAuth      │  │- Delete     │  │- History    │  │- Review     │  │- Export │  │  │
│  │   │- Reset PW   │  │- PnL Calc   │  │- Rebalance  │  │- Patterns   │  │- Charts │  │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │  │
│  │                                                                                      │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │  │
│  │   │WorkflowSvc  │  │UploadService│  │NotifService │  │BillingService│  │AdminSvc │  │  │
│  │   │             │  │             │  │             │  │              │  │         │  │  │
│  │   │- Checklists │  │- S3 Upload  │  │- Email      │  │- Subscriptions│  │- Users  │  │  │
│  │   │- Scoring    │  │- Image Proc │  │- Push       │  │- Payments     │  │- Roles  │  │  │
│  │   │- Reminders  │  │- Validation │  │- WebSocket  │  │- Invoicing    │  │- Audit  │  │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │  │
│  │                                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                         REPOSITORY LAYER (Data Access)                                    │
│  ┌───────────────────────────────────────┴─────────────────────────────────────────────┐  │
│  │                                                                                      │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │  │
│  │   │UserRepo     │  │TradeRepo    │  │PortfolioRepo│  │StrategyRepo │  │TagRepo  │  │  │
│  │   │             │  │             │  │             │  │             │  │         │  │  │
│  │   │ MongoDB     │  │ MongoDB     │  │ MongoDB     │  │ MongoDB     │  │ MongoDB │  │  │
│  │   │ (Primary)   │  │ (Primary)   │  │ (Primary)   │  │ (Primary)   │  │(Primary)│  │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │  │
│  │                                                                                      │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │  │
│  │   │WorkflowRepo │  │JournalRepo  │  │InsightRepo  │  │UploadRepo   │  │NotifRepo│  │  │
│  │   │             │  │             │  │             │  │             │  │         │  │  │
│  │   │ MongoDB     │  │ MongoDB     │  │ MongoDB     │  │ MongoDB     │  │ MongoDB │  │  │
│  │   │ (Primary)   │  │ (Primary)   │  │ (Primary)   │  │ (Metadata)  │  │ (Primary)│  │  │
│  │   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘  │  │
│  │                                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                              DATA LAYER                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │
│  │    MongoDB      │  │     Redis       │  │   PostgreSQL    │  │    Object Storage   │   │
│  │   (Primary DB)  │  │  (Cache/Queue)  │  │  (Analytics/WL) │  │    (S3/MinIO)       │   │
│  │                 │  │                 │  │                 │  │                     │   │
│  │ - Users         │  │ - Sessions      │  │ - Time-series   │  │ - Screenshots       │   │
│  │ - Trades        │  │ - Cache         │  │ - Aggregations  │  │ - Exports           │   │
│  │ - Portfolios    │  │ - Rate Limits   │  │ - Reports       │  │ - Backups           │   │
│  │ - Strategies    │  │ - Pub/Sub       │  │ - Audit logs    │  │ - Static assets     │   │
│  │ - Workflows     │  │ - BullMQ Jobs   │  │                 │  │                     │   │
│  │ - AI Insights   │  │ - Real-time data│  │                 │  │                     │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                         WORKER LAYER (Background Jobs)                                    │
│  ┌───────────────────────────────────────┴─────────────────────────────────────────────┐  │
│  │                                                                                      │  │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐    │  │
│  │   │   AI Worker     │  │  Email Worker   │  │ Analytics Worker│  │ Notif Worker│    │  │
│  │   │                 │  │                 │  │                 │  │             │    │  │
│  │   │ - Trade review  │  │ - Welcome email │  │ - Daily reports │  │ - Reminders │    │  │
│  │   │ - Pattern detect│  │ - Trade alerts  │  │ - Weekly stats  │  │ - Alerts    │    │  │
│  │   │ - Risk analysis │  │ - Digest emails │  │ - Monthly sum   │  │ - WebSocket │    │  │
│  │   │ - Suggestions   │  │ - Reset tokens  │  │ - Export gen    │  │ - Push notif│    │  │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘    │  │
│  │                                                                                      │  │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐    │  │
│  │   │  Image Worker   │  │  Import Worker  │  │  Cleanup Worker │  │ Backup Wkr  │    │  │
│  │   │                 │  │                 │  │                 │  │             │    │  │
│  │   │ - Resize        │  │ - CSV import    │  │ - Old data      │  │ - DB backup │    │  │
│  │   │ - Compress      │  │ - Broker sync   │  │ - Expired sess  │  │ - File sync │    │  │
│  │   │ - OCR (future)  │  │ - Validation    │  │ - Orphan files  │  │ - Snapshot  │    │  │
│  │   │ - Thumbnail gen │  │ - Error handle  │  │ - Log rotation  │  │ - Archive   │    │  │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘    │  │
│  │                                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
┌──────────────────────────────────────────┼─────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   OpenAI    │  │   Stripe    │  │   SendGrid  │  │   S3/MinIO  │  │  Finnhub/Alpha  │  │
│  │   API       │  │  Payments   │  │   Email     │  │   Storage   │  │  Market Data    │  │
│  │             │  │             │  │             │  │             │  │                 │  │
│  │ - GPT-4     │  │ - Subs      │  │ - Transac   │  │ - Uploads   │  │ - Price feeds   │  │
│  │ - Analysis  │  │ - Billing   │  │ - Campaigns │  │ - CDN origin│  │ - News          │  │
│  │ - Insights  │  │ - Invoices  │  │ - Templates │  │ - Backups   │  │ - Fundamentals  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Patterns

### 2.1 Layered Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│         (React Frontend + API)          │
├─────────────────────────────────────────┤
│           Application Layer             │
│    (Controllers, Routes, Middleware)    │
├─────────────────────────────────────────┤
│            Service Layer                │
│    (Business Logic, Domain Rules)       │
├─────────────────────────────────────────┤
│          Repository Layer               │
│    (Data Access, Query Building)        │
├─────────────────────────────────────────┤
│            Data Layer                   │
│    (MongoDB, Redis, PostgreSQL, S3)     │
└─────────────────────────────────────────┘
```

### 2.2 Service Communication Flow

```
Request Flow:
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐
│ Client  │───▶│  Router  │───▶│Middleware │───▶│Controller│───▶│ Service │
└─────────┘    └──────────┘    └───────────┘    └──────────┘    └────┬────┘
                                                                     │
                              ┌──────────┐    ┌──────────┐          │
                              │ Response │◀───│Controller│◀─────────┘
                              └──────────┘    └──────────┘
                                                                     │
                              ┌──────────┐    ┌──────────┐          │
                              │   Data   │◀───│Repository│◀─────────┘
                              └──────────┘    └──────────┘
```

### 2.3 Event-Driven Architecture (Async)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Event     │────▶│Redis Pub/Sub│────▶│   Worker    │
│  Published  │     │  / BullMQ   │     │   Process   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                         ┌─────────────────────┼─────────────────────┐
                         ▼                     ▼                     ▼
                   ┌───────────┐         ┌───────────┐         ┌───────────┐
                   │AI Worker  │         │Email Worker│        │Notif Worker│
                   └───────────┘         └───────────┘         └───────────┘
```

---

## 3. Key Architectural Decisions

### 3.1 Database Strategy: Polyglot Persistence

| Data Type | Primary Store | Secondary Store | Reasoning |
|-----------|--------------|-----------------|-----------|
| User profiles, trades, strategies | MongoDB | - | Flexible schema, document relationships |
| Sessions, cache, rate limits | Redis | - | Speed, TTL support |
| Time-series price data | PostgreSQL | MongoDB | Efficient aggregation, analytics |
| Audit logs | PostgreSQL | S3 (archive) | Compliance, long-term storage |
| Screenshots, exports | S3/MinIO | - | Object storage, CDN integration |
| Job queues | Redis (BullMQ) | - | Reliable job processing |

### 3.2 Why MongoDB as Primary?

```javascript
// Trade document structure - naturally fits document model
{
  _id: ObjectId,
  userId: ObjectId,
  symbol: "AAPL",
  type: "LONG",
  entries: [{ price: 150.00, quantity: 100, date: ISODate }],
  exits: [{ price: 155.00, quantity: 100, date: ISODate }],
  strategy: { name: "Breakout", id: ObjectId },
  tags: ["earnings", "momentum"],
  screenshots: [{ url: "...", caption: "..." }],
  psychology: { mood: "confident", notes: "..." },
  aiInsights: [{ type: "mistake", message: "..." }],
  metadata: { /* flexible fields */ }
}
```

### 3.3 Caching Strategy (Redis)

```
┌─────────────────────────────────────────────────────────────┐
│                     CACHE LAYERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  L1: In-Memory (Node.js)                                    │
│  ├── Static configs (app settings, feature flags)           │
│  └── Hot data (current user session)                        │
│  TTL: Application lifetime                                  │
│                                                             │
│  L2: Redis (Distributed)                                    │
│  ├── User sessions (JWT blacklist, refresh tokens)          │
│  ├── Rate limiting counters                                 │
│  ├── Query results (trade lists, portfolio summary)         │
│  └── Real-time data (WebSocket room states)                 │
│  TTL: 5min - 24hrs depending on data type                   │
│                                                             │
│  L3: CDN Edge (CloudFlare)                                  │
│  ├── Static assets (JS, CSS, images)                        │
│  └── Public API responses (market data)                     │
│  TTL: 1hr - 30 days                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Queue Architecture (BullMQ)

```
┌─────────────────────────────────────────────────────────────┐
│                    QUEUE HIERARCHY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HIGH PRIORITY (immediate)                                  │
│  ├── email:welcome      - User registration                 │
│  ├── notification:alert - Risk alerts                       │
│  └── ai:quick-insight   - Fast AI feedback                  │
│  Workers: 2-3 concurrent                                    │
│                                                             │
│  NORMAL PRIORITY (background)                               │
│  ├── ai:deep-analysis   - Comprehensive trade review        │
│  ├── analytics:daily    - Daily report generation           │
│  └── image:process      - Screenshot optimization           │
│  Workers: 5-10 concurrent                                   │
│                                                             │
│  LOW PRIORITY (scheduled)                                   │
│  ├── analytics:weekly   - Weekly summaries                  │
│  ├── cleanup:expired    - Data cleanup                      │
│  └── backup:database    - Automated backups                 │
│  Workers: 1-2 concurrent                                    │
│                                                             │
│  SCHEDULED JOBS (cron)                                      │
│  ├── 0 9 * * 1          - Weekly email digest (Mon 9am)     │
│  ├── 0 18 * * *         - Daily portfolio snapshot (6pm)    │
│  └── 0 2 * * 0          - Weekly cleanup (Sun 2am)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Security Architecture

### 4.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Perimeter (CloudFlare)                                     │
│  ├── DDoS protection (Layer 3/4/7)                          │
│  ├── WAF rules (SQL injection, XSS)                         │
│  ├── Bot management                                         │
│  └── Geo-blocking (optional)                                │
│                                                             │
│  Network (Nginx + VPC)                                      │
│  ├── TLS 1.3 only                                           │
│  ├── HSTS headers                                           │
│  ├── IP whitelisting (admin)                                │
│  └── Request size limits                                    │
│                                                             │
│  Application (Express)                                      │
│  ├── Input validation (Joi/Zod)                             │
│  ├── Output sanitization                                    │
│  ├── CSRF protection                                        │
│  ├── Rate limiting (per user/IP)                            │
│  └── Security headers (Helmet)                              │
│                                                             │
│  Authentication                                             │
│  ├── JWT (access + refresh tokens)                          │
│  ├── Password hashing (bcrypt, 12 rounds)                   │
│  ├── 2FA support (TOTP)                                     │
│  └── OAuth 2.0 (Google, GitHub)                             │
│                                                             │
│  Authorization (RBAC)                                       │
│  ├── Role-based access control                              │
│  ├── Resource-level permissions                             │
│  └── API key management (future)                            │
│                                                             │
│  Data                                                       │
│  ├── Encryption at rest (MongoDB, S3)                       │
│  ├── Field-level encryption (PII)                           │
│  └── Backup encryption                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Authentication Flow

```
┌─────────┐                                    ┌─────────────┐
│  Client │                                    │   Server    │
└────┬────┘                                    └──────┬──────┘
     │                                               │
     │  1. POST /auth/login {email, password}        │
     │──────────────────────────────────────────────▶│
     │                                               │
     │                                               │──┐
     │                                               │  │ Verify credentials
     │                                               │◀─┘
     │                                               │──┐
     │                                               │  │ Generate tokens
     │                                               │◀─┘
     │  2. {accessToken, refreshToken, user}         │
     │◀──────────────────────────────────────────────│
     │                                               │
     │  3. Subsequent requests with Bearer token     │
     │──────────────────────────────────────────────▶│
     │                                               │──┐
     │                                               │  │ Verify JWT
     │                                               │◀─┘
     │  4. Protected resource                        │
     │◀──────────────────────────────────────────────│
     │                                               │
     │  5. POST /auth/refresh {refreshToken}         │
     │──────────────────────────────────────────────▶│
     │  6. {accessToken}                             │
     │◀──────────────────────────────────────────────│
     │                                               │
```

---

## 5. Scalability Considerations

### 5.1 Horizontal Scaling

```
                    ┌─────────────┐
                    │ Load Balancer│
                    │   (Nginx)    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  API Server │ │  API Server │ │  API Server │
    │   (Node 1)  │ │   (Node 2)  │ │   (Node N)  │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
                    ┌──────┴──────┐
                    │    Redis    │
                    │  (Cluster)  │
                    └─────────────┘
                           │
                    ┌──────┴──────┐
                    │   MongoDB   │
                    │  (Replica)  │
                    └─────────────┘
```

### 5.2 Database Scaling Strategy

| Stage | Users | MongoDB | Redis | PostgreSQL |
|-------|-------|---------|-------|------------|
| MVP | <1K | Single node | Single node | Not needed |
| Growth | 1K-10K | Replica set | Sentinel | Single node |
| Scale | 10K-100K | Sharded cluster | Cluster | Read replicas |
| Enterprise | 100K+ | Multi-region | Cluster | Sharded |

---

## 6. Technology Stack Summary

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Validation**: Zod
- **Authentication**: Passport.js + JWT
- **Documentation**: Swagger/OpenAPI

### Database & Cache
- **Primary**: MongoDB 7.x
- **Cache/Queue**: Redis 7.x
- **Queue Library**: BullMQ
- **ODM**: Mongoose 8.x

### AI & External
- **LLM**: OpenAI GPT-4/GPT-4o
- **Email**: SendGrid/AWS SES
- **Storage**: AWS S3 or MinIO
- **Payments**: Stripe

### DevOps
- **Container**: Docker + Docker Compose
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana (future)
- **Logging**: Winston + ELK (future)

### Frontend
- **Framework**: React 18+
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand/Redux Toolkit
- **Charts**: Recharts/Chart.js
- **HTTP Client**: Axios + React Query

---

## 7. API Versioning Strategy

```
/api/v1/...     - Current stable version
/api/v2/...     - Future breaking changes

Deprecation policy:
- Announce 6 months before deprecation
- Maintain for 12 months after new version
- Sunset with 3 months notice
```

---

## 8. Error Handling Strategy

```javascript
// Standardized error response
{
  "success": false,
  "error": {
    "code": "TRADE_NOT_FOUND",
    "message": "Trade with ID 12345 not found",
    "details": { "tradeId": "12345" },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}

// Error categories
400 - Bad Request (validation errors)
401 - Unauthorized (authentication)
403 - Forbidden (authorization)
404 - Not Found
409 - Conflict (duplicate, state conflict)
422 - Unprocessable Entity (business logic)
429 - Too Many Requests (rate limit)
500 - Internal Server Error
503 - Service Unavailable (maintenance)
```

---

*Document Version: 1.0*
*Last Updated: 2024*
