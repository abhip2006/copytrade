'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, RefreshCw, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, BarChart3 } from 'lucide-react';
import { TradeAnalyticsModal } from '@/components/trading/trade-analytics-modal';

interface Order {
  id: string;
  symbol: string;
  symbolId: string;
  description: string;
  action: string;
  orderType: string;
  status: string;
  units: number;
  filledUnits: number;
  openUnits: number;
  canceledUnits: number;
  price?: number;
  limitPrice?: number;
  stopPrice?: number;
  executedPrice?: number;
  timeInForce: string;
  timePlaced: string;
  timeUpdated?: string;
  timeExecuted?: string;
  exchangeOrderId?: string;
}

export default function LeaderOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'executed' | 'cancelled'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('state', filterStatus);
      }

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingOrderId(orderId);

      const response = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to cancel order');
      }

      // Refresh orders list
      await fetchOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert(err instanceof Error ? err.message : 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReplaceOrder = (order: Order) => {
    // Redirect to trade interface with pre-filled data
    const params = new URLSearchParams({
      symbol: order.symbol,
      symbolId: order.symbolId,
      action: order.action,
      orderType: order.orderType,
      units: order.openUnits.toString(),
      ...(order.limitPrice && { limitPrice: order.limitPrice.toString() }),
      ...(order.stopPrice && { stopPrice: order.stopPrice.toString() }),
      replaceOrderId: order.id,
    });

    router.push(`/leader?${params}`);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('executed') || statusLower.includes('filled')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--success-bg)] text-[var(--success)] text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Executed
        </span>
      );
    }

    if (statusLower.includes('cancel')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--danger-bg)] text-[var(--danger)] text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    }

    if (statusLower.includes('open') || statusLower.includes('pending')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--info-bg)] text-[var(--info)] text-xs font-medium">
          <Clock className="w-3 h-3" />
          Open
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] text-xs font-medium">
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number) => {
    if (!price) return '-';
    return `$${price.toFixed(2)}`;
  };

  const isOrderOpen = (status: string) => {
    const statusLower = status.toLowerCase();
    return statusLower.includes('open') || statusLower.includes('pending');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/leader')}
            className="inline-flex items-center gap-2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
                Your Orders
              </h1>
              <p className="text-[var(--foreground-secondary)]">
                View and manage all your trading orders
              </p>
            </div>

            <button
              onClick={fetchOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'open', 'executed', 'cancelled'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === filter
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-secondary)] hover:bg-[var(--surface-elevated)]'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--danger-bg)] border border-[var(--danger)] rounded-lg">
            <p className="text-[var(--danger)]">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
          </div>
        )}

        {/* Orders List */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--foreground-secondary)] text-lg">
              No orders found
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-[var(--foreground)]">
                        {order.symbol}
                      </h3>
                      {getStatusBadge(order.status)}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          order.action.toLowerCase() === 'buy'
                            ? 'bg-[var(--success-bg)] text-[var(--success)]'
                            : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                        }`}
                      >
                        {order.action.toLowerCase() === 'buy' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {order.action.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[var(--foreground-secondary)] text-sm mb-1">
                      {order.description}
                    </p>
                    <p className="text-[var(--foreground-tertiary)] text-xs">
                      Placed: {formatDate(order.timePlaced)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setAnalyticsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </button>
                    {isOrderOpen(order.status) && (
                      <>
                        <button
                          onClick={() => handleReplaceOrder(order)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--info)] hover:bg-[var(--info)]/90 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Replace
                        </button>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancellingOrderId === order.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          {cancellingOrderId === order.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
                  <div>
                    <p className="text-[var(--foreground-tertiary)] text-xs mb-1">
                      Order Type
                    </p>
                    <p className="text-[var(--foreground)] font-medium">
                      {order.orderType}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--foreground-tertiary)] text-xs mb-1">
                      Quantity
                    </p>
                    <p className="text-[var(--foreground)] font-medium">
                      {order.filledUnits}/{order.units}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--foreground-tertiary)] text-xs mb-1">
                      Limit Price
                    </p>
                    <p className="text-[var(--foreground)] font-medium">
                      {formatPrice(order.limitPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--foreground-tertiary)] text-xs mb-1">
                      Executed Price
                    </p>
                    <p className="text-[var(--foreground)] font-medium">
                      {formatPrice(order.executedPrice)}
                    </p>
                  </div>
                </div>

                {/* Additional Details */}
                {(order.stopPrice || order.timeExecuted) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {order.stopPrice && (
                      <div>
                        <p className="text-[var(--foreground-tertiary)] text-xs mb-1">
                          Stop Price
                        </p>
                        <p className="text-[var(--foreground)] font-medium">
                          {formatPrice(order.stopPrice)}
                        </p>
                      </div>
                    )}
                    {order.timeExecuted && (
                      <div>
                        <p className="text-[var(--foreground-tertiary)] text-xs mb-1">
                          Executed At
                        </p>
                        <p className="text-[var(--foreground)] font-medium text-sm">
                          {formatDate(order.timeExecuted)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      <TradeAnalyticsModal
        orderId={selectedOrderId}
        open={analyticsModalOpen}
        onOpenChange={setAnalyticsModalOpen}
      />
    </div>
  );
}
