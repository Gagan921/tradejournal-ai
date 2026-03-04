import { useQuery } from '@tanstack/react-query';
import { tradesApi } from '../../services/api';
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/format';
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-success-50 text-success-600',
    red: 'bg-danger-50 text-danger-600',
    yellow: 'bg-warning-50 text-warning-600',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsPage = () => {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['tradeStats'],
    queryFn: () => tradesApi.getStatistics(),
  });

  const { data: equityData } = useQuery({
    queryKey: ['equityCurve'],
    queryFn: () => tradesApi.getEquityCurve(),
  });

  const stats = statsData?.data?.data;
  const equityCurve = equityData?.data?.data || [];

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  if (!stats || stats.totalTrades === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No data yet</h3>
        <p className="mt-2 text-gray-500">Start logging trades to see your analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Detailed statistics and performance metrics.</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Net P&L"
          value={formatCurrency(stats.netPnL)}
          subtitle={`${formatPercentage(stats.totalReturnPercent)} return`}
          icon={ChartBarIcon}
          color={stats.netPnL >= 0 ? 'green' : 'red'}
        />
        <StatCard
          title="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          subtitle={`${stats.winningTrades} wins / ${stats.losingTrades} losses`}
          icon={TrophyIcon}
          color="blue"
        />
        <StatCard
          title="Profit Factor"
          value={stats.profitFactor.toFixed(2)}
          subtitle={stats.profitFactor >= 1 ? 'Profitable' : 'Unprofitable'}
          icon={ScaleIcon}
          color={stats.profitFactor >= 1 ? 'green' : 'red'}
        />
        <StatCard
          title="Expectancy"
          value={formatCurrency(stats.expectancy)}
          subtitle="Expected value per trade"
          icon={FireIcon}
          color={stats.expectancy >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Statistics */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Trade Statistics</h2>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Trades</dt>
                <dd className="font-medium">{formatNumber(stats.totalTrades)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Winning Trades</dt>
                <dd className="font-medium text-success-600">{formatNumber(stats.winningTrades)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Losing Trades</dt>
                <dd className="font-medium text-danger-600">{formatNumber(stats.losingTrades)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Average Win</dt>
                <dd className="font-medium text-success-600">{formatCurrency(stats.avgWin)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Average Loss</dt>
                <dd className="font-medium text-danger-600">{formatCurrency(stats.avgLoss)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Largest Win</dt>
                <dd className="font-medium text-success-600">{formatCurrency(stats.largestWin)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Largest Loss</dt>
                <dd className="font-medium text-danger-600">{formatCurrency(stats.largestLoss)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Fees</dt>
                <dd className="font-medium">{formatCurrency(stats.totalFees)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Average Holding Period</dt>
                <dd className="font-medium">{stats.avgHoldingPeriod.toFixed(1)} days</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Performance Metrics</h2>
          </div>
          <div className="card-body">
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-gray-600">Gross P&L</dt>
                <dd className={`font-medium ${stats.grossPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(stats.grossPnL)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Net P&L</dt>
                <dd className={`font-medium ${stats.netPnL >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(stats.netPnL)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Win Rate</dt>
                <dd className="font-medium">{formatPercentage(stats.winRate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Profit Factor</dt>
                <dd className={`font-medium ${stats.profitFactor >= 1 ? 'text-success-600' : 'text-danger-600'}`}>
                  {stats.profitFactor.toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Expectancy</dt>
                <dd className={`font-medium ${stats.expectancy >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatCurrency(stats.expectancy)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Total Return</dt>
                <dd className={`font-medium ${stats.totalReturnPercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatPercentage(stats.totalReturnPercent)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Equity Curve */}
      {equityCurve.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Equity Curve</h2>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-end gap-1">
              {equityCurve.map((point: any, index: number) => {
                const maxEquity = Math.max(...equityCurve.map((p: any) => p.equity));
                const minEquity = Math.min(...equityCurve.map((p: any) => p.equity));
                const range = maxEquity - minEquity || 1;
                const height = ((point.equity - minEquity) / range) * 100;
                const isPositive = point.pnl >= 0;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col justify-end group relative"
                  >
                    <div
                      className={`w-full rounded-t ${isPositive ? 'bg-success-400' : 'bg-danger-400'}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {formatCurrency(point.equity)}
                      <br />
                      {new Date(point.date).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
