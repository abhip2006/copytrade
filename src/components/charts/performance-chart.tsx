"use client";

import { useState, useEffect, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Seeded random number generator for consistent results
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate realistic performance data with seeded randomness
function generatePerformanceData(days: number) {
  const data = [];
  const startAmount = 10000;

  // TradeOS user: ~45% gain over 90 days (~0.5% daily avg with volatility)
  // S&P 500: ~12% gain over 90 days (~0.13% daily avg with volatility)
  let tradeosValue = startAmount;
  let sp500Value = startAmount;

  const tradeosDaily = 0.005; // 0.5% average daily
  const sp500Daily = 0.0013; // 0.13% average daily

  for (let i = 0; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    // Add some realistic volatility using seeded random
    const tradeosVolatility = (seededRandom(i * 2) - 0.5) * 0.03; // ±1.5% daily volatility
    const sp500Volatility = (seededRandom(i * 2 + 1) - 0.5) * 0.02; // ±1% daily volatility

    tradeosValue *= (1 + tradeosDaily + tradeosVolatility);
    sp500Value *= (1 + sp500Daily + sp500Volatility);

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      fullDate: date.toISOString(),
      tradeosUser: Math.round(tradeosValue),
      sp500: Math.round(sp500Value),
    });
  }

  return data;
}

const chartData90d = generatePerformanceData(90);
const chartData30d = chartData90d.slice(-30);
const chartData7d = chartData90d.slice(-7);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PerformanceChart() {
  const [timeRange, setTimeRange] = useState("90d");

  const filteredData =
    timeRange === "90d"
      ? chartData90d
      : timeRange === "30d"
      ? chartData30d
      : chartData7d;

  // Calculate returns
  const startValue = filteredData[0];
  const endValue = filteredData[filteredData.length - 1];

  const tradeosReturn = ((endValue.tradeosUser - startValue.tradeosUser) / startValue.tradeosUser * 100).toFixed(1);
  const sp500Return = ((endValue.sp500 - startValue.sp500) / startValue.sp500 * 100).toFixed(1);
  const outperformance = (parseFloat(tradeosReturn) - parseFloat(sp500Return)).toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Performance Comparison</h3>
          <p className="text-sm text-gray-600 mt-1">TradeOS users vs S&P 500 benchmark</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange("7d")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "7d"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "30d"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange("90d")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === "90d"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="text-sm text-gray-600 mb-1">TradeOS Users</div>
          <div className="text-2xl font-bold text-blue-600">+{tradeosReturn}%</div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="text-sm text-gray-600 mb-1">S&P 500</div>
          <div className="text-2xl font-bold text-gray-700">+{sp500Return}%</div>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-sm text-gray-600 mb-1">Outperformance</div>
          <div className="text-2xl font-bold text-green-600">+{outperformance}%</div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTradeOS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSP500" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="line"
              formatter={(value) => (
                <span className="text-sm text-gray-700">
                  {value === "tradeosUser" ? "TradeOS User" : "S&P 500"}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="sp500"
              stroke="#9ca3af"
              strokeWidth={2}
              fill="url(#colorSP500)"
              name="S&P 500"
            />
            <Area
              type="monotone"
              dataKey="tradeosUser"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#colorTradeOS)"
              name="TradeOS User"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
