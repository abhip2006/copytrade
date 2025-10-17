/**
 * Symbol Search API Route
 * GET: Search for symbols
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchSymbols } from '@/lib/tradingview/client';

/**
 * GET /api/search-symbols?query=AAPL&exchange=NASDAQ
 * Search for symbols by query
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const exchange = searchParams.get('exchange') || undefined;

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    const result = await searchSymbols(query, exchange);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Symbol search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
