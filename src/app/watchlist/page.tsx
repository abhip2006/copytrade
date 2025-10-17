/**
 * Watchlist Page
 * Displays user's watched symbols with TradingView chart integration
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  Star,
  StarOff,
  ChevronRight,
} from 'lucide-react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  name?: string;
  exchange?: string;
  type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NASDAQ:AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  // Fetch watchlist on mount
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/watchlist');
      const result = await response.json();

      if (result.success) {
        setWatchlist(result.data);
        if (result.data.length > 0 && !selectedSymbol) {
          setSelectedSymbol(formatSymbolForTradingView(result.data[0].symbol));
        }
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSymbolForTradingView = (symbol: string) => {
    // If symbol already has exchange prefix, return as is
    if (symbol.includes(':')) return symbol;
    // Default to NASDAQ for US stocks
    return `NASDAQ:${symbol}`;
  };

  const addToWatchlist = async () => {
    if (!newSymbol.trim()) return;

    try {
      setAdding(true);
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newSymbol.toUpperCase(),
          exchange: 'NASDAQ',
          type: 'stock',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setWatchlist([result.data, ...watchlist]);
        setNewSymbol('');
        setSelectedSymbol(formatSymbolForTradingView(result.data.symbol));
      } else {
        alert(result.error || 'Failed to add symbol');
      }
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add symbol to watchlist');
    } finally {
      setAdding(false);
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const response = await fetch(`/api/watchlist?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setWatchlist(watchlist.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  };

  const filteredWatchlist = watchlist.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Watchlist</h1>
              <p className="text-sm text-[var(--foreground-muted)]">
                Track your favorite symbols with real-time charts
              </p>
            </div>
            <Button variant="ghost" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Watchlist Sidebar */}
          <div className="lg:col-span-3">
            <Card className="p-4">
              {/* Add Symbol Form */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2">Add Symbol</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter symbol..."
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addToWatchlist();
                    }}
                    disabled={adding}
                  />
                  <Button
                    onClick={addToWatchlist}
                    disabled={adding || !newSymbol.trim()}
                    size="sm"
                  >
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                  <Input
                    placeholder="Search watchlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Watchlist Items */}
              <div className="space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                  </div>
                ) : filteredWatchlist.length === 0 ? (
                  <div className="text-center py-8 text-[var(--foreground-muted)]">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No symbols in watchlist</p>
                    <p className="text-xs mt-1">Add symbols above to get started</p>
                  </div>
                ) : (
                  filteredWatchlist.map((item) => (
                    <div
                      key={item.id}
                      className={`group p-3 rounded-lg border transition-all cursor-pointer hover:border-[var(--primary)] ${
                        selectedSymbol === formatSymbolForTradingView(item.symbol)
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-[var(--border)]'
                      }`}
                      onClick={() => setSelectedSymbol(formatSymbolForTradingView(item.symbol))}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--foreground)]">
                              {item.symbol}
                            </span>
                            {item.exchange && (
                              <Badge variant="outline" className="text-xs">
                                {item.exchange}
                              </Badge>
                            )}
                          </div>
                          {item.name && (
                            <p className="text-xs text-[var(--foreground-muted)] mt-1">
                              {item.name}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromWatchlist(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Chart Area */}
          <div className="lg:col-span-9">
            <Card className="p-0 overflow-hidden">
              <div className="p-4 border-b border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)]">
                      {selectedSymbol}
                    </h2>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Real-time price chart powered by TradingView
                    </p>
                  </div>
                </div>
              </div>

              {/* TradingView Chart */}
              <div className="h-[calc(100vh-280px)] min-h-[500px]">
                {selectedSymbol ? (
                  <AdvancedRealTimeChart
                    symbol={selectedSymbol}
                    theme="dark"
                    autosize={true}
                    interval="D"
                    timezone="America/New_York"
                    style="1"
                    locale="en"
                    toolbar_bg="#1a1a1a"
                    enable_publishing={false}
                    withdateranges={true}
                    range="12M"
                    hide_side_toolbar={false}
                    allow_symbol_change={true}
                    save_image={false}
                    studies={[
                      "STD;SMA",
                      "STD;Volume"
                    ]}
                    show_popup_button={true}
                    popup_width="1000"
                    popup_height="650"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[var(--foreground-muted)] opacity-50" />
                      <p className="text-[var(--foreground-muted)]">
                        Select a symbol from your watchlist to view the chart
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
