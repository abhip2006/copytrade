/**
 * Leader Dashboard
 * Trading interface with TradingView chart and watchlist
 */

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { PriceChart } from '@/components/trading/price-chart';
import { Watchlist } from '@/components/trading/watchlist';
import { TradeForm } from '@/components/trading/trade-form';
import { PositionsTable } from '@/components/trading/positions-table';
import { TradeHistory } from '@/components/trading/trade-history';
import {
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Settings,
  Bell,
  BarChart3,
  Maximize2,
  Minimize2,
  Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

// Mock data - will be replaced with real data from API
const PORTFOLIO_STATS = {
  totalValue: 247832.45,
  totalGain: 45234.89,
  totalGainPercent: 22.35,
  activeFollowers: 1247,
  totalTrades: 342,
};

export default function LeaderDashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NASDAQ:AAPL');
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [activeView, setActiveView] = useState<'positions' | 'history'>('positions');
  const [splitScreenMode, setSplitScreenMode] = useState(false);

  const handleSymbolClick = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleTradeClick = () => {
    setShowTradeForm(true);
    setSplitScreenMode(true); // Enable split screen when opening trade form
  };

  const handleCloseTradeForm = () => {
    setShowTradeForm(false);
    // Keep split screen mode as-is when closing trade form
  };

  const handleTradeSuccess = () => {
    // Refresh positions/data
    console.log('Trade executed successfully');
  };

  const handleSymbolChange = (symbol: string) => {
    // Update chart when symbol is selected in trade form
    // Convert plain symbol to TradingView format if needed
    const tvSymbol = symbol.includes(':') ? symbol : `NASDAQ:${symbol}`;
    setSelectedSymbol(tvSymbol);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <TradeOSLogoCompact />
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/leader"
                className="text-sm font-semibold text-[var(--primary)]"
              >
                Trading
              </Link>
              <Link
                href="/leader/performance"
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Performance
              </Link>
              <Link
                href="/leader/followers"
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Followers
              </Link>
              <Link
                href="/leader/earnings"
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Earnings
              </Link>
              <Link
                href="/watchlist"
                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
              >
                <Star className="w-4 h-4" />
                Watchlist
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Link href="/leader/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Leader Dashboard</span>
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Trade and manage your portfolio. Your trades are automatically copied by your followers.
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            label="Portfolio Value"
            value={formatCurrency(PORTFOLIO_STATS.totalValue)}
            icon={DollarSign}
            trend="up"
            change={{
              value: PORTFOLIO_STATS.totalGainPercent,
              period: "all time",
            }}
          />
          <StatCard
            label="Total Gain"
            value={formatCurrency(PORTFOLIO_STATS.totalGain)}
            icon={TrendingUp}
            trend="up"
          />
          <StatCard
            label="Total Trades"
            value={PORTFOLIO_STATS.totalTrades}
            icon={Activity}
          />
          <StatCard
            label="Active Followers"
            value={PORTFOLIO_STATS.activeFollowers}
            icon={Users}
          />
        </div>

        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - Takes 2 columns, or full width in split screen mode */}
          <div className={splitScreenMode ? "lg:col-span-3" : "lg:col-span-2"}>
            {splitScreenMode ? (
              /* Split Screen Layout */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: TradingView Chart */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--foreground)]">Chart</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSplitScreenMode(false)}
                      className="gap-2"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <PriceChart
                    symbol={selectedSymbol}
                    onTrade={handleTradeClick}
                  />
                </div>

                {/* Right: Positions or Trade History */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                  <div className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        {activeView === 'positions' ? 'Open Positions' : 'Trade History'}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={activeView === 'positions' ? 'primary' : 'outline'}
                        onClick={() => setActiveView('positions')}
                        size="sm"
                        className="gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Positions
                      </Button>
                      <Button
                        variant={activeView === 'history' ? 'primary' : 'outline'}
                        onClick={() => setActiveView('history')}
                        size="sm"
                        className="gap-2"
                      >
                        <Activity className="w-4 h-4" />
                        History
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 max-h-[600px] overflow-y-auto">
                    {activeView === 'positions' ? <PositionsTable /> : <TradeHistory />}
                  </div>
                </div>
              </div>
            ) : (
              /* Normal Layout */
              <>
                <PriceChart
                  symbol={selectedSymbol}
                  onTrade={handleTradeClick}
                />

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <Button
                    variant={activeView === 'positions' ? 'primary' : 'outline'}
                    onClick={() => setActiveView('positions')}
                    className="gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
                    View Positions
                  </Button>
                  <Button
                    variant={activeView === 'history' ? 'primary' : 'outline'}
                    onClick={() => setActiveView('history')}
                    className="gap-2"
                  >
                    <Activity className="w-5 h-5" />
                    Trade History
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSplitScreenMode(true)}
                    className="gap-2"
                  >
                    <Maximize2 className="w-5 h-5" />
                    Split Screen
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Watchlist - Takes 1 column, hidden in split screen mode */}
          {!splitScreenMode && (
            <div>
              <Watchlist onSymbolClick={handleSymbolClick} />
            </div>
          )}
        </div>

        {/* Positions or Trade History (only shown in normal mode) */}
        {!splitScreenMode && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              {activeView === 'positions' ? 'Open Positions' : 'Trade History'}
            </h2>
            {activeView === 'positions' ? <PositionsTable /> : <TradeHistory />}
          </div>
        )}

        {/* Performance Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-2">
              Win Rate
            </h3>
            <div className="text-3xl font-bold text-[var(--success)]">68.2%</div>
            <p className="text-xs text-[var(--foreground-tertiary)] mt-1">
              234 winning trades out of 343 total
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-2">
              Avg Trade Duration
            </h3>
            <div className="text-3xl font-bold text-[var(--foreground)]">4.2 days</div>
            <p className="text-xs text-[var(--foreground-tertiary)] mt-1">
              Swing trading strategy
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-2">
              Sharpe Ratio
            </h3>
            <div className="text-3xl font-bold text-[var(--foreground)]">2.14</div>
            <p className="text-xs text-[var(--foreground-tertiary)] mt-1">
              Above industry average
            </p>
          </div>
        </div>
      </div>

      {/* Trade Form Modal */}
      {showTradeForm && (
        <TradeForm
          initialSymbol={selectedSymbol}
          onClose={handleCloseTradeForm}
          onSuccess={handleTradeSuccess}
          onSymbolChange={handleSymbolChange}
        />
      )}
    </div>
  );
}
