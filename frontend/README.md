# TradeMind Frontend

A modern React application for the TradeMind AI Trading Journal Platform.

## Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Project Structure

```
src/
├── components/
│   ├── common/       # Reusable UI components
│   ├── layout/       # Layout components
│   ├── forms/        # Form components
│   └── charts/       # Chart components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── services/         # API services
├── store/            # Zustand stores
├── types/            # TypeScript types
├── utils/            # Utility functions
└── constants/        # Constants
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Features

- **Authentication**: Login, Register, Password reset
- **Dashboard**: Overview with key metrics
- **Trades**: CRUD operations for trades
- **Portfolio**: Track holdings and performance
- **Analytics**: Detailed statistics and charts
- **Settings**: Profile and preferences management
