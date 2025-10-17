/**
 * Trade History - Display past trades with filters
 * US-1.5: Transaction History from PRD
 */

"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Download,
  Filter,
  Search,
  Calendar,
  Activity,
  BarChart3,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { TradeAnalyticsModal } from './trade-analytics-modal';

interface Trade {
  id: string;
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  executed_price: number;
  total_value: number;
  fees: number;
  order_type: string;
  status: string;
  executed_at: string;
}

export function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<'all' | 'buy' | 'sell'>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const params = new URLSearchParams({
        days: dateRange === 'all' ? '365' : dateRange.replace('d', ''),
      });

      const response = await fetch(`/api/trades/history?${params}`);
      const result = await response.json();

      if (result.success) {
        setTrades(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch trade history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [dateRange]);

  // Filter trades
  const filteredTrades = trades.filter((trade) => {
    const matchesSearch = trade.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || trade.action === filterAction;

    return matchesSearch && matchesAction;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Symbol', 'Action', 'Quantity', 'Price', 'Total', 'Fees', 'Type', 'Status'];
    const rows = filteredTrades.map(trade => [
      formatDateTime(trade.executed_at),
      trade.symbol,
      trade.action.toUpperCase(),
      trade.quantity,
      trade.executed_price,
      trade.total_value,
      trade.fees,
      trade.order_type,
      trade.status,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12">
        <div className="flex items-center justify-center">
          <div className="text-[var(--foreground-muted)]">Loading trade history...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
            <Input
              placeholder="Search by symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Action Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterAction('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterAction === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterAction('buy')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterAction === 'buy'
                ? 'bg-[var(--success)] text-white'
                : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setFilterAction('sell')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterAction === 'sell'
                ? 'bg-[var(--danger)] text-white'
                : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Date Range */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>

        {/* Export */}
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-[var(--foreground-muted)]">
        Showing {filteredTrades.length} of {trades.length} trades
      </div>

      {/* Table */}
      {filteredTrades.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No trades found"
          description="Try adjusting your filters or date range."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Fees</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell>
                  <div className="text-sm">{formatDateTime(trade.executed_at)}</div>
                </TableCell>

                <TableCell>
                  <div className="font-bold text-[var(--foreground)]">
                    {trade.symbol}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant={trade.action === 'buy' ? 'success' : 'danger'}>
                    {trade.action.toUpperCase()}
                  </Badge>
                </TableCell>

                <TableCell className="text-right font-mono">
                  {trade.quantity.toLocaleString()}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {formatCurrency(trade.executed_price)}
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {formatCurrency(trade.total_value)}
                </TableCell>

                <TableCell className="text-right text-sm text-[var(--foreground-muted)]">
                  {formatCurrency(trade.fees)}
                </TableCell>

                <TableCell>
                  <span className="text-sm capitalize">{trade.order_type}</span>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      trade.status === 'executed'
                        ? 'success'
                        : trade.status === 'failed'
                        ? 'danger'
                        : 'default'
                    }
                  >
                    {trade.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      setSelectedTradeId(trade.id);
                      setAnalyticsModalOpen(true);
                    }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Analytics Modal */}
      <TradeAnalyticsModal
        orderId={selectedTradeId}
        open={analyticsModalOpen}
        onOpenChange={setAnalyticsModalOpen}
      />
    </div>
  );
}
