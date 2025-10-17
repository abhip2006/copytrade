/**
 * TradingView API Client
 * Wrapper around @mathieuc/tradingview for real-time price data and chart info
 */

import { Client as TradingViewClient } from '@mathieuc/tradingview';

// Singleton client instance
let clientInstance: TradingViewClient | null = null;

/**
 * Get or create TradingView client instance
 */
export function getTradingViewClient(): TradingViewClient {
  if (!clientInstance) {
    clientInstance = new TradingViewClient();
  }
  return clientInstance;
}

/**
 * Get real-time quote for a symbol
 * @param symbol - Symbol in format "EXCHANGE:TICKER" (e.g., "NASDAQ:AAPL")
 */
export async function getQuote(symbol: string) {
  try {
    const client = getTradingViewClient();
    const quote = await client.getQuote(symbol);

    return {
      success: true,
      data: {
        symbol: quote.symbol,
        exchange: quote.exchange,
        description: quote.description,
        type: quote.type,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        high: quote.high,
        low: quote.low,
        open: quote.open,
        previousClose: quote.previousClose,
        timestamp: quote.timestamp,
      },
    };
  } catch (error) {
    console.error('TradingView getQuote failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quote',
    };
  }
}

/**
 * Get multiple quotes at once
 * @param symbols - Array of symbols in format "EXCHANGE:TICKER"
 */
export async function getBulkQuotes(symbols: string[]) {
  try {
    const results = await Promise.allSettled(
      symbols.map((symbol) => getQuote(symbol))
    );

    const quotes: Record<string, any> = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        quotes[symbols[index]] = result.value.data;
      }
    });

    return {
      success: true,
      data: quotes,
    };
  } catch (error) {
    console.error('TradingView getBulkQuotes failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quotes',
    };
  }
}

/**
 * Search for symbols
 * @param query - Search query (e.g., "AAPL", "Apple")
 * @param exchange - Optional exchange filter (e.g., "NASDAQ")
 */
export async function searchSymbols(query: string, exchange?: string) {
  try {
    const client = getTradingViewClient();
    const results = await client.searchSymbol(query, exchange);

    return {
      success: true,
      data: results.map((result: any) => ({
        symbol: result.symbol,
        fullSymbol: result.full_name,
        description: result.description,
        exchange: result.exchange,
        type: result.type,
      })),
    };
  } catch (error) {
    console.error('TradingView searchSymbols failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search symbols',
    };
  }
}

/**
 * Get historical chart data
 * @param symbol - Symbol in format "EXCHANGE:TICKER"
 * @param interval - Time interval (1, 5, 15, 30, 60, 240, D, W, M)
 * @param range - Number of bars to fetch
 */
export async function getChartData(
  symbol: string,
  interval: string = 'D',
  range: number = 100
) {
  try {
    const client = getTradingViewClient();
    const chart = await client.getChart({
      symbol,
      interval,
      range,
    });

    return {
      success: true,
      data: {
        symbol: chart.symbol,
        interval: chart.interval,
        bars: chart.periods.map((period: any) => ({
          time: period.time,
          open: period.open,
          high: period.high,
          low: period.low,
          close: period.close,
          volume: period.volume,
        })),
      },
    };
  } catch (error) {
    console.error('TradingView getChartData failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chart data',
    };
  }
}

/**
 * Get technical indicators for a symbol
 * @param symbol - Symbol in format "EXCHANGE:TICKER"
 * @param indicators - Array of indicator names (e.g., ['RSI', 'MACD', 'EMA'])
 */
export async function getIndicators(symbol: string, indicators: string[]) {
  try {
    const client = getTradingViewClient();
    const result = await client.getIndicators(symbol, indicators);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('TradingView getIndicators failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch indicators',
    };
  }
}

/**
 * Subscribe to real-time price updates
 * @param symbol - Symbol in format "EXCHANGE:TICKER"
 * @param callback - Function called on price updates
 */
export function subscribeToQuote(
  symbol: string,
  callback: (quote: any) => void
) {
  try {
    const client = getTradingViewClient();

    // Create a price subscription
    const subscription = client.subscribeQuote(symbol, (quote: any) => {
      callback({
        symbol: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        timestamp: Date.now(),
      });
    });

    // Return unsubscribe function
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  } catch (error) {
    console.error('TradingView subscribeToQuote failed:', error);
    return () => {}; // Return no-op function
  }
}

/**
 * Normalize symbol format (handle both "AAPL" and "NASDAQ:AAPL")
 * @param symbol - Symbol in any format
 * @param defaultExchange - Default exchange if not specified (default: NASDAQ)
 */
export function normalizeSymbol(symbol: string, defaultExchange: string = 'NASDAQ'): string {
  // If symbol already has exchange prefix, return as-is
  if (symbol.includes(':')) {
    return symbol;
  }

  // Otherwise, add default exchange
  return `${defaultExchange}:${symbol.toUpperCase()}`;
}

/**
 * Extract ticker from full symbol (e.g., "NASDAQ:AAPL" -> "AAPL")
 */
export function extractTicker(fullSymbol: string): string {
  const parts = fullSymbol.split(':');
  return parts.length > 1 ? parts[1] : fullSymbol;
}

export type Quote = {
  symbol: string;
  exchange: string;
  description: string;
  type: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
};

export type ChartBar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SymbolSearchResult = {
  symbol: string;
  fullSymbol: string;
  description: string;
  exchange: string;
  type: string;
};
