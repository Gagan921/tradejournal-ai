import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeftIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { tradesApi } from '../../services/api';
import { formatCurrency, formatPercentage, formatDateTime } from '../../utils/format';
import toast from 'react-hot-toast';

export const TradeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => tradesApi.getById(id!),
  });

  const deleteTrade = useMutation({
    mutationFn: () => tradesApi.delete(id!),
    onSuccess: () => {
      toast.success('Trade deleted successfully');
      navigate('/trades');
    },
    onError: () => {
      toast.error('Failed to delete trade');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading trade...</div>;
  }

  const trade = data?.data?.data;
  if (!trade) {
    return <div className="text-center py-8">Trade not found</div>;
  }

  const isWinning = trade.calculations?.netPnL >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{trade.symbol}</h1>
            <p className="text-gray-600">
              {trade.direction} • {trade.status}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </button>
          <button
            onClick={() => deleteTrade.mutate()}
            disabled={deleteTrade.isPending}
            className="btn-danger"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Net P&L</p>
            <p className={`text-2xl font-bold ${isWinning ? 'text-success-600' : 'text-danger-600'}`}>
              {formatCurrency(trade.calculations?.netPnL || 0)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Return</p>
            <p className={`text-2xl font-bold ${isWinning ? 'text-success-600' : 'text-danger-600'}`}>
              {formatPercentage(trade.calculations?.returnPercent || 0)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">R-Multiple</p>
            <p className="text-2xl font-bold text-gray-900">
              {trade.calculations?.rMultiple?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Holding Period</p>
            <p className="text-2xl font-bold text-gray-900">
              {trade.calculations?.holdingPeriod || 0} days
            </p>
          </div>
        </div>
      </div>

      {/* Trade Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entries */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Entries</h2>
          </div>
          <div className="card-body">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trade.entries.map((entry: any, index: number) => (
                  <tr key={index}>
                    <td className="py-2">{formatCurrency(entry.price)}</td>
                    <td className="py-2">{entry.quantity}</td>
                    <td className="py-2 text-sm text-gray-500">
                      {formatDateTime(entry.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exits */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Exits</h2>
          </div>
          <div className="card-body">
            {trade.exits?.length === 0 ? (
              <p className="text-gray-500">No exits recorded yet.</p>
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Quantity</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {trade.exits?.map((exit: any, index: number) => (
                    <tr key={index}>
                      <td className="py-2">{formatCurrency(exit.price)}</td>
                      <td className="py-2">{exit.quantity}</td>
                      <td className="py-2 text-sm text-gray-500">
                        {formatDateTime(exit.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {trade.tags?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              {trade.tags.map((tag: string) => (
                <span key={tag} className="badge badge-info">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
