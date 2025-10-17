/**
 * Chart Data API Route
 * GET: Get historical chart data for a symbol
 */

import { NextRequest, NextResponse } from 'next/server';
import { getChartData, normalizeSymbol } from '@/lib/tradingview/client';

/**
 * GET /api/chart-data?symbol=AAPL&interval=D&range=100
 * Get chart data for a symbol
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const interval = searchParams.get('interval') || 'D';
    const range = parseInt(searchParams.get('range') || '100');

    if (!symbol) {
      return NextResponse.json(
        { error: 'symbol parameter is required' },
        { status: 400 }
      );
    }

    // Normalize symbol
    const normalizedSymbol = normalizeSymbol(symbol);

    const result = await getChartData(normalizedSymbol, interval, range);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chart data API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
