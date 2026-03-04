import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  WalletIcon,
} from '@heroicons/react/24/outline';
import { tradesApi, portfolioApi } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/format';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  href?: string;
}

const StatCard = ({ title, value, change, changeType = 'neutral', icon: Icon, href }: StatCardProps) => {
  const changeColor = {
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-slate-500',
  }[changeType];

  const content = (
    <div className="card hover:shadow-md transition-shadow">
      <div className="card-body">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
            {change && (
              <p className={`mt-1 text-sm ${changeColor} flex items-center gap-1`}>
                {changeType === 'positive' && <ArrowTrendingUpIcon className="h-4 w-4 shrink-0" />}
                {changeType === 'negative' && <ArrowTrendingDownIcon className="h-4 w-4 shrink-0" />}
                {change}
              </p>
            )}
          </div>
          <div className="shrink-0 rounded-lg bg-primary-50 p-3">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};

export const DashboardPage = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['tradeStats'],
    queryFn: () => tradesApi.getStatistics(),
  });

  const { data: portfolioData } = useQuery({
    queryKey: ['defaultPortfolio'],
    queryFn: () => portfolioApi.getDefault(),
  });

  const { data: recentTrades } = useQuery({
    queryKey: ['recentTrades'],
    queryFn: () => tradesApi.getAll({ limit: 5 }),
  });

  const stats = statsData?.data?.data;
  const portfolio = portfolioData?.data?.data;
  const trades = recentTrades?.data?.data?.data || [];
  const isLoading = statsLoading;

  const winRate = stats?.winRate || 0;
  const netPnL = stats?.netPnL || 0;
  const totalTrades = stats?.totalTrades || 0;
  const profitFactor = stats?.profitFactor || 0;

  const StatSkeleton = () => (
    <div className="card animate-pulse">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-slate-200" />
            <div className="h-8 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-600">Welcome back. Here’s your trading overview.</p>
        </div>
        <Link to="/trades/new" className="btn-primary w-full sm:w-auto">
          + New Trade
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
        <StatCard
          title="Net P&L"
          value={formatCurrency(netPnL)}
          change={netPnL >= 0 ? '+' + formatPercentage(stats?.totalReturnPercent) : formatPercentage(stats?.totalReturnPercent)}
          changeType={netPnL >= 0 ? 'positive' : 'negative'}
          icon={ChartBarIcon}
          href="/analytics"
        />
        <StatCard
          title="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          change={`${stats?.winningTrades || 0}W / ${stats?.losingTrades || 0}L`}
          changeType="neutral"
          icon={ClipboardDocumentListIcon}
          href="/trades"
        />
        <StatCard
          title="Total Trades"
          value={totalTrades.toString()}
          change={stats?.avgHoldingPeriod ? `${stats.avgHoldingPeriod.toFixed(1)}d avg hold` : undefined}
          changeType="neutral"
          icon={ClipboardDocumentListIcon}
          href="/trades"
        />
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(portfolio?.summary?.totalValue || 0)}
          change={portfolio?.summary?.totalReturnPercent
            ? `${portfolio.summary.totalReturnPercent >= 0 ? '+' : ''}${portfolio.summary.totalReturnPercent.toFixed(2)}%`
            : undefined}
          changeType={portfolio?.summary?.totalReturnPercent >= 0 ? 'positive' : 'negative'}
          icon={WalletIcon}
          href="/portfolio"
        />
          </>
        )}
      </div>

      <div className="card">
        <div className="card-header flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Recent Trades</h2>
          <Link to="/trades" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        <div className="card-body">
          {trades.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-3 text-sm font-medium text-slate-900">No trades yet</h3>
              <p className="mt-1 text-sm text-slate-500">Create your first trade to get started.</p>
              <div className="mt-6">
                <Link to="/trades/new" className="btn-primary">
                  + New Trade
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 sm:mx-0">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Direction</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">P&L</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Return</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {trades.map((trade: any) => (
                    <tr key={trade._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link to={`/trades/${trade._id}`} className="font-medium text-slate-900 hover:text-primary-600">
                          {trade.symbol}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={trade.direction === 'LONG' ? 'badge-success' : 'badge-danger'}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 font-medium ${trade.calculations?.netPnL >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(trade.calculations?.netPnL || 0)}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 ${trade.calculations?.returnPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatPercentage(trade.calculations?.returnPercent || 0)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link to="/trades/new" className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
          <div className="shrink-0 rounded-lg bg-primary-100 p-3">
            <ClipboardDocumentListIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-slate-900">Log a Trade</h3>
            <p className="text-sm text-slate-500">Record your latest trade</p>
          </div>
        </Link>
        <Link to="/portfolio" className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
          <div className="shrink-0 rounded-lg bg-emerald-100 p-3">
            <WalletIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-slate-900">View Portfolio</h3>
            <p className="text-sm text-slate-500">Check your holdings</p>
          </div>
        </Link>
        <Link to="/analytics" className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
          <div className="shrink-0 rounded-lg bg-amber-100 p-3">
            <ChartBarIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-slate-900">Analytics</h3>
            <p className="text-sm text-slate-500">View detailed stats</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
