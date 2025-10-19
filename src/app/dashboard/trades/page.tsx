/**
 * Trade History Page - Complete trade history with advanced filtering
 * Implements missing P1 feature from implementation status
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TradeHistory } from "@/components/trading/trade-history";
import { StatCard } from "@/components/ui/stat-card";
import {
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  Filter,
  RefreshCw,
  Bell,
  Settings,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

interface TradeStats {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalVolume: number;
  winRate: number;
  avgTradeSize: number;
}

export default function TradesPage() {
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTradeStats = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/trades/history?limit=1000');
      const result = await response.json();

      if (result.success && result.trades) {
        const trades = result.trades;
        const totalTrades = trades.length;
        const successfulTrades = trades.filter((t: any) => t.status === 'completed' || t.status === 'filled').length;
        const failedTrades = trades.filter((t: any) => t.status === 'failed' || t.status === 'rejected').length;
        const totalVolume = trades.reduce((sum: number, t: any) => sum + (t.quantity * t.price || 0), 0);
        const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
        const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;

        setStats({
          totalTrades,
          successfulTrades,
          failedTrades,
          totalVolume,
          winRate,
          avgTradeSize,
        });
      }
    } catch (error) {
      console.error('Failed to fetch trade stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTradeStats();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchTradeStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    // This would trigger CSV export from TradeHistory component
    // For now, just show a message
    alert('Export functionality will download your trade history as CSV');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--foreground-muted)]">Loading trade history...</p>
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
                onClick={fetchTradeStats}
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
              <span className="gradient-text">Trade History</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Complete history of all executed and copied trades
            </p>
          </div>

          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-5 h-5" />
            Export CSV
          </Button>
        </div>

        {/* Trade Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatCard
              label="Total Trades"
              value={stats.totalTrades}
              icon={Activity}
            />
            <StatCard
              label="Successful Trades"
              value={stats.successfulTrades}
              icon={CheckCircle}
              trend="up"
            />
            <StatCard
              label="Failed Trades"
              value={stats.failedTrades}
              icon={XCircle}
              trend={stats.failedTrades > 0 ? "down" : undefined}
            />
            <StatCard
              label="Avg Trade Size"
              value={formatCurrency(stats.avgTradeSize)}
              icon={TrendingUp}
            />
          </div>
        )}

        {/* Trade History Table */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">
                  All Trades
                </h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-1">
                  View and filter your complete trading history
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <TradeHistory />
          </div>
        </div>

        {/* Trade Insights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Trade Performance
            </h3>
            {stats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Win Rate</span>
                  <span className="text-sm font-semibold text-[var(--success)]">
                    {formatPercent(stats.winRate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Total Volume</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {formatCurrency(stats.totalVolume)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Avg Size</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {formatCurrency(stats.avgTradeSize)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Execution Status
            </h3>
            {stats && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Completed</span>
                  <span className="text-sm font-semibold text-[var(--success)]">
                    {stats.successfulTrades}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Failed</span>
                  <span className="text-sm font-semibold text-[var(--danger)]">
                    {stats.failedTrades}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--foreground-muted)]">Success Rate</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {stats.totalTrades > 0
                      ? formatPercent((stats.successfulTrades / stats.totalTrades) * 100)
                      : '-'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link href="/leader" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Activity className="w-4 h-4" />
                  Place New Trade
                </Button>
              </Link>
              <Link href="/dashboard/portfolio" className="block">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <TrendingUp className="w-4 h-4" />
                  View Portfolio
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
