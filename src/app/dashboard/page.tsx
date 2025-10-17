/**
 * Follower Dashboard - Main dashboard for followers
 * Portfolio overview, active copy relationships, and recent trades
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { LeaderCard } from "@/components/ui/leader-card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Bell,
  Eye,
  Pause,
  Play,
  MoreVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Link2,
  AlertCircle,
  Star,
} from "lucide-react";
import { formatCurrency, formatPercent, formatDateTime } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

// Mock data - will be replaced with API calls
const PORTFOLIO_STATS = {
  totalValue: 127543.82,
  totalGain: 18432.45,
  totalGainPercent: 16.89,
  copiedTrades: 234,
  activeLeaders: 3,
};

// Portfolio value history - last 30 days
const PORTFOLIO_HISTORY = [
  { date: "Jan 1", value: 109111.37 },
  { date: "Jan 3", value: 110250.50 },
  { date: "Jan 5", value: 111180.25 },
  { date: "Jan 7", value: 110890.75 },
  { date: "Jan 9", value: 112400.50 },
  { date: "Jan 11", value: 113650.00 },
  { date: "Jan 13", value: 114200.25 },
  { date: "Jan 15", value: 115800.75 },
  { date: "Jan 17", value: 116950.50 },
  { date: "Jan 19", value: 118300.25 },
  { date: "Jan 21", value: 119850.00 },
  { date: "Jan 23", value: 121400.75 },
  { date: "Jan 25", value: 123100.50 },
  { date: "Jan 27", value: 124650.25 },
  { date: "Jan 29", value: 126200.00 },
  { date: "Jan 31", value: 127543.82 },
];

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const ACTIVE_LEADERS = [
  {
    id: "1",
    full_name: "Sarah Chen",
    bio: "Tech stocks specialist",
    is_verified: true,
    risk_level: "medium" as const,
    total_roi: 127.5,
    win_rate: 68.2,
    sharpe_ratio: 2.14,
    active_followers: 1247,
    has_performance_badge: true,
    copy_status: "active" as const,
    invested_amount: 25000,
    current_value: 28750,
    gain_percent: 15.0,
  },
  {
    id: "2",
    full_name: "Michael Rodriguez",
    bio: "Value investing specialist",
    is_verified: true,
    risk_level: "low" as const,
    total_roi: 89.3,
    win_rate: 74.5,
    sharpe_ratio: 2.89,
    active_followers: 2103,
    has_performance_badge: true,
    copy_status: "active" as const,
    invested_amount: 50000,
    current_value: 54200,
    gain_percent: 8.4,
  },
  {
    id: "3",
    full_name: "Alex Thompson",
    bio: "Momentum trading specialist",
    is_verified: true,
    risk_level: "high" as const,
    total_roi: 156.8,
    win_rate: 61.3,
    sharpe_ratio: 1.87,
    active_followers: 892,
    has_performance_badge: true,
    copy_status: "paused" as const,
    invested_amount: 15000,
    current_value: 16893,
    gain_percent: 12.62,
  },
];

const RECENT_TRADES = [
  {
    id: "1",
    leader_name: "Sarah Chen",
    symbol: "NVDA",
    action: "buy" as const,
    quantity: 25,
    price: 492.35,
    total: 12308.75,
    status: "completed" as const,
    executed_at: "2025-01-15T14:23:00Z",
  },
  {
    id: "2",
    leader_name: "Michael Rodriguez",
    symbol: "AAPL",
    action: "buy" as const,
    quantity: 50,
    price: 178.25,
    total: 8912.50,
    status: "completed" as const,
    executed_at: "2025-01-15T11:45:00Z",
  },
  {
    id: "3",
    leader_name: "Sarah Chen",
    symbol: "MSFT",
    action: "sell" as const,
    quantity: 15,
    price: 412.80,
    total: 6192.00,
    status: "completed" as const,
    executed_at: "2025-01-15T09:12:00Z",
  },
  {
    id: "4",
    leader_name: "Michael Rodriguez",
    symbol: "JNJ",
    action: "buy" as const,
    quantity: 100,
    price: 156.40,
    total: 15640.00,
    status: "completed" as const,
    executed_at: "2025-01-14T15:30:00Z",
  },
  {
    id: "5",
    leader_name: "Alex Thompson",
    symbol: "TSLA",
    action: "sell" as const,
    quantity: 20,
    price: 238.45,
    total: 4769.00,
    status: "failed" as const,
    executed_at: "2025-01-14T13:20:00Z",
  },
];

export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "leaders" | "trades">("overview");
  const [trades, setTrades] = useState<any[]>(RECENT_TRADES); // Initialize with mock data
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [hasConnectedBrokerage, setHasConnectedBrokerage] = useState<boolean | null>(null);
  const [connectingBrokerage, setConnectingBrokerage] = useState(false);

  // Check brokerage connection status
  useEffect(() => {
    const checkBrokerageConnection = async () => {
      try {
        const response = await fetch('/api/snaptrade/accounts');
        const result = await response.json();

        if (result.success) {
          setHasConnectedBrokerage(result.data.hasConnectedAccounts);
        }
      } catch (error) {
        console.error('Failed to check brokerage connection:', error);
      }
    };

    checkBrokerageConnection();
  }, []);

  // Fetch real trades data from API
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoadingTrades(true);
        const response = await fetch('/api/trades/history?days=30');
        const result = await response.json();

        if (result.success && result.data) {
          setTrades(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        // Keep using mock data on error
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchTrades();
  }, []);

  const handleConnectBrokerage = async () => {
    try {
      setConnectingBrokerage(true);
      const response = await fetch('/api/snaptrade/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          immediateRedirect: true,
          connectionType: 'trade',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Open connection portal in new window
        const width = 800;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        window.open(
          result.data.redirectUri,
          'SnapTrade Connection',
          `width=${width},height=${height},left=${left},top=${top}`
        );
      }
    } catch (error) {
      console.error('Failed to connect brokerage:', error);
    } finally {
      setConnectingBrokerage(false);
    }
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

            <div className="flex items-center gap-3">
              <Link href="/watchlist">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Watchlist</span>
                </Button>
              </Link>
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
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Track your portfolio and copy trading performance
            </p>
          </div>

          <Link href="/leaders">
            <Button variant="primary" className="gap-2">
              <Plus className="w-5 h-5" />
              Follow New Leader
            </Button>
          </Link>
        </div>

        {/* Connect Brokerage Banner - Only show if not connected */}
        {hasConnectedBrokerage === false && (
          <div className="mb-8 rounded-2xl border-2 border-dashed border-[var(--primary)] bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="rounded-full bg-[var(--primary)]/10 p-3">
                  <Link2 className="w-6 h-6 text-[var(--primary)]" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                  Connect Your Brokerage Account
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] mb-4">
                  Link your brokerage to start copying trades and unlocking all features. Your credentials are secure and encrypted.
                </p>
                <Button
                  onClick={handleConnectBrokerage}
                  disabled={connectingBrokerage}
                  className="gap-2"
                >
                  {connectingBrokerage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      Connect Now
                    </>
                  )}
                </Button>
              </div>
              <button
                onClick={() => setHasConnectedBrokerage(null)}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            label="Total Portfolio Value"
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
            label="Copied Trades"
            value={PORTFOLIO_STATS.copiedTrades}
            icon={Activity}
          />
          <StatCard
            label="Active Leaders"
            value={PORTFOLIO_STATS.activeLeaders}
            icon={Users}
          />
        </div>

        {/* Portfolio Value Chart */}
        <div className="mb-12">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
                Portfolio Performance
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Track your portfolio value over the last 30 days
              </p>
            </div>

            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart
                data={PORTFOLIO_HISTORY}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="rgb(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="rgb(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgb(var(--border))"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "rgb(var(--foreground-muted))", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fill: "rgb(var(--foreground-muted))", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        formatCurrency(value as number)
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="rgb(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#fillValue)"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-[var(--border)]">
          <button
            onClick={() => setSelectedTab("overview")}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              selectedTab === "overview"
                ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab("leaders")}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              selectedTab === "leaders"
                ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            My Leaders ({ACTIVE_LEADERS.length})
          </button>
          <button
            onClick={() => setSelectedTab("trades")}
            className={`px-6 py-3 text-sm font-semibold transition-all ${
              selectedTab === "trades"
                ? "text-[var(--primary)] border-b-2 border-[var(--primary)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Recent Trades
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === "overview" && (
          <div className="space-y-8">
            {/* Active Leaders Section */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
                Active Copy Relationships
              </h2>
              {ACTIVE_LEADERS.filter(l => l.copy_status === "active").length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ACTIVE_LEADERS.filter(l => l.copy_status === "active").map((leader) => (
                    <div key={leader.id} className="relative">
                      <LeaderCard leader={leader} />
                      <div className="mt-4 p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[var(--foreground-tertiary)]">Your Investment</span>
                          <span className="text-sm font-semibold text-[var(--foreground)]">
                            {formatCurrency(leader.invested_amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-[var(--foreground-tertiary)]">Current Value</span>
                          <span className="text-sm font-semibold text-[var(--success)]">
                            {formatCurrency(leader.current_value)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                          <span className="text-xs text-[var(--foreground-tertiary)]">Gain</span>
                          <div className="flex items-center gap-1 text-[var(--success)]">
                            <ArrowUpRight className="w-3 h-3" />
                            <span className="text-sm font-semibold">
                              {formatPercent(leader.gain_percent)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No active copy relationships"
                  description="Start following leaders to automatically copy their trades."
                  action={{
                    label: "Browse Leaders",
                    onClick: () => (window.location.href = "/leaders"),
                  }}
                />
              )}
            </div>

            {/* Recent Trades Preview */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[var(--foreground)]">
                  Recent Trades
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTab("trades")}
                >
                  View All
                </Button>
              </div>
              <TradesTable trades={trades.slice(0, 5)} />
            </div>
          </div>
        )}

        {selectedTab === "leaders" && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              All Copy Relationships
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ACTIVE_LEADERS.map((leader) => (
                <div key={leader.id} className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    {leader.copy_status === "active" ? (
                      <Badge variant="success" className="gap-1">
                        <Play className="w-3 h-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="gap-1">
                        <Pause className="w-3 h-3" />
                        Paused
                      </Badge>
                    )}
                  </div>
                  <LeaderCard leader={leader} />
                  <div className="mt-4 flex gap-2">
                    <Link href={`/leaders/${leader.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="flex-1 gap-2">
                      <Settings className="w-4 h-4" />
                      Settings
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === "trades" && (
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
              All Copied Trades
            </h2>
            <TradesTable trades={trades} />
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Trades Table Component with Sorting
function TradesTable({ trades }: { trades: typeof RECENT_TRADES }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<typeof RECENT_TRADES[0]>[]>(
    () => [
      {
        accessorKey: "symbol",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Symbol
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-semibold text-[var(--foreground)]">
            {row.original.symbol}
          </span>
        ),
      },
      {
        accessorKey: "leader_name",
        header: "Leader",
        cell: ({ row }) => (
          <span className="text-sm text-[var(--foreground-muted)]">
            {row.original.leader_name}
          </span>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        cell: ({ row }) =>
          row.original.action === "buy" ? (
            <Badge variant="success" className="gap-1">
              <ArrowUpRight className="w-3 h-3" />
              BUY
            </Badge>
          ) : (
            <Badge variant="danger" className="gap-1">
              <ArrowDownRight className="w-3 h-3" />
              SELL
            </Badge>
          ),
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Quantity
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.quantity}</span>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Price
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {formatCurrency(row.original.price)}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Total
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          if (row.original.status === "completed") {
            return <Badge variant="success">Completed</Badge>;
          } else if (row.original.status === "failed") {
            return <Badge variant="danger">Failed</Badge>;
          } else {
            return <Badge variant="warning">Pending</Badge>;
          }
        },
      },
      {
        accessorKey: "executed_at",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Time
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="w-3 h-3" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        },
        cell: ({ row }) => (
          <span className="text-xs text-[var(--foreground-tertiary)]">
            {formatDateTime(row.original.executed_at)}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: trades,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No trades found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-[var(--foreground-muted)]">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()} ({trades.length} total trades)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
