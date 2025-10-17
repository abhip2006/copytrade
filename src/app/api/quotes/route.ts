/**
 * Quotes API Route
 * GET: Get real-time quotes for symbols
 */

import { NextRequest, NextResponse } from 'next/server';
import { getQuote, getBulkQuotes, normalizeSymbol } from '@/lib/tradingview/client';

/**
 * GET /api/quotes?symbols=AAPL,TSLA,MSFT
 * Get real-time quotes for one or more symbols
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'symbols parameter is required' },
        { status: 400 }
      );
    }

    // Split symbols and normalize them
    const symbols = symbolsParam.split(',').map((s) => normalizeSymbol(s.trim()));

    // If single symbol, use getQuote, otherwise use getBulkQuotes
    if (symbols.length === 1) {
      const result = await getQuote(symbols[0]);
      return NextResponse.json(result);
    } else {
      const result = await getBulkQuotes(symbols);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Quotes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
