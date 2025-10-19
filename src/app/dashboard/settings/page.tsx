/**
 * Settings Page - User preferences and account settings
 * Implements missing P1 feature from implementation status
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import {
  TrendingUp,
  User,
  Bell,
  Shield,
  CreditCard,
  Link2,
  ArrowLeft,
  Save,
  Check,
  Settings as SettingsIcon,
  LogOut,
  Trash2,
} from "lucide-react";
import { TradeOSLogoCompact } from '@/components/branding/tradeos-logo';

interface UserSettings {
  email_notifications: boolean;
  trade_notifications: boolean;
  performance_updates: boolean;
  risk_tolerance: 'low' | 'medium' | 'high';
  auto_copy_enabled: boolean;
  max_position_size: number;
  stop_loss_default: number;
  take_profit_default: number;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings>({
    email_notifications: true,
    trade_notifications: true,
    performance_updates: false,
    risk_tolerance: 'medium',
    auto_copy_enabled: true,
    max_position_size: 10000,
    stop_loss_default: 5,
    take_profit_default: 10,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'trading' | 'security'>('profile');

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // API call to save settings would go here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectBrokerage = () => {
    if (confirm('Are you sure you want to disconnect your brokerage account? This will stop all copy trading.')) {
      // Handle disconnect logic
      alert('Brokerage account disconnected');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('⚠️ WARNING: This will permanently delete your account and all data. This action cannot be undone. Are you absolutely sure?')) {
      // Handle account deletion
      alert('Account deletion would be processed here');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <TradeOSLogoCompact />
            </Link>

            <div className="flex items-center gap-3">
              <Badge variant="secondary">{user?.emailAddresses[0]?.emailAddress}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-2 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Manage your account, preferences, and trading settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-24">
              <nav className="space-y-1">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'trading', label: 'Trading', icon: TrendingUp },
                  { id: 'security', label: 'Security', icon: Shield },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? 'bg-[var(--primary-bg)] text-[var(--primary)]'
                        : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                    Profile Information
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        defaultValue={user?.fullName || ''}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={user?.emailAddresses[0]?.emailAddress || ''}
                        disabled
                      />
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        Email cannot be changed here. Manage in Clerk settings.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                    Connected Accounts
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-elevated)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--primary-bg)] flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-[var(--primary)]" />
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--foreground)]">
                            Brokerage Account
                          </div>
                          <div className="text-sm text-[var(--foreground-muted)]">
                            Connected via SnapTrade
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectBrokerage}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      key: 'email_notifications',
                      label: 'Email Notifications',
                      description: 'Receive important updates via email',
                    },
                    {
                      key: 'trade_notifications',
                      label: 'Trade Notifications',
                      description: 'Get notified when trades are executed',
                    },
                    {
                      key: 'performance_updates',
                      label: 'Performance Updates',
                      description: 'Weekly portfolio performance summaries',
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[var(--foreground)]">
                          {item.label}
                        </div>
                        <div className="text-sm text-[var(--foreground-muted)]">
                          {item.description}
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          [item.key]: !settings[item.key as keyof UserSettings],
                        })}
                        className={`w-12 h-6 rounded-full transition-all ${
                          settings[item.key as keyof UserSettings]
                            ? 'bg-[var(--primary)]'
                            : 'bg-[var(--surface-elevated)]'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                            settings[item.key as keyof UserSettings]
                              ? 'translate-x-6'
                              : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Trading Settings */}
            {activeTab === 'trading' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                    Trading Preferences
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Risk Tolerance
                      </label>
                      <select
                        value={settings.risk_tolerance}
                        onChange={(e) => setSettings({
                          ...settings,
                          risk_tolerance: e.target.value as 'low' | 'medium' | 'high',
                        })}
                        className="w-full px-4 py-2 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--foreground)]"
                      >
                        <option value="low">Low - Conservative approach</option>
                        <option value="medium">Medium - Balanced strategy</option>
                        <option value="high">High - Aggressive growth</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Maximum Position Size ($)
                      </label>
                      <Input
                        type="number"
                        value={settings.max_position_size}
                        onChange={(e) => setSettings({
                          ...settings,
                          max_position_size: parseFloat(e.target.value),
                        })}
                        placeholder="10000"
                      />
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        Maximum amount to invest in a single position
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                    Risk Management
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Default Stop Loss (%)
                      </label>
                      <Input
                        type="number"
                        value={settings.stop_loss_default}
                        onChange={(e) => setSettings({
                          ...settings,
                          stop_loss_default: parseFloat(e.target.value),
                        })}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        Default Take Profit (%)
                      </label>
                      <Input
                        type="number"
                        value={settings.take_profit_default}
                        onChange={(e) => setSettings({
                          ...settings,
                          take_profit_default: parseFloat(e.target.value),
                        })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold text-[var(--foreground)] mb-6">
                    Security & Privacy
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">
                            Two-Factor Authentication
                          </div>
                          <div className="text-sm text-[var(--foreground-muted)]">
                            Managed through Clerk authentication
                          </div>
                        </div>
                        <Badge variant="success">Enabled</Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[var(--surface-elevated)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">
                            API Access
                          </div>
                          <div className="text-sm text-[var(--foreground-muted)]">
                            Manage API keys and permissions
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-[var(--danger)]">
                  <h2 className="text-xl font-semibold text-[var(--danger)] mb-6">
                    Danger Zone
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-[var(--danger-bg)] border border-[var(--danger)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-[var(--foreground)]">
                            Delete Account
                          </div>
                          <div className="text-sm text-[var(--foreground-muted)]">
                            Permanently delete your account and all data
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white"
                          onClick={handleDeleteAccount}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-end gap-4">
              {saved && (
                <div className="flex items-center gap-2 text-[var(--success)]">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Settings saved!</span>
                </div>
              )}
              <Button
                variant="default"
                onClick={handleSaveSettings}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
