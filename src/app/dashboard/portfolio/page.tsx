/**
 * Portfolio Page - Detailed portfolio view with positions and performance
 * Implements missing P1 feature from implementation status
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { PositionsTable } from "@/components/trading/positions-table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TrendingUp,
  DollarSign,
  Activity,
  PieChart,
  Plus,
  ArrowLeft,
  RefreshCw,
  Download,
  Bell,
  Settings,
} from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

interface PortfolioStats {
  totalValue: number;
  cash: number;
  positionsValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  openPositions: number;
  connected: boolean;
}

export default function PortfolioPage() {
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPortfolioStats = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/portfolio/stats');
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioStats();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchPortfolioStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-[var(--foreground-muted)]">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!stats?.connected) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Header */}
        <div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12">
          <EmptyState
            icon={PieChart}
            title="No Portfolio Connected"
            description="Connect your brokerage account to view your portfolio."
            action={{
              label: "Connect Account",
              onClick: () => window.location.href = '/onboarding',
            }}
          />
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
                onClick={fetchPortfolioStats}
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
              <span className="gradient-text">Portfolio</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Real-time view of your investments and performance
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-5 h-5" />
              Export
            </Button>
            <Link href="/leader">
              <Button variant="default" className="gap-2">
                <Plus className="w-5 h-5" />
                New Trade
              </Button>
            </Link>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Total Portfolio Value"
            value={formatCurrency(stats.totalValue)}
            icon={DollarSign}
            trend={stats.dayChange >= 0 ? "up" : "down"}
            change={{
              value: Math.abs(stats.dayChangePercent),
              period: "today",
            }}
          />
          <StatCard
            label="Total P&L"
            value={formatCurrency(stats.totalPnL)}
            icon={TrendingUp}
            trend={stats.totalPnL >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Positions Value"
            value={formatCurrency(stats.positionsValue)}
            icon={PieChart}
          />
          <StatCard
            label="Available Cash"
            value={formatCurrency(stats.cash)}
            icon={Activity}
          />
        </div>

        {/* Portfolio Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Asset Allocation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Stocks</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {formatPercent((stats.positionsValue / stats.totalValue) * 100)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)]"
                    style={{ width: `${(stats.positionsValue / stats.totalValue) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--foreground-muted)]">Cash</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {formatPercent((stats.cash / stats.totalValue) * 100)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--secondary)]"
                    style={{ width: `${(stats.cash / stats.totalValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Performance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Today</span>
                <div className={`text-sm font-semibold ${stats.dayChange >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {stats.dayChange >= 0 ? '+' : ''}{formatCurrency(stats.dayChange)}
                  <span className="text-xs ml-1">
                    ({formatPercent(Math.abs(stats.dayChangePercent))})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">All Time</span>
                <div className={`text-sm font-semibold ${stats.totalPnL >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                  {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
                  <span className="text-xs ml-1">
                    ({formatPercent(Math.abs(stats.totalPnLPercent))})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Open Positions</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {stats.openPositions}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--foreground-muted)]">Avg Position Size</span>
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {stats.openPositions > 0
                    ? formatCurrency(stats.positionsValue / stats.openPositions)
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Positions Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              Open Positions
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Filter</Button>
              <Button variant="outline" size="sm">Sort</Button>
            </div>
          </div>
          <PositionsTable />
        </div>
      </div>
    </div>
  );
}
