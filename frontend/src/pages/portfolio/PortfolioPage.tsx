import { useQuery } from '@tanstack/react-query';
import { portfolioApi } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/format';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export const PortfolioPage = () => {
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['defaultPortfolio'],
    queryFn: () => portfolioApi.getDefault(),
  });

  const { data: performanceData } = useQuery({
    queryKey: ['portfolioPerformance'],
    queryFn: () => {
      const portfolio = portfolioData?.data?.data;
      if (portfolio) {
        return portfolioApi.getPerformance(portfolio._id);
      }
      return null;
    },
    enabled: !!portfolioData?.data?.data,
  });

  const portfolio = portfolioData?.data?.data;
  const performance = performanceData?.data?.data;

  if (isLoading) {
    return <div className="text-center py-8">Loading portfolio...</div>;
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <WalletIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No portfolio yet</h3>
        <p className="mt-2 text-gray-500">Create a portfolio to start tracking your holdings.</p>
      </div>
    );
  }

  const holdings = portfolio.holdings || [];
  const summary = portfolio.summary || {};
  const allocation = portfolio.allocation || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{portfolio.name}</h1>
        <p className="text-gray-600">{portfolio.description || 'Your trading portfolio'}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalValue || 0)}
                </p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <WalletIcon className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(portfolio.cash?.available || 0)}
                </p>
              </div>
              <div className="p-3 bg-success-50 rounded-lg">
                <BanknotesIcon className="w-6 h-6 text-success-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Return</p>
                <p
                  className={`text-2xl font-bold ${
                    (summary.totalReturn || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatCurrency(summary.totalReturn || 0)}
                </p>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg">
                {summary.totalReturn >= 0 ? (
                  <ArrowTrendingUpIcon className="w-6 h-6 text-success-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-6 h-6 text-danger-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Return %</p>
                <p
                  className={`text-2xl font-bold ${
                    (summary.totalReturnPercent || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatPercentage(summary.totalReturnPercent || 0)}
                </p>
              </div>
              <div className="p-3 bg-warning-50 rounded-lg">
                {summary.totalReturnPercent >= 0 ? (
                  <ArrowTrendingUpIcon className="w-6 h-6 text-success-600" />
                ) : (
                  <ArrowTrendingDownIcon className="w-6 h-6 text-danger-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
        </div>
        <div className="card-body">
          {holdings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No holdings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3">Symbol</th>
                    <th className="pb-3">Quantity</th>
                    <th className="pb-3">Avg Price</th>
                    <th className="pb-3">Current Price</th>
                    <th className="pb-3">Market Value</th>
                    <th className="pb-3">Unrealized P&L</th>
                    <th className="pb-3">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {holdings.map((holding: any) => (
                    <tr key={holding.symbol}>
                      <td className="py-3 font-medium">{holding.symbol}</td>
                      <td className="py-3">{holding.quantity}</td>
                      <td className="py-3">{formatCurrency(holding.avgPrice)}</td>
                      <td className="py-3">{formatCurrency(holding.currentPrice)}</td>
                      <td className="py-3">{formatCurrency(holding.marketValue)}</td>
                      <td className="py-3">
                        <span
                          className={
                            holding.unrealizedPnL >= 0 ? 'text-success-600' : 'text-danger-600'
                          }
                        >
                          {formatCurrency(holding.unrealizedPnL)} (
                          {formatPercentage(holding.unrealizedPnLPercent)})
                        </span>
                      </td>
                      <td className="py-3">{holding.allocation.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Asset Allocation */}
      {allocation.byAssetClass?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Asset Allocation</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allocation.byAssetClass.map((item: any) => (
                <div key={item.class} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{item.class}</p>
                  <p className="text-xl font-bold text-gray-900">{item.percentage.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      {performance && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Performance</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Day</p>
                <p
                  className={`text-xl font-bold ${
                    performance.dayChange >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatPercentage(performance.dayChangePercent)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Week</p>
                <p
                  className={`text-xl font-bold ${
                    performance.weekChange >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatPercentage(performance.weekChangePercent)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Month</p>
                <p
                  className={`text-xl font-bold ${
                    performance.monthChange >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatPercentage(performance.monthChangePercent)}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Year</p>
                <p
                  className={`text-xl font-bold ${
                    performance.yearChange >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}
                >
                  {formatPercentage(performance.yearChangePercent)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
