# 📈 TradeJournal-AI

**AI-powered Trade Journal & Analytics Platform** — full-stack application to track, analyze, and improve your trading performance with AI insights.([GitHub][1])

---

## 🚀 Project Overview

TradeJournal-AI is a modular, production-ready trading journal platform with:

* **Backend API** for user auth, trades CRUD, portfolio stats, and AI analysis.([GitHub][1])
* **Frontend dashboard** for visualization, metrics, and interactive trade management.([GitHub][2])
* Designed to help traders log trades, view analytics, generate statistics, and improve decision-making over time.

---

## 📂 Features

### 🔐 Authentication

* JWT authentication and refresh
* Email verification & password reset
* OAuth support (Google, GitHub)
  📌 User profile update & account management.([GitHub][1])

### 📊 Trade Management

* Create / read / update / delete trades
* Multi-leg trades support
* Screenshot uploads with tagging
* Trade filtering & searching
* Equity curve & aggregated statistics endpoints
  📌 Powered by Express & validated with Zod.([GitHub][1])

### 📈 Portfolio & Analytics

* Real-time P&L calculations
* Performance analytics endpoints
* AI pattern detection & mistake identification
  📌 Can drive dashboards or personalized insights.([GitHub][1])

### 🧠 AI Integration

* Future-ready hooks for OpenAI (or similar) *analysis, alerts, pattern detection*.
  📌 Key for automated feedback and deeper insights.([GitHub][1])

### 📊 Frontend Highlights

* Dashboard with charts & key metrics
* Trade CRUD UI
* Portfolio views and analytics panels
* Auth flows & responsive UX
  📌 Built with React + Vite + Tailwind CSS.([GitHub][2])

---

## 🧰 Tech Stack

| Layer           | Tech                                    |               |
| --------------- | --------------------------------------- | ------------- |
| Backend         | Node.js 20+, Express.js 4.x, TypeScript |               |
| Database        | MongoDB (Mongoose ODM)                  |               |
| Cache           | Redis                                   |               |
| Background Jobs | BullMQ                                  |               |
| Validation      | Zod                                     |               |
| Testing         | Jest                                    | ([GitHub][1]) |

| Frontend | React 18, Vite, TypeScript |
| State | Zustand |
| UI | Tailwind CSS |
| Data Fetch | TanStack Query |
| Forms | React Hook Form + Zod |
| Notifications | React Hot Toast |([GitHub][2])

---

## 🧑‍💻 Getting Started

### Clone the repo

```bash
git clone https://github.com/Gagan921/tradejournal-ai.git
cd tradejournal-ai
```

---

### 🔧 Backend Setup

> Requirements: **Node.js 20+, Docker (optional), MongoDB, Redis**

1. Install dependencies

```bash
cd backend
npm install
```

2. Copy and update environment variables

```bash
cp .env.example .env
```

3. Start services with Docker Compose (optional)

```bash
docker-compose up -d
```

4. Start development API

```bash
npm run dev
```

> API runs at `http://localhost:5000` by default.([GitHub][1])

---

### 📦 Frontend Setup

> Requirements: **Node.js 18+**

1. Install deps & set frontend API endpoint

```bash
cd frontend
npm install
```

2. Create `.env`

```
VITE_API_URL=http://localhost:5000/api/v1
```

3. Run app

```bash
npm run dev
```

> Open `http://localhost:5173` in your browser.([GitHub][2])

---

## 📑 API Endpoints (Examples)

> All endpoints are prefixed with `/api/v1`

### Auth

| Method | Endpoint         | Description    |               |
| ------ | ---------------- | -------------- | ------------- |
| POST   | `/auth/register` | Register user  |               |
| POST   | `/auth/login`    | Login          |               |
| POST   | `/auth/logout`   | Logout         |               |
| POST   | `/auth/refresh`  | Refresh tokens |               |
| GET    | `/auth/me`       | Current user   | ([GitHub][1]) |

### Trades

| Method | Endpoint             | Description  |               |
| ------ | -------------------- | ------------ | ------------- |
| POST   | `/trades`            | Create trade |               |
| GET    | `/trades`            | List trades  |               |
| GET    | `/trades/:id`        | Get by ID    |               |
| PUT    | `/trades/:id`        | Update trade |               |
| DELETE | `/trades/:id`        | Remove trade |               |
| GET    | `/trades/statistics` | Analytics    | ([GitHub][1]) |

---

## 🛠 Development Workflow

* **Linting**

```bash
npm run lint
```

* **Tests**

```bash
npm test
npm run test:coverage
```

* **Production Build**

```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions are welcome — open issues and pull requests to:

✔️ expand AI analysis features
✔️ support additional metrics & dashboards
✔️ add improved test coverage

---

## 📄 License

Distributed under the **MIT License**.

---

## 📌 Notes

This project structures backend and frontend clearly and includes AI-ready integrations — ideal for expanding towards automated trade insights and pattern detection.([GitHub][1])

---

[1]: https://github.com/Gagan921/tradejournal-ai/blob/main/backend "tradejournal-ai/backend at main · Gagan921/tradejournal-ai · GitHub"
[2]: https://github.com/Gagan921/tradejournal-ai/blob/main/frontend "tradejournal-ai/frontend at main · Gagan921/tradejournal-ai · GitHub"
