/**
 * Trade Analytics Detail Page - Full comprehensive analytics view
 * /trades/[id]/analytics
 */

"use client";

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  Activity,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Bell,
  Settings,
} from 'lucide-react';
import { formatCurrency, formatPercent, cn } from '@/lib/utils';
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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

export default function TradeAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [resolvedParams.id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/trades/${resolvedParams.id}/analytics`);
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
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${Math.round(hours)} hours`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'EXECUTED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--success-bg)] text-[var(--success)] text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Executed
        </span>
      );
    }
    if (status === 'FAILED' || status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--danger-bg)] text-[var(--danger)] text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--info-bg)] text-[var(--info)] text-sm font-medium">
        <Clock className="w-4 h-4" />
        {status}
      </span>
    );
  };

  // Mock data for charts - in production, fetch historical price data
  const priceHistoryData = analytics
    ? [
        { time: 'Entry', price: analytics.entryPrice },
        { time: '+1h', price: analytics.entryPrice * 1.005 },
        { time: '+2h', price: analytics.entryPrice * 0.998 },
        { time: '+4h', price: analytics.entryPrice * 1.012 },
        { time: 'Current', price: analytics.currentPrice || analytics.exitPrice || analytics.entryPrice },
      ]
    : [];

  const plBreakdownData = analytics
    ? [
        { name: 'Gross P&L', value: Math.abs(analytics.grossPL || 0), color: 'var(--primary)' },
        { name: 'Fees', value: analytics.fees, color: 'var(--danger)' },
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--foreground-muted)]">Loading trade analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-[var(--danger)]" />
          <h2 className="text-xl font-semibold text-[var(--foreground)]">
            Failed to Load Analytics
          </h2>
          <p className="text-[var(--foreground-muted)]">
            {error || 'Trade not found'}
          </p>
          <Link href="/dashboard/trades">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Trades
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <TradeOSLogoCompact />
            </Link>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchAnalytics}
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/trades"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-4 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Trade History
          </Link>
          <div className="flex items-start justify-between mt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">
                  <span className="gradient-text">{analytics.symbol}</span>
                </h1>
                {getStatusBadge(analytics.status)}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium",
                    analytics.action === 'BUY'
                      ? 'bg-[var(--success-bg)] text-[var(--success)]'
                      : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                  )}
                >
                  {analytics.action === 'BUY' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {analytics.action}
                </span>
              </div>
              <p className="text-[var(--foreground-muted)]">
                {analytics.description}
              </p>
            </div>

            <Button variant="outline" className="gap-2">
              <Download className="w-5 h-5" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label={analytics.netPL !== undefined ? "Net P&L" : "Unrealized P&L"}
            value={formatCurrency(analytics.netPL || analytics.unrealizedPL || 0)}
            icon={analytics.netPL !== undefined && analytics.netPL >= 0 ? TrendingUp : TrendingDown}
            trend={analytics.netPL !== undefined && analytics.netPL >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Entry Value"
            value={formatCurrency(analytics.entryValue)}
            icon={DollarSign}
          />
          <StatCard
            label="Current Value"
            value={formatCurrency(analytics.currentValue || analytics.exitValue || 0)}
            icon={Target}
          />
          <StatCard
            label="Hold Duration"
            value={formatDuration(analytics.holdDuration)}
            icon={Clock}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Price History Chart */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Price Movement
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={priceHistoryData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="rgb(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="time"
                  stroke="var(--foreground-muted)"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="var(--foreground-muted)"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${value.toFixed(2)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="rgb(var(--primary))"
                  fill="url(#priceGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* P&L Breakdown */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              P&L Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface-elevated)]">
                <span className="text-sm text-[var(--foreground-muted)]">Gross P&L</span>
                <span
                  className={cn(
                    "text-lg font-semibold",
                    (analytics.grossPL || 0) >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  )}
                >
                  {formatCurrency(analytics.grossPL || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface-elevated)]">
                <span className="text-sm text-[var(--foreground-muted)]">Fees</span>
                <span className="text-lg font-semibold text-[var(--danger)]">
                  -{formatCurrency(analytics.fees)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--primary-bg)] border-2 border-[var(--primary)]">
                <span className="text-sm font-semibold text-[var(--foreground)]">Net P&L</span>
                <span
                  className={cn(
                    "text-xl font-bold",
                    (analytics.netPL || analytics.unrealizedPL || 0) >= 0
                      ? 'text-[var(--success)]'
                      : 'text-[var(--danger)]'
                  )}
                >
                  {formatCurrency(analytics.netPL || analytics.unrealizedPL || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Execution Quality */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--primary)]" />
              Execution Quality
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Order Type</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {analytics.orderType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Fill Rate</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatPercent(analytics.fillRate)}
                </span>
              </div>
              {analytics.slippage !== null && analytics.slippage !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Slippage</span>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      Math.abs(analytics.slippage) < 0.5
                        ? 'text-[var(--success)]'
                        : 'text-[var(--warning)]'
                    )}
                  >
                    {formatPercent(analytics.slippage)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Execution Time</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {analytics.executionTime ? `${Math.round(analytics.executionTime)}s` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Position Sizing */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
              Position Sizing
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Position Size</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {analytics.positionSizePercent
                    ? formatPercent(analytics.positionSizePercent)
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Entry Value</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatCurrency(analytics.entryValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Portfolio Value</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {analytics.portfolioValueAtEntry
                    ? formatCurrency(analytics.portfolioValueAtEntry)
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Units</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {analytics.units.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Time Metrics */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--primary)]" />
              Time Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Entry Date</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {new Date(analytics.entryDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Entry Time</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {new Date(analytics.entryDate).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Hold Duration</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {formatDuration(analytics.holdDuration)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Market Hours</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {analytics.marketHours ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trade Timeline */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            Trade Timeline
          </h3>
          <div className="relative pl-8">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--border)]"></div>

            {/* Entry */}
            <div className="relative mb-8">
              <div className="absolute -left-[21px] w-5 h-5 rounded-full bg-[var(--success)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                  Order Placed
                </p>
                <p className="text-xs text-[var(--foreground-muted)] mb-2">
                  {new Date(analytics.entryDate).toLocaleString()}
                </p>
                <div className="text-xs text-[var(--foreground-secondary)]">
                  {analytics.action} {analytics.units} units of {analytics.symbol} @ {formatCurrency(analytics.entryPrice)}
                </div>
              </div>
            </div>

            {/* Execution */}
            {analytics.exitDate && (
              <div className="relative">
                <div className="absolute -left-[21px] w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                    Order Executed
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] mb-2">
                    {new Date(analytics.exitDate).toLocaleString()}
                  </p>
                  <div className="text-xs text-[var(--foreground-secondary)]">
                    Filled @ {formatCurrency(analytics.exitPrice || 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
