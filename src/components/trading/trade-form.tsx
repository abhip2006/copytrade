/**
 * Trade Execution Form - US-1.3 from PRD
 * Multi-step form for placing trades with order impact check
 */

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface TradeFormProps {
  initialSymbol?: string;
  onClose?: () => void;
  onSuccess?: () => void;
  onSymbolChange?: (symbol: string) => void;
}

type OrderType = 'Market' | 'Limit' | 'Stop' | 'StopLimit';
type TradeAction = 'BUY' | 'SELL';
type TimeInForce = 'Day' | 'GTC';
type AssetType = 'stock' | 'option';
type OptionType = 'CALL' | 'PUT';
type OptionAction = 'BUY_TO_OPEN' | 'SELL_TO_OPEN' | 'BUY_TO_CLOSE' | 'SELL_TO_CLOSE';

type FormStep = 'input' | 'review' | 'executing' | 'success' | 'error';

export function TradeForm({ initialSymbol, onClose, onSuccess, onSymbolChange }: TradeFormProps) {
  // Form state
  const [step, setStep] = useState<FormStep>('input');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [action, setAction] = useState<TradeAction>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('Market');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('Day');

  // Options-specific state
  const [optionType, setOptionType] = useState<OptionType>('CALL');
  const [optionAction, setOptionAction] = useState<OptionAction>('BUY_TO_OPEN');
  const [strikePrice, setStrikePrice] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [optionsChain, setOptionsChain] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Symbol search
  const [symbolQuery, setSymbolQuery] = useState(initialSymbol || '');
  const [selectedSymbol, setSelectedSymbol] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Notify parent when symbol changes
  const handleSymbolSelect = (symbol: any) => {
    setSelectedSymbol(symbol);
    setSearchResults([]);

    // Notify parent component to update chart
    if (onSymbolChange && symbol) {
      onSymbolChange(symbol.symbol);
    }

    // Fetch options chain if option trading
    if (assetType === 'option' && symbol) {
      fetchOptionsChain(symbol.symbol);
    }
  };

  // Trade parameters
  const [quantity, setQuantity] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // Order impact data
  const [tradeImpact, setTradeImpact] = useState<any>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null);

  // Search symbols
  const handleSearch = async (query: string) => {
    setSymbolQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/symbols/search?query=${encodeURIComponent(query)}`);
      const result = await response.json();

      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (err) {
      console.error('Symbol search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Fetch options chain
  const fetchOptionsChain = async (ticker: string) => {
    setLoadingOptions(true);
    try {
      const response = await fetch(`/api/options/chain?ticker=${encodeURIComponent(ticker)}`);
      const result = await response.json();

      if (result.success) {
        setOptionsChain(result.data);

        // Auto-select first available expiration and strike
        if (result.data.length > 0) {
          const firstOption = result.data[0];
          setExpirationDate(firstOption.expiration_date);
          setStrikePrice(firstOption.strike_price.toString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch options chain:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Check order impact
  const checkImpact = async () => {
    if (!selectedSymbol || !quantity) {
      setError('Please select a symbol and enter quantity');
      return;
    }

    // Validate options-specific fields
    if (assetType === 'option') {
      if (!strikePrice || !expirationDate) {
        setError('Please select strike price and expiration date');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const requestBody: any = assetType === 'stock' ? {
        asset_type: 'stock',
        action,
        universal_symbol_id: selectedSymbol.id,
        order_type: orderType,
        time_in_force: timeInForce,
        units: parseFloat(quantity),
        price: limitPrice ? parseFloat(limitPrice) : undefined,
        stop: stopPrice ? parseFloat(stopPrice) : undefined,
      } : {
        asset_type: 'option',
        option_action: optionAction,
        ticker: selectedSymbol.symbol,
        option_type: optionType,
        strike_price: parseFloat(strikePrice),
        expiration_date: expirationDate,
        order_type: orderType,
        time_in_force: timeInForce,
        quantity: parseFloat(quantity),
        price: limitPrice ? parseFloat(limitPrice) : undefined,
      };

      const response = await fetch('/api/trades/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check order impact');
      }

      setTradeImpact(result.data.tradeImpacts[0]);
      setTradeId(result.data.tradeId);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check order impact');
    } finally {
      setLoading(false);
    }
  };

  // Place order
  const placeOrder = async () => {
    if (!tradeId) {
      setError('Trade ID missing. Please start over.');
      return;
    }

    setStep('executing');
    setError(null);

    try {
      const response = await fetch('/api/trades/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
          takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute trade');
      }

      setOrderResult(result.data);
      setStep('success');

      // Call success callback after a delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute trade');
      setStep('error');
    }
  };

  // Reset form
  const reset = () => {
    setStep('input');
    setAssetType('stock');
    setAction('BUY');
    setOrderType('Market');
    setSelectedSymbol(null);
    setQuantity('');
    setLimitPrice('');
    setStopPrice('');
    setStopLoss('');
    setTakeProfit('');
    setOptionType('CALL');
    setOptionAction('BUY_TO_OPEN');
    setStrikePrice('');
    setExpirationDate('');
    setOptionsChain([]);
    setTradeImpact(null);
    setTradeId(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop - only covers the right side */}
      <div
        className="absolute inset-y-0 right-0 w-full lg:w-1/2 bg-black/30 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 xl:w-2/5 bg-[var(--surface)] shadow-2xl border-l border-[var(--border)] overflow-y-auto pointer-events-auto animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)] z-10">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            {step === 'input' && 'Place Trade'}
            {step === 'review' && 'Review Order'}
            {step === 'executing' && 'Executing Trade'}
            {step === 'success' && 'Trade Executed'}
            {step === 'error' && 'Trade Failed'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Input Form */}
          {step === 'input' && (
            <div className="space-y-6">
              {/* Asset Type Selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Asset Type
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAssetType('stock');
                      setOptionsChain([]);
                    }}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                      assetType === 'stock'
                        ? 'bg-[var(--primary)] text-white shadow-lg'
                        : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    Stock
                  </button>
                  <button
                    onClick={() => {
                      setAssetType('option');
                      if (selectedSymbol) {
                        fetchOptionsChain(selectedSymbol.symbol);
                      }
                    }}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                      assetType === 'option'
                        ? 'bg-[var(--primary)] text-white shadow-lg'
                        : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                    }`}
                  >
                    Option
                  </button>
                </div>
              </div>

              {/* Action Selector - Conditional based on asset type */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  {assetType === 'stock' ? 'Action' : 'Option Action'}
                </label>
                {assetType === 'stock' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAction('BUY')}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                        action === 'BUY'
                          ? 'bg-[var(--success)] text-white shadow-lg'
                          : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      onClick={() => setAction('SELL')}
                      className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                        action === 'SELL'
                          ? 'bg-[var(--danger)] text-white shadow-lg'
                          : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                ) : (
                  <select
                    value={optionAction}
                    onChange={(e) => setOptionAction(e.target.value as OptionAction)}
                    className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="BUY_TO_OPEN">Buy to Open (Long)</option>
                    <option value="SELL_TO_OPEN">Sell to Open (Short)</option>
                    <option value="BUY_TO_CLOSE">Buy to Close</option>
                    <option value="SELL_TO_CLOSE">Sell to Close</option>
                  </select>
                )}
              </div>

              {/* Symbol Search */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Symbol
                </label>
                {selectedSymbol ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <div className="flex-1">
                      <div className="font-bold text-[var(--foreground)]">
                        {selectedSymbol.symbol}
                      </div>
                      <div className="text-sm text-[var(--foreground-muted)]">
                        {selectedSymbol.description}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSymbol(null)}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-subtle)]" />
                      <Input
                        placeholder="Search symbols (e.g., AAPL, TSLA)"
                        value={symbolQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--primary)]" />
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleSymbolSelect(result)}
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
                              <Badge variant="outline">{result.type}</Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Options-Specific Fields */}
              {assetType === 'option' && selectedSymbol && (
                <>
                  {/* Option Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                      Option Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setOptionType('CALL')}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                          optionType === 'CALL'
                            ? 'bg-[var(--success)] text-white shadow-lg'
                            : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        CALL
                      </button>
                      <button
                        onClick={() => setOptionType('PUT')}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                          optionType === 'PUT'
                            ? 'bg-[var(--danger)] text-white shadow-lg'
                            : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        PUT
                      </button>
                    </div>
                  </div>

                  {/* Strike Price */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                      Strike Price
                    </label>
                    {loadingOptions ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                        <span className="ml-2 text-sm text-[var(--foreground-muted)]">Loading options...</span>
                      </div>
                    ) : optionsChain.length > 0 ? (
                      <select
                        value={strikePrice}
                        onChange={(e) => setStrikePrice(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select strike price</option>
                        {Array.from(new Set(optionsChain.map(opt => opt.strike_price)))
                          .sort((a, b) => a - b)
                          .map((strike) => (
                            <option key={strike} value={strike}>
                              ${strike.toFixed(2)}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <Input
                        type="number"
                        placeholder="Enter strike price"
                        value={strikePrice}
                        onChange={(e) => setStrikePrice(e.target.value)}
                        min="0"
                        step="0.50"
                      />
                    )}
                  </div>

                  {/* Expiration Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                      Expiration Date
                    </label>
                    {loadingOptions ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                      </div>
                    ) : optionsChain.length > 0 ? (
                      <select
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      >
                        <option value="">Select expiration date</option>
                        {Array.from(new Set(optionsChain.map(opt => opt.expiration_date)))
                          .sort()
                          .map((date) => (
                            <option key={date} value={date}>
                              {new Date(date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <Input
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    )}
                  </div>
                </>
              )}

              {/* Order Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Order Type
                </label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as OrderType)}
                  className="w-full h-12 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="Market">Market</option>
                  <option value="Limit">Limit</option>
                  <option value="Stop">Stop</option>
                  <option value="StopLimit">Stop Limit</option>
                </select>
              </div>

              {/* Quantity */}
              <Input
                label="Quantity"
                type="number"
                placeholder="Enter number of shares"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="0"
                step="0.01"
              />

              {/* Conditional Price Inputs */}
              {(orderType === 'Limit' || orderType === 'StopLimit') && (
                <Input
                  label="Limit Price"
                  type="number"
                  placeholder="Enter limit price"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              )}

              {(orderType === 'Stop' || orderType === 'StopLimit') && (
                <Input
                  label="Stop Price"
                  type="number"
                  placeholder="Enter stop price"
                  value={stopPrice}
                  onChange={(e) => setStopPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              )}

              {/* Time in Force */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Time in Force
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTimeInForce('Day')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      timeInForce === 'Day'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setTimeInForce('GTC')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      timeInForce === 'GTC'
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)]'
                    }`}
                  >
                    Good Till Canceled
                  </button>
                </div>
              </div>

              {/* Optional Risk Management */}
              <details className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4">
                <summary className="cursor-pointer font-semibold text-[var(--foreground)] select-none">
                  Risk Management (Optional)
                </summary>
                <div className="mt-4 space-y-4">
                  <Input
                    label="Stop Loss Price"
                    type="number"
                    placeholder="Automatic sell if price drops to..."
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <Input
                    label="Take Profit Price"
                    type="number"
                    placeholder="Automatic sell if price reaches..."
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </details>

              {error && (
                <div className="p-4 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger)] flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[var(--danger)]">{error}</div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={checkImpact}
                  disabled={!selectedSymbol || !quantity || loading}
                  loading={loading}
                  className="flex-1"
                >
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review Order */}
          {step === 'review' && tradeImpact && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Action</span>
                    <Badge variant={action === 'BUY' ? 'success' : 'danger'}>
                      {action}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Symbol</span>
                    <span className="font-semibold">{selectedSymbol?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Quantity</span>
                    <span className="font-semibold">{quantity} shares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Order Type</span>
                    <span className="font-semibold">{orderType}</span>
                  </div>
                  {limitPrice && (
                    <div className="flex justify-between">
                      <span className="text-[var(--foreground-muted)]">Limit Price</span>
                      <span className="font-semibold">{formatCurrency(parseFloat(limitPrice))}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Impact Analysis */}
              <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]">
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
                  Impact Analysis
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Estimated Cost</span>
                    <span className="font-semibold">
                      {formatCurrency(Math.abs(tradeImpact.remaining_cash - (tradeImpact.estimated_commissions || 0)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Est. Commissions</span>
                    <span className="font-semibold">
                      {formatCurrency(tradeImpact.estimated_commissions || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Remaining Cash</span>
                    <span className={`font-semibold ${tradeImpact.remaining_cash < 0 ? 'text-[var(--danger)]' : ''}`}>
                      {formatCurrency(tradeImpact.remaining_cash)}
                    </span>
                  </div>
                </div>

                {tradeImpact.remaining_cash < 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger)]">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-[var(--danger)]">
                        Insufficient funds to execute this trade
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep('input')} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={placeOrder}
                  disabled={tradeImpact.remaining_cash < 0}
                  className="flex-1"
                >
                  Confirm & Execute
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Executing */}
          {step === 'executing' && (
            <div className="py-12 text-center">
              <Loader2 className="w-16 h-16 animate-spin text-[var(--primary)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Executing Trade...
              </h3>
              <p className="text-[var(--foreground-muted)]">
                Please wait while we process your order
              </p>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && orderResult && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--success-bg)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Trade Executed Successfully!
              </h3>
              <p className="text-[var(--foreground-muted)] mb-6">
                Your order has been placed with your broker
              </p>

              <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] text-left max-w-md mx-auto">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Order ID</span>
                    <span className="font-mono text-xs">{orderResult.orderId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Status</span>
                    <Badge variant="success">{orderResult.status}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--foreground-muted)]">Filled</span>
                    <span className="font-semibold">{orderResult.filledUnits} shares</span>
                  </div>
                  {orderResult.executedPrice && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--foreground-muted)]">Price</span>
                      <span className="font-semibold">{formatCurrency(orderResult.executedPrice)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="primary" onClick={onClose} className="mt-6">
                Done
              </Button>
            </div>
          )}

          {/* Step 5: Error */}
          {step === 'error' && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--danger-bg)] flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-[var(--danger)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Trade Failed
              </h3>
              <p className="text-[var(--danger)] mb-6">{error}</p>

              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button variant="primary" onClick={reset}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
