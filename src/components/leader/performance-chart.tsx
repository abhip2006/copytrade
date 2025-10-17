/**
 * Performance Chart Component - Displays leader's performance over time
 * Implements missing P1 component from implementation status
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface PerformanceData {
  date: string;
  value: number;
  return: number;
}

interface PerformanceChartProps {
  data?: PerformanceData[];
  totalReturn: number;
  winRate: number;
  sharpeRatio: number;
}

export function PerformanceChart({
  data = [],
  totalReturn,
  winRate,
  sharpeRatio,
}: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');

  // Generate mock data if none provided
  const chartData = data.length > 0 ? data : generateMockData(timeframe);

  // Calculate chart dimensions
  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const range = maxValue - minValue;

  // Generate SVG path
  const generatePath = () => {
    const width = 100;
    const height = 60;
    const padding = 5;

    const points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Performance Chart
        </h3>
        <div className="flex gap-2">
          {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                timeframe === tf
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface)]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
          <div className="text-xs text-[var(--foreground-muted)] mb-1">Total Return</div>
          <div className={`text-lg font-semibold flex items-center gap-2 ${
            totalReturn >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
          }`}>
            {totalReturn >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatPercent(Math.abs(totalReturn))}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
          <div className="text-xs text-[var(--foreground-muted)] mb-1">Win Rate</div>
          <div className="text-lg font-semibold text-[var(--foreground)]">
            {formatPercent(winRate)}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
          <div className="text-xs text-[var(--foreground-muted)] mb-1">Sharpe Ratio</div>
          <div className="text-lg font-semibold text-[var(--foreground)]">
            {sharpeRatio.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart SVG */}
      <div className="relative w-full h-64 rounded-lg bg-[var(--surface-elevated)] p-4">
        <svg
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y * 0.6}
              x2="100"
              y2={y * 0.6}
              stroke="var(--border)"
              strokeWidth="0.1"
              opacity="0.3"
            />
          ))}

          {/* Area gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill area */}
          <path
            d={`${generatePath()} L 95,55 L 5,55 Z`}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-[var(--foreground-muted)] pr-2">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency((maxValue + minValue) / 2)}</span>
          <span>{formatCurrency(minValue)}</span>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-[var(--foreground-muted)] px-4 pb-2">
          <span>{chartData[0]?.date}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.date}</span>
          <span>{chartData[chartData.length - 1]?.date}</span>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 p-4 rounded-lg bg-[var(--surface-elevated)]">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Starting Value</span>
            <span className="font-semibold text-[var(--foreground)]">
              {formatCurrency(chartData[0]?.value || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Current Value</span>
            <span className="font-semibold text-[var(--foreground)]">
              {formatCurrency(chartData[chartData.length - 1]?.value || 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Best Day</span>
            <span className="font-semibold text-[var(--success)]">
              +{formatPercent(Math.max(...chartData.map(d => d.return)))}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--foreground-muted)]">Worst Day</span>
            <span className="font-semibold text-[var(--danger)]">
              {formatPercent(Math.min(...chartData.map(d => d.return)))}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper function to generate mock performance data
function generateMockData(timeframe: string): PerformanceData[] {
  const days = timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : 730;
  const data: PerformanceData[] = [];
  let value = 100000;

  for (let i = 0; i < days; i++) {
    const dailyReturn = (Math.random() - 0.45) * 2; // Slightly positive bias
    value *= (1 + dailyReturn / 100);

    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value * 100) / 100,
      return: dailyReturn,
    });
  }

  return data;
}
