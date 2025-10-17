/**
 * Positions Table - Display open positions with real-time P&L
 * US-1.2: Active Positions Table from PRD
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
import { EmptyState } from '@/components/ui/empty-state';
import {
  TrendingUp,
  TrendingDown,
  X,
  Edit,
  MoreVertical,
  BarChart3,
} from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils';

interface Position {
  id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  current_value: number;
  unrealized_pnl: number;
  unrealized_pnl_percent: number;
  stop_loss?: number;
  take_profit?: number;
  opened_at: string;
}

export function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<keyof Position>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch positions
  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      const result = await response.json();

      if (result.success) {
        setPositions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPositions();
  }, []);

  // Refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchPositions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sort positions
  const sortedPositions = [...positions].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  // Calculate totals
  const totalValue = positions.reduce((sum, pos) => sum + pos.current_value, 0);
  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealized_pnl, 0);
  const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-12">
        <div className="flex items-center justify-center">
          <div className="text-[var(--foreground-muted)]">Loading positions...</div>
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No open positions"
        description="You don't have any open positions yet. Place a trade to get started."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
          <div className="text-xs text-[var(--foreground-subtle)] mb-1">
            Total Positions
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {positions.length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
          <div className="text-xs text-[var(--foreground-subtle)] mb-1">
            Total Value
          </div>
          <div className="text-2xl font-bold text-[var(--foreground)]">
            {formatCurrency(totalValue)}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
          <div className="text-xs text-[var(--foreground-subtle)] mb-1">
            Unrealized P&L
          </div>
          <div className={`text-2xl font-bold flex items-center gap-2 ${
            totalPnL >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}>
            {totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {formatCurrency(Math.abs(totalPnL))} ({formatPercent(totalPnLPercent)})
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Market Value</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
            <TableHead className="text-center">Risk Mgmt</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPositions.map((position) => {
            const isProfit = position.unrealized_pnl >= 0;

            return (
              <TableRow key={position.id}>
                <TableCell>
                  <div className="font-bold text-[var(--foreground)]">
                    {position.symbol}
                  </div>
                  <div className="text-xs text-[var(--foreground-subtle)]">
                    Opened: {new Date(position.opened_at).toLocaleDateString()}
                  </div>
                </TableCell>

                <TableCell className="text-right font-mono">
                  {position.quantity.toLocaleString()}
                </TableCell>

                <TableCell className="text-right font-mono">
                  {formatCurrency(position.avg_cost)}
                </TableCell>

                <TableCell className="text-right font-mono font-semibold">
                  {formatCurrency(position.current_price)}
                </TableCell>

                <TableCell className="text-right font-semibold">
                  {formatCurrency(position.current_value)}
                </TableCell>

                <TableCell className="text-right">
                  <div className={`flex items-center justify-end gap-1 font-semibold ${
                    isProfit ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  }`}>
                    {isProfit ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {formatCurrency(Math.abs(position.unrealized_pnl))}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <Badge variant={isProfit ? 'success' : 'danger'}>
                    {isProfit ? '+' : ''}{formatPercent(position.unrealized_pnl_percent)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1 items-center">
                    {position.stop_loss && (
                      <div className="text-xs text-[var(--danger)]">
                        SL: {formatCurrency(position.stop_loss)}
                      </div>
                    )}
                    {position.take_profit && (
                      <div className="text-xs text-[var(--success)]">
                        TP: {formatCurrency(position.take_profit)}
                      </div>
                    )}
                    {!position.stop_loss && !position.take_profit && (
                      <div className="text-xs text-[var(--foreground-subtle)]">
                        None
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
