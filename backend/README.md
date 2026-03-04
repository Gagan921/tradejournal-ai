# TradeMind API

A production-grade REST API for the TradeMind AI Trading Journal Platform.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Email verification
  - Password reset
  - OAuth integration (Google, GitHub)
  - Role-based access control

- **Trading Journal**
  - Trade CRUD operations
  - Multi-leg trades (scale in/out)
  - Screenshot uploads
  - Tag system
  - Trade filtering and search

- **Portfolio Tracking**
  - Holdings management
  - PnL calculations
  - Performance analytics

- **AI Integration**
  - Trade analysis
  - Pattern detection
  - Mistake identification

## Tech Stack

- **Runtime**: Node.js 20+ LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Database**: MongoDB 7.x (Mongoose ODM)
- **Cache**: Redis 7.x (ioredis)
- **Queue**: BullMQ
- **Validation**: Zod
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js 20+ 
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration

### Development

Start all services with Docker Compose:
```bash
docker-compose up -d
```

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### API Documentation

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/verify-email` | Verify email |
| POST | `/api/v1/auth/forgot-password` | Request password reset |
| POST | `/api/v1/auth/change-password` | Change password |
| GET | `/api/v1/auth/me` | Get current user |
| PUT | `/api/v1/auth/me` | Update current user |

#### Trades

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/trades` | Create trade |
| GET | `/api/v1/trades` | List trades |
| GET | `/api/v1/trades/:id` | Get trade by ID |
| PUT | `/api/v1/trades/:id` | Update trade |
| DELETE | `/api/v1/trades/:id` | Delete trade |
| POST | `/api/v1/trades/:id/exit` | Add exit to trade |
| GET | `/api/v1/trades/statistics` | Get trade statistics |
| GET | `/api/v1/trades/symbols` | Get distinct symbols |
| GET | `/api/v1/trades/tags` | Get distinct tags |
| GET | `/api/v1/trades/equity-curve` | Get equity curve |

### Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Linting

Run ESLint:
```bash
npm run lint
```

Fix ESLint errors:
```bash
npm run lint:fix
```

### Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
src/
├── api/
│   ├── controllers/    # Request handlers
│   ├── middleware/     # Express middleware
│   ├── routes/         # Route definitions
│   └── validators/     # Request validation
├── config/             # Configuration
├── constants/          # Application constants
├── interfaces/         # TypeScript interfaces
├── jobs/               # Background jobs
├── models/             # Mongoose models
├── repositories/       # Data access layer
├── services/           # Business logic
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - |
| `OPENAI_API_KEY` | OpenAI API key | - |

See `.env.example` for complete list.

## License

MIT
