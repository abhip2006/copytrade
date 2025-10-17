/**
 * Price Chart Component
 * Real-time price chart using TradingView data
 */

"use client";

import { useEffect, useState, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChartProps {
  symbol: string;
  onTrade?: () => void;
  className?: string;
}

type Timeframe = '1' | '5' | '15' | '60' | '240' | 'D';

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1': '1m',
  '5': '5m',
  '15': '15m',
  '60': '1h',
  '240': '4h',
  'D': '1D',
};

export function PriceChart({ symbol, onTrade, className }: PriceChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('D');
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chart data
  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chart data from backend
      const response = await fetch(`/api/chart-data?symbol=${encodeURIComponent(symbol)}&interval=${timeframe}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch chart data');
      }

      // Format data for recharts
      const formattedData = result.data.bars.map((bar: any) => ({
        time: new Date(bar.time * 1000).toLocaleTimeString(),
        price: bar.close,
        high: bar.high,
        low: bar.low,
        open: bar.open,
        volume: bar.volume,
      }));

      setChartData(formattedData);

      // Calculate price change
      if (formattedData.length > 1) {
        const latestPrice = formattedData[formattedData.length - 1].price;
        const firstPrice = formattedData[0].price;
        const change = latestPrice - firstPrice;
        const changePercent = (change / firstPrice) * 100;

        setCurrentPrice(latestPrice);
        setPriceChange(change);
        setPriceChangePercent(changePercent);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load chart');
      setLoading(false);
    }
  };

  // Fetch real-time quote
  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbol)}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCurrentPrice(result.data.price);
        setPriceChange(result.data.change);
        setPriceChangePercent(result.data.changePercent);
      }
    } catch (err) {
      console.error('Failed to fetch quote:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchChartData();
  }, [symbol, timeframe]);

  // Real-time updates every 30 seconds
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch quote immediately
    fetchQuote();

    // Set up polling
    intervalRef.current = setInterval(fetchQuote, 30000); // 30 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol]);

  // Determine trend
  const trend = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : 'neutral';
  const trendColor = trend === 'up' ? 'text-[var(--success)]' : trend === 'down' ? 'text-[var(--danger)]' : 'text-[var(--foreground-muted)]';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">
            {symbol.split(':')[1] || symbol}
          </h3>
          {currentPrice !== null && (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-[var(--foreground)]">
                ${currentPrice.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-5 h-5" />
                <span className="text-lg font-semibold">
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                </span>
                <span className="text-sm">
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {onTrade && (
          <Button variant="primary" onClick={onTrade} className="gap-2">
            Trade {symbol.split(':')[1] || symbol}
          </Button>
        )}
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2 mb-6">
        {(Object.keys(TIMEFRAME_LABELS) as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              timeframe === tf
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            {TIMEFRAME_LABELS[tf]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[400px] w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-[var(--foreground-muted)]">Loading chart...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-[var(--danger)]">{error}</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={trend === 'up' ? 'var(--success)' : 'var(--danger)'}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={trend === 'up' ? 'var(--success)' : 'var(--danger)'}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="time"
                stroke="var(--foreground-subtle)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                stroke="var(--foreground-subtle)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                }}
                formatter={(value: any) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={trend === 'up' ? 'var(--success)' : 'var(--danger)'}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Stats */}
      {chartData.length > 0 && (
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-[var(--foreground-subtle)] mb-1">Open</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              ${chartData[0]?.open?.toFixed(2) || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--foreground-subtle)] mb-1">High</div>
            <div className="text-sm font-semibold text-[var(--success)]">
              ${Math.max(...chartData.map((d) => d.high)).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--foreground-subtle)] mb-1">Low</div>
            <div className="text-sm font-semibold text-[var(--danger)]">
              ${Math.min(...chartData.map((d) => d.low)).toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--foreground-subtle)] mb-1">Volume</div>
            <div className="text-sm font-semibold text-[var(--foreground)]">
              {(chartData[chartData.length - 1]?.volume / 1000000).toFixed(2)}M
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
