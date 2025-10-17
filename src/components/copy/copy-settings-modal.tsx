/**
 * Copy Settings Modal
 * Allows followers to configure how they want to copy a leader's trades
 */

'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, DollarSign, Shield, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CopySettingsModalProps {
  leaderId: string;
  leaderName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingSettings?: CopySettings | null;
}

interface CopySettings {
  allocation_type: 'fixed_amount' | 'percentage' | 'proportional' | 'multiplier';
  allocation_value: number;
  max_position_size?: number;
  stop_copying_on_loss?: number;
  copy_stop_loss: boolean;
  copy_take_profit: boolean;
  custom_stop_loss?: number;
  custom_take_profit?: number;
  asset_classes: string[];
  max_risk_per_trade?: number;
  trailing_stop?: boolean;
}

const ALLOCATION_TYPES = [
  {
    id: 'fixed_amount',
    name: 'Fixed Amount',
    description: 'Copy each trade with a fixed dollar amount',
    example: '$100 per trade',
    icon: DollarSign,
  },
  {
    id: 'percentage',
    name: 'Portfolio Percentage',
    description: 'Use a percentage of your portfolio for each trade',
    example: '5% of your portfolio',
    icon: TrendingUp,
  },
  {
    id: 'proportional',
    name: 'Proportional',
    description: 'Match the leader\'s position size relative to their portfolio',
    example: 'If leader uses 10% of their portfolio, you use 10%',
    icon: Shield,
  },
  {
    id: 'multiplier',
    name: 'Multiplier',
    description: 'Multiply the leader\'s trade size by a factor',
    example: '0.5x = half the leader\'s position',
    icon: TrendingUp,
  },
];

const ASSET_CLASSES = [
  { id: 'stocks', name: 'Stocks', description: 'Individual company stocks' },
  { id: 'etf', name: 'ETFs', description: 'Exchange-traded funds' },
  { id: 'options', name: 'Options', description: 'Options contracts' },
  { id: 'crypto', name: 'Crypto', description: 'Cryptocurrencies' },
];

export function CopySettingsModal({
  leaderId,
  leaderName,
  isOpen,
  onClose,
  onSuccess,
  existingSettings,
}: CopySettingsModalProps) {
  const [step, setStep] = useState<'allocation' | 'risk' | 'assets' | 'review' | 'processing'>('allocation');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [allocationType, setAllocationType] = useState<CopySettings['allocation_type']>('fixed_amount');
  const [allocationValue, setAllocationValue] = useState<number>(100);
  const [maxPositionSize, setMaxPositionSize] = useState<number>(1000);
  const [stopLossPercent, setStopLossPercent] = useState<number | null>(null);
  const [copyStopLoss, setCopyStopLoss] = useState(true);
  const [copyTakeProfit, setCopyTakeProfit] = useState(true);
  const [customStopLoss, setCustomStopLoss] = useState<number | null>(null);
  const [customTakeProfit, setCustomTakeProfit] = useState<number | null>(null);
  const [selectedAssetClasses, setSelectedAssetClasses] = useState<string[]>(['stocks', 'etf']);
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState<number>(10);
  const [trailingStop, setTrailingStop] = useState(false);

  // Load existing settings
  useEffect(() => {
    if (existingSettings) {
      setAllocationType(existingSettings.allocation_type);
      setAllocationValue(existingSettings.allocation_value);
      setMaxPositionSize(existingSettings.max_position_size || 1000);
      setStopLossPercent(existingSettings.stop_copying_on_loss || null);
      setCopyStopLoss(existingSettings.copy_stop_loss);
      setCopyTakeProfit(existingSettings.copy_take_profit);
      setCustomStopLoss(existingSettings.custom_stop_loss || null);
      setCustomTakeProfit(existingSettings.custom_take_profit || null);
      setSelectedAssetClasses(existingSettings.asset_classes);
      setMaxRiskPerTrade(existingSettings.max_risk_per_trade || 10);
      setTrailingStop(existingSettings.trailing_stop || false);
    }
  }, [existingSettings]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const settings: CopySettings = {
        allocation_type: allocationType,
        allocation_value: allocationValue,
        max_position_size: maxPositionSize,
        stop_copying_on_loss: stopLossPercent || undefined,
        copy_stop_loss: copyStopLoss,
        copy_take_profit: copyTakeProfit,
        custom_stop_loss: customStopLoss || undefined,
        custom_take_profit: customTakeProfit || undefined,
        asset_classes: selectedAssetClasses,
        max_risk_per_trade: maxRiskPerTrade,
        trailing_stop: trailingStop,
      };

      const response = await fetch('/api/copy/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leader_id: leaderId,
          ...settings,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save settings');
      }

      // Success - wait a moment then close
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const calculateExample = () => {
    switch (allocationType) {
      case 'fixed_amount':
        return `You'll invest $${allocationValue} in each trade`;
      case 'percentage':
        return `${allocationValue}% of your portfolio per trade`;
      case 'proportional':
        return `Match leader's position sizing (${allocationValue}x factor)`;
      case 'multiplier':
        return `${allocationValue}x the leader's trade size`;
    }
  };

  const toggleAssetClass = (assetId: string) => {
    setSelectedAssetClasses((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Copy Settings</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Configure how you'll copy {leaderName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--accent)] transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-6 flex items-center gap-2">
            {['allocation', 'risk', 'assets', 'review'].map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  ['allocation', 'risk', 'assets', 'review'].indexOf(step) >= i
                    ? 'bg-[var(--primary)]'
                    : 'bg-[var(--border)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Allocation Strategy */}
          {step === 'allocation' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Allocation Strategy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ALLOCATION_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <Card
                        key={type.id}
                        className={`cursor-pointer transition-all p-4 ${
                          allocationType === type.id
                            ? 'border-[var(--primary)] border-2 bg-[var(--primary)] bg-opacity-5'
                            : 'hover:border-[var(--primary)] hover:border-opacity-50'
                        }`}
                        onClick={() => setAllocationType(type.id as CopySettings['allocation_type'])}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="w-5 h-5 text-[var(--primary)] mt-1" />
                          <div>
                            <h4 className="font-semibold">{type.name}</h4>
                            <p className="text-sm text-[var(--muted-foreground)] mt-1">
                              {type.description}
                            </p>
                            <p className="text-xs text-[var(--primary)] mt-2">{type.example}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {allocationType === 'fixed_amount' && 'Amount per Trade ($)'}
                  {allocationType === 'percentage' && 'Portfolio Percentage (%)'}
                  {allocationType === 'proportional' && 'Proportional Factor'}
                  {allocationType === 'multiplier' && 'Multiplier'}
                </label>
                <input
                  type="number"
                  value={allocationValue}
                  onChange={(e) => setAllocationValue(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none"
                  min="0"
                  step={allocationType === 'fixed_amount' ? '10' : '0.1'}
                />
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  <Info className="w-4 h-4 inline mr-1" />
                  {calculateExample()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Position Size ($)
                </label>
                <input
                  type="number"
                  value={maxPositionSize}
                  onChange={(e) => setMaxPositionSize(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none"
                  min="0"
                  step="100"
                />
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Maximum dollar amount for any single position
                </p>
              </div>

              <Button onClick={() => setStep('risk')} className="w-full" size="lg">
                Continue to Risk Management
              </Button>
            </div>
          )}

          {/* Step 2: Risk Management */}
          {step === 'risk' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Risk Management</h3>

              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={copyStopLoss}
                    onChange={(e) => setCopyStopLoss(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)]"
                  />
                  <span className="font-medium">Copy leader's stop-loss</span>
                </label>

                {!copyStopLoss && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Stop-Loss (%)
                    </label>
                    <input
                      type="number"
                      value={customStopLoss || ''}
                      onChange={(e) => setCustomStopLoss(parseFloat(e.target.value) || null)}
                      placeholder="e.g., -5 for 5% loss"
                      className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={copyTakeProfit}
                    onChange={(e) => setCopyTakeProfit(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)]"
                  />
                  <span className="font-medium">Copy leader's take-profit</span>
                </label>

                {!copyTakeProfit && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custom Take-Profit (%)
                    </label>
                    <input
                      type="number"
                      value={customTakeProfit || ''}
                      onChange={(e) => setCustomTakeProfit(parseFloat(e.target.value) || null)}
                      placeholder="e.g., 10 for 10% profit"
                      className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stop Copying After Loss (%)
                </label>
                <input
                  type="number"
                  value={stopLossPercent || ''}
                  onChange={(e) => setStopLossPercent(parseFloat(e.target.value) || null)}
                  placeholder="e.g., -20 to stop after 20% loss"
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none"
                />
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  Automatically stop copying if your total loss reaches this percentage
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  value={maxRiskPerTrade}
                  onChange={(e) => setMaxRiskPerTrade(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] focus:border-[var(--primary)] focus:outline-none"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={trailingStop}
                    onChange={(e) => setTrailingStop(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border)]"
                  />
                  <span className="font-medium">Enable trailing stop-loss</span>
                </label>
                <p className="text-sm text-[var(--muted-foreground)] mt-2 ml-6">
                  Automatically adjust stop-loss as position moves in profit
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={() => setStep('allocation')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep('assets')} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Asset Classes */}
          {step === 'assets' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Asset Classes to Copy</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  Select which types of trades you want to copy
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ASSET_CLASSES.map((asset) => (
                  <Card
                    key={asset.id}
                    className={`cursor-pointer transition-all p-4 ${
                      selectedAssetClasses.includes(asset.id)
                        ? 'border-[var(--primary)] border-2 bg-[var(--primary)] bg-opacity-5'
                        : 'hover:border-[var(--primary)] hover:border-opacity-50'
                    }`}
                    onClick={() => toggleAssetClass(asset.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{asset.name}</h4>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          {asset.description}
                        </p>
                      </div>
                      {selectedAssetClasses.includes(asset.id) && (
                        <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {selectedAssetClasses.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    Select at least one asset class to copy
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={() => setStep('risk')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep('review')}
                  className="flex-1"
                  disabled={selectedAssetClasses.length === 0}
                >
                  Review Settings
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Settings</h3>

              <Card className="p-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-[var(--muted-foreground)]">Allocation</h4>
                  <p className="text-lg">{calculateExample()}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Max position: ${maxPositionSize.toLocaleString()}
                  </p>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <h4 className="font-semibold text-sm text-[var(--muted-foreground)]">Risk Management</h4>
                  <ul className="text-sm space-y-1 mt-2">
                    <li>Stop-loss: {copyStopLoss ? 'Copy leader' : `Custom ${customStopLoss}%`}</li>
                    <li>Take-profit: {copyTakeProfit ? 'Copy leader' : `Custom ${customTakeProfit}%`}</li>
                    {stopLossPercent && <li>Stop copying after {stopLossPercent}% loss</li>}
                    <li>Max risk per trade: {maxRiskPerTrade}%</li>
                    {trailingStop && <li>Trailing stop-loss enabled</li>}
                  </ul>
                </div>

                <div className="border-t border-[var(--border)] pt-4">
                  <h4 className="font-semibold text-sm text-[var(--muted-foreground)]">Asset Classes</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAssetClasses.map((id) => {
                      const asset = ASSET_CLASSES.find((a) => a.id === id);
                      return (
                        <span
                          key={id}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] border border-[var(--primary)]"
                        >
                          {asset?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <div className="flex gap-4">
                <Button onClick={() => setStep('assets')} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  {loading ? 'Saving...' : existingSettings ? 'Update Settings' : 'Start Copying'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Processing */}
          {step === 'processing' && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Settings Saved!</h3>
              <p className="text-[var(--muted-foreground)]">
                You're now copying {leaderName}'s trades
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
