/**
 * Trade Analytics Modal - Quick trade analytics in a dialog
 * Shows comprehensive analytics for a single trade
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import Link from 'next/link';

interface TradeAnalyticsModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Analytics {
  tradeId: string;
  symbol: string;
  description: string;
  action: 'BUY' | 'SELL';
  status: string;
  entryDate: string;
  entryPrice: number;
  units: number;
  entryValue: number;
  exitDate?: string;
  exitPrice?: number;
  exitValue?: number;
  grossPL?: number;
  fees: number;
  netPL?: number;
  returnPercent?: number;
  orderType: string;
  limitPrice?: number;
  slippage?: number;
  fillRate: number;
  holdDuration?: number;
  executionTime?: number;
  portfolioValueAtEntry?: number;
  positionSizePercent?: number;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPL?: number;
  marketHours: boolean;
}

export function TradeAnalyticsModal({ orderId, open, onOpenChange }: TradeAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && orderId) {
      fetchAnalytics();
    }
  }, [open, orderId]);

  const fetchAnalytics = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trades/${orderId}/analytics`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setAnalytics(result.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return '-';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const formatExecutionTime = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--success-bg)] text-[var(--success)] text-xs font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Executed
        </span>
      );
    }
    if (status === 'FAILED' || status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--danger-bg)] text-[var(--danger)] text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--info-bg)] text-[var(--info)] text-xs font-medium">
          <Clock className="w-3 h-3" />
        {status}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
            Trade Analytics
          </DialogTitle>
          <DialogDescription>
            Comprehensive performance metrics and execution analysis
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger)]">
            <AlertCircle className="w-5 h-5 text-[var(--danger)]" />
            <p className="text-sm text-[var(--danger)]">{error}</p>
          </div>
        )}

        {!loading && !error && analytics && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-[var(--foreground)]">
                    {analytics.symbol}
                  </h3>
                  {getStatusBadge(analytics.status)}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                      analytics.action === 'BUY'
                        ? 'bg-[var(--success-bg)] text-[var(--success)]'
                        : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                    )}
                  >
                    {analytics.action === 'BUY' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {analytics.action}
                  </span>
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {analytics.description}
                </p>
              </div>
            </div>

            {/* P&L Summary */}
            {(analytics.netPL !== undefined || analytics.unrealizedPL !== undefined) && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
                <h4 className="text-sm font-semibold text-[var(--foreground-muted)] mb-4">
                  Profit & Loss
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-[var(--foreground-tertiary)] mb-1">
                      {analytics.netPL !== undefined ? 'Realized P&L' : 'Unrealized P&L'}
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        (analytics.netPL || analytics.unrealizedPL || 0) >= 0
                          ? 'text-[var(--success)]'
                          : 'text-[var(--danger)]'
                      )}
                    >
                      {formatCurrency(analytics.netPL || analytics.unrealizedPL || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Return</p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        (analytics.returnPercent || 0) >= 0
                          ? 'text-[var(--success)]'
                          : 'text-[var(--danger)]'
                      )}
                    >
                      {analytics.returnPercent !== undefined
                        ? formatPercent(analytics.returnPercent)
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Entry & Exit Details */}
            <div className="grid grid-cols-2 gap-4">
              {/* Entry */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h4 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Entry
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Price</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(analytics.entryPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Units</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {analytics.units.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Total</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(analytics.entryValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Date</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {new Date(analytics.entryDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exit or Current */}
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                <h4 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  {analytics.exitPrice ? 'Exit' : 'Current'}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Price</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(analytics.exitPrice || analytics.currentPrice || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Units</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {analytics.units.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[var(--foreground-tertiary)]">Total</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(analytics.exitValue || analytics.currentValue || 0)}
                    </span>
                  </div>
                  {analytics.exitDate && (
                    <div className="flex justify-between">
                      <span className="text-xs text-[var(--foreground-tertiary)]">Date</span>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {new Date(analytics.exitDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Execution Metrics */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Execution Quality
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Order Type</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {analytics.orderType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Fill Rate</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {formatPercent(analytics.fillRate)}
                  </p>
                </div>
                {analytics.slippage !== null && analytics.slippage !== undefined && (
                  <div>
                    <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Slippage</p>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        Math.abs(analytics.slippage) < 0.5
                          ? 'text-[var(--success)]'
                          : 'text-[var(--warning)]'
                      )}
                    >
                      {formatPercent(analytics.slippage)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Fees</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {formatCurrency(analytics.fees)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Exec Time</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {formatExecutionTime(analytics.executionTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Market Hours</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {analytics.marketHours ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Position Metrics */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--foreground-muted)] mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Position Metrics
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[var(--foreground-tertiary)] mb-1">Hold Duration</p>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {formatDuration(analytics.holdDuration)}
                  </p>
                </div>
                {analytics.positionSizePercent !== null && analytics.positionSizePercent !== undefined && (
                  <div>
                    <p className="text-xs text-[var(--foreground-tertiary)] mb-1">
                      Position Size
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {formatPercent(analytics.positionSizePercent)}
                    </p>
                  </div>
                )}
                {analytics.portfolioValueAtEntry && (
                  <div>
                    <p className="text-xs text-[var(--foreground-tertiary)] mb-1">
                      Portfolio Value
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {formatCurrency(analytics.portfolioValueAtEntry)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <Link href={`/trades/${analytics.tradeId}/analytics`} className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Detailed Analytics
                </Button>
              </Link>
              <Button variant="default" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
