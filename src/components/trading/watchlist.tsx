/**
 * Watchlist Component
 * Manage and display user's watchlist symbols with real-time prices
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  Loader2,
} from 'lucide-react';

interface WatchlistProps {
  onSymbolClick?: (symbol: string) => void;
  className?: string;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  added_at: string;
  price?: number;
  change?: number;
  changePercent?: number;
}

export function Watchlist({ onSymbolClick, className }: WatchlistProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSymbol, setAddingSymbol] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Fetch watchlist
  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      const result = await response.json();

      if (result.success) {
        setWatchlist(result.data);

        // Fetch quotes for all symbols
        if (result.data.length > 0) {
          const symbols = result.data.map((item: WatchlistItem) => item.symbol).join(',');
          fetchQuotes(symbols);
        }
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time quotes
  const fetchQuotes = async (symbols: string) => {
    try {
      const response = await fetch(`/api/quotes?symbols=${encodeURIComponent(symbols)}`);
      const result = await response.json();

      if (result.success) {
        // Update watchlist with quote data
        setWatchlist((prev) =>
          prev.map((item) => {
            const quote = result.data[item.symbol];
            if (quote) {
              return {
                ...item,
                price: quote.price,
                change: quote.change,
                changePercent: quote.changePercent,
              };
            }
            return item;
          })
        );
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    }
  };

  // Search symbols
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/search-symbols?query=${encodeURIComponent(query)}`);
      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Failed to search symbols:', error);
    } finally {
      setSearching(false);
    }
  };

  // Add symbol to watchlist
  const addSymbol = async (symbol: string, exchange?: string) => {
    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, exchange }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh watchlist
        fetchWatchlist();
        setSearchQuery('');
        setSearchResults([]);
        setAddingSymbol(false);
      } else {
        alert(result.error || 'Failed to add symbol');
      }
    } catch (error) {
      console.error('Failed to add symbol:', error);
      alert('Failed to add symbol');
    }
  };

  // Remove symbol from watchlist
  const removeSymbol = async (symbol: string) => {
    try {
      const response = await fetch(`/api/watchlist/${encodeURIComponent(symbol)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
      } else {
        alert(result.error || 'Failed to remove symbol');
      }
    } catch (error) {
      console.error('Failed to remove symbol:', error);
      alert('Failed to remove symbol');
    }
  };

  // Initial load
  useEffect(() => {
    fetchWatchlist();
  }, []);

  // Refresh quotes every 30 seconds
  useEffect(() => {
    if (watchlist.length === 0) return;

    const interval = setInterval(() => {
      const symbols = watchlist.map((item) => item.symbol).join(',');
      fetchQuotes(symbols);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [watchlist]);

  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-xl font-bold text-[var(--foreground)]">Watchlist</h3>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddingSymbol(!addingSymbol)}
          className="gap-2"
        >
          {addingSymbol ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {addingSymbol ? 'Cancel' : 'Add'}
        </Button>
      </div>

      {/* Add Symbol Form */}
      {addingSymbol && (
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
            <Input
              placeholder="Search symbols (e.g., AAPL, Tesla)"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--primary)]" />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
              {searchResults.map((result) => (
                <button
                  key={result.fullSymbol}
                  onClick={() => addSymbol(result.symbol, result.exchange)}
                  className="w-full px-4 py-3 text-left hover:bg-[var(--surface-hover)] transition-colors border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[var(--foreground)]">
                        {result.symbol}
                      </div>
                      <div className="text-xs text-[var(--foreground-muted)]">
                        {result.description}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.exchange}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Items */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
        </div>
      ) : watchlist.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No symbols in watchlist"
          description="Add symbols to track their real-time prices and quickly access charts."
          action={{
            label: 'Add Symbol',
            onClick: () => setAddingSymbol(true),
          }}
        />
      ) : (
        <div className="space-y-2">
          {watchlist.map((item) => {
            const ticker = item.symbol.split(':')[1] || item.symbol;
            const isPositive = (item.changePercent || 0) >= 0;

            return (
              <button
                key={item.id}
                onClick={() => onSymbolClick?.(item.symbol)}
                className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] hover:border-[var(--primary)] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="font-bold text-[var(--foreground)] text-lg">
                        {ticker}
                      </div>
                      {item.price && (
                        <div className="text-sm font-semibold text-[var(--foreground-muted)]">
                          ${item.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.changePercent !== undefined && (
                      <div
                        className={`flex items-center gap-1 ${
                          isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-semibold">
                          {isPositive ? '+' : ''}
                          {item.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSymbol(item.symbol);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--danger-bg)] rounded-lg"
                    >
                      <X className="w-4 h-4 text-[var(--danger)]" />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
