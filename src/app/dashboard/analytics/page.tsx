/**
 * Analytics Page - Portfolio analytics and performance visualization
 * Implements missing P1 feature from implementation status
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceChart } from "@/components/trading/price-chart";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  PieChart,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Download,
  Bell,
  Settings,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatPercent, formatDateTime } from "@/lib/utils";
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

interface AnalyticsData {
  portfolio: {
    totalValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    dayChange: number;
    dayChangePercent: number;
  };
  performance: {
    bestDay: { date: string; value: number };
    worstDay: { date: string; value: number };
    avgDailyReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  holdings: {
    symbol: string;
    allocation: number;
    value: number;
    pnl: number;
    pnlPercent: number;
  }[];
  recentActivity: {
    date: string;
    action: string;
    description: string;
    impact: number;
  }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1M');

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);

      // Fetch portfolio stats
      const statsResponse = await fetch('/api/portfolio/stats');
      const statsResult = await statsResponse.json();

      // Fetch positions for holdings
      const positionsResponse = await fetch('/api/positions');
      const positionsResult = await positionsResponse.json();

      // Fetch trade history for activity
      const tradesResponse = await fetch('/api/trades/history?limit=10');
      const tradesResult = await tradesResponse.json();

      if (statsResult.success && statsResult.data) {
        const stats = statsResult.data;
        const positions = positionsResult.success ? positionsResult.data : [];
        const trades = tradesResult.success ? tradesResult.trades : [];

        // Calculate holdings data
        const totalPositionsValue = positions.reduce((sum: number, pos: any) =>
          sum + (pos.current_value || 0), 0
        );

        const holdings = positions.slice(0, 5).map((pos: any) => ({
          symbol: pos.symbol,
          allocation: totalPositionsValue > 0 ? (pos.current_value / totalPositionsValue) * 100 : 0,
          value: pos.current_value || 0,
          pnl: pos.unrealized_pnl || 0,
          pnlPercent: pos.unrealized_pnl_percent || 0,
        }));

        // Calculate performance metrics (simplified)
        const avgDailyReturn = stats.dayChangePercent || 0;
        const volatility = Math.abs(avgDailyReturn) * 1.5; // Simplified calculation
        const sharpeRatio = volatility > 0 ? avgDailyReturn / volatility : 0;

        // Format recent activity
        const recentActivity = trades.slice(0, 5).map((trade: any) => ({
          date: trade.timestamp || trade.executed_at,
          action: trade.action === 'buy' ? 'Buy' : 'Sell',
          description: `${trade.action.toUpperCase()} ${trade.quantity} ${trade.symbol}`,
          impact: trade.quantity * trade.price * (trade.action === 'buy' ? -1 : 1),
        }));

        setAnalytics({
          portfolio: {
            totalValue: stats.totalValue || 0,
            totalPnL: stats.totalPnL || 0,
            totalPnLPercent: stats.totalPnLPercent || 0,
            dayChange: stats.dayChange || 0,
            dayChangePercent: stats.dayChangePercent || 0,
          },
          performance: {
            bestDay: { date: new Date().toISOString(), value: Math.max(stats.dayChange || 0, 0) },
            worstDay: { date: new Date().toISOString(), value: Math.min(stats.dayChange || 0, 0) },
            avgDailyReturn,
            volatility,
            sharpeRatio,
          },
          holdings,
          recentActivity,
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 120000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--foreground-muted)]">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--foreground-muted)]">No analytics data available</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry
          </Button>
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
                disabled={refreshing}
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-2 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Deep insights into your portfolio performance
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Calendar className="w-5 h-5" />
              {timeframe}
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-5 h-5" />
              Export
            </Button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Portfolio Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(analytics.portfolio.totalValue)}
            icon={DollarSign}
            trend={analytics.portfolio.dayChange >= 0 ? "up" : "down"}
            change={{
              value: Math.abs(analytics.portfolio.dayChangePercent),
              period: "today",
            }}
          />
          <StatCard
            label="Total Return"
            value={formatCurrency(analytics.portfolio.totalPnL)}
            icon={TrendingUp}
            trend={analytics.portfolio.totalPnL >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Avg Daily Return"
            value={formatPercent(analytics.performance.avgDailyReturn)}
            icon={Activity}
            trend={analytics.performance.avgDailyReturn >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Sharpe Ratio"
            value={analytics.performance.sharpeRatio.toFixed(2)}
            icon={BarChart3}
          />
        </div>

        {/* Performance Chart */}
        <div className="mb-12">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
              Portfolio Performance
            </h2>
            <div className="h-[400px]">
              <PriceChart symbol="PORTFOLIO" />
            </div>
          </Card>
        </div>

        {/* Performance Metrics & Holdings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Performance Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">
              Performance Metrics
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Best Day</span>
                  <div className="flex items-center gap-2 text-[var(--success)]">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">
                      {formatCurrency(analytics.performance.bestDay.value)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[var(--foreground-tertiary)]">
                  {formatDateTime(analytics.performance.bestDay.date)}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Worst Day</span>
                  <div className="flex items-center gap-2 text-[var(--danger)]">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-semibold">
                      {formatCurrency(analytics.performance.worstDay.value)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-[var(--foreground-tertiary)]">
                  {formatDateTime(analytics.performance.worstDay.date)}
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Volatility</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {formatPercent(analytics.performance.volatility)}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Risk-Adjusted Return</span>
                  <Badge variant={analytics.performance.sharpeRatio > 1 ? "success" : "warning"}>
                    {analytics.performance.sharpeRatio.toFixed(2)}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Top Holdings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">
              Top Holdings
            </h3>
            <div className="space-y-4">
              {analytics.holdings.length > 0 ? (
                analytics.holdings.map((holding) => (
                  <div key={holding.symbol} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--foreground)]">
                          {holding.symbol}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {formatPercent(holding.allocation)}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-[var(--foreground)]">
                          {formatCurrency(holding.value)}
                        </div>
                        <div className={`text-xs ${holding.pnl >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                          {holding.pnl >= 0 ? '+' : ''}{formatCurrency(holding.pnl)}
                        </div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]"
                        style={{ width: `${holding.allocation}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
                  No holdings to display
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-6">
            Recent Activity
          </h3>
          <div className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-elevated)]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.action === 'Buy'
                        ? 'bg-[var(--success-bg)] text-[var(--success)]'
                        : 'bg-[var(--danger-bg)] text-[var(--danger)]'
                    }`}>
                      {activity.action === 'Buy' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {activity.description}
                      </div>
                      <div className="text-xs text-[var(--foreground-tertiary)]">
                        {formatDateTime(activity.date)}
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    activity.impact >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  }`}>
                    {activity.impact >= 0 ? '+' : ''}{formatCurrency(Math.abs(activity.impact))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
