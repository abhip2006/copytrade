/**
 * User Onboarding Page
 * Multi-step wizard for connecting brokerage account and setting up profile
 */

'use client';

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';

type OnboardingStep = 'welcome' | 'register' | 'connect' | 'select-account' | 'role-selection' | 'complete';

interface BrokerageAccount {
  id: string;
  name: string;
  number: string;
  type: string;
  balance?: {
    total?: { amount?: number; currency?: string };
  };
  meta?: {
    institution_name?: string;
  };
}

interface BrokerageAuthorization {
  id: string;
  brokerage_name?: string;
  type?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snaptradeUserId, setSnaptradeUserId] = useState<string | null>(null);
  const [connectionUrl, setConnectionUrl] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<BrokerageAccount[]>([]);
  const [authorizations, setAuthorizations] = useState<BrokerageAuthorization[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'leader' | 'follower' | null>(null);

  // Auto-advance from welcome after 2 seconds
  useEffect(() => {
    if (currentStep === 'welcome') {
      const timer = setTimeout(() => {
        handleRegisterSnapTrade();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Poll for accounts after connection
  useEffect(() => {
    if (currentStep === 'connect' && connectionUrl) {
      // Poll every 3 seconds to check if user completed connection
      const interval = setInterval(() => {
        checkForAccounts();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep, connectionUrl]);

  /**
   * Step 1: Register user with SnapTrade
   */
  const handleRegisterSnapTrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/snaptrade/register', {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to register with SnapTrade');
      }

      setSnaptradeUserId(result.data.userId);
      setCurrentStep('register');

      // Auto-advance to connection step
      setTimeout(() => {
        handleGenerateConnectionUrl();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Generate SnapTrade connection URL
   */
  const handleGenerateConnectionUrl = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/snaptrade/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          immediateRedirect: true,
          connectionType: 'trade',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate connection URL');
      }

      setConnectionUrl(result.data.redirectUri);
      setCurrentStep('connect');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Skip brokerage connection - go straight to role selection
   * Note: Users can connect later, but trading features will be limited
   */
  const handleSkipConnection = () => {
    // Clear any account/authorization state since user is skipping
    setAccounts([]);
    setAuthorizations([]);
    setSelectedAccount(null);
    setCurrentStep('role-selection');
  };

  /**
   * Open SnapTrade connection portal in new window
   */
  const handleOpenConnectionPortal = () => {
    if (!connectionUrl) return;

    // Open in new window (800x600)
    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      connectionUrl,
      'SnapTrade Connection',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  /**
   * Check if user has connected accounts
   */
  const checkForAccounts = async () => {
    try {
      const response = await fetch('/api/snaptrade/accounts');
      const result = await response.json();

      if (result.success && result.data.hasConnectedAccounts) {
        setAccounts(result.data.accounts);
        setAuthorizations(result.data.authorizations || []);
        setCurrentStep('select-account');
      }
    } catch (err) {
      console.error('Error checking accounts:', err);
    }
  };

  /**
   * Step 3: Select primary trading account
   */
  const handleSelectAccount = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    setError(null);

    try {
      const account = accounts.find((a) => a.id === selectedAccount);
      if (!account) throw new Error('Account not found');

      // Find the authorization ID for this account
      // Note: SnapTrade returns authorizations separately from accounts
      // We'll use the first available authorization ID if we have authorizations
      const authorizationId = authorizations.length > 0 ? authorizations[0].id : account.id;

      const response = await fetch('/api/snaptrade/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          authorizationId: authorizationId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to select account');
      }

      setCurrentStep('role-selection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account selection failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 4: Select role (Leader or Follower)
   */
  const handleRoleSelection = async () => {
    if (!selectedRole) return;

    setLoading(true);
    setError(null);

    try {
      // Update user role in database
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to set role');
      }

      setCurrentStep('complete');

      // Redirect to appropriate dashboard after 2 seconds
      setTimeout(() => {
        if (selectedRole === 'leader') {
          router.push('/leader');
        } else {
          router.push('/dashboard');
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Role selection failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render step content
   */
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--primary)] bg-opacity-10">
              <TrendingUp className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to TradeOS!</h2>
              <p className="text-[var(--foreground-muted)]">
                Let&apos;s get you set up in just a few steps
              </p>
            </div>
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
            </div>
          </div>
        );

      case 'register':
        return (
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 mx-auto text-[var(--success)]" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Account Created!</h2>
              <p className="text-[var(--foreground-muted)]">
                Preparing your brokerage connection...
              </p>
            </div>
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--primary)]" />
          </div>
        );

      case 'connect':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-[var(--primary)]" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Brokerage</h2>
              <p className="text-[var(--foreground-muted)] mb-6">
                Securely link your brokerage account to start trading
              </p>
            </div>

            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)] mt-0.5" />
                    <div>
                      <p className="font-medium">Bank-level encryption</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Your credentials are never stored on our servers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)] mt-0.5" />
                    <div>
                      <p className="font-medium">Read-only access option</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Choose between read-only or full trading permissions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--success)] mt-0.5" />
                    <div>
                      <p className="font-medium">Revoke anytime</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Disconnect your account at any time from settings
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button
                onClick={handleOpenConnectionPortal}
                disabled={!connectionUrl}
                className="w-full"
                size="lg"
              >
                {connectionUrl ? 'Connect Brokerage Account' : 'Generating Connection...'}
              </Button>

              <Button
                onClick={handleSkipConnection}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Skip for now - I'll connect later
              </Button>
            </div>

            {connectionUrl && (
              <p className="text-xs text-center text-[var(--foreground-muted)]">
                A new window will open. Return here after connecting your account.
              </p>
            )}

            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Note:</strong> Trading features require a connected brokerage account.
                You can connect one later from your dashboard settings.
              </p>
            </div>
          </div>
        );

      case 'select-account':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">Accounts Connected!</h2>
              <p className="text-[var(--foreground-muted)]">
                Select your primary trading account
              </p>
            </div>

            <div className="space-y-3">
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-all ${
                    selectedAccount === account.id
                      ? 'border-[var(--primary)] border-2 bg-[var(--primary)] bg-opacity-5'
                      : 'hover:border-[var(--primary)] hover:border-opacity-50'
                  }`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {account.meta?.institution_name || account.name}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {account.type} •••{account.number?.slice(-4)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ${account.balance?.total?.amount?.toLocaleString() || '0.00'}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {account.balance?.total?.currency || 'USD'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={handleSelectAccount}
              disabled={!selectedAccount || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        );

      case 'role-selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="w-16 h-16 mx-auto mb-4 text-[var(--primary)]" />
              <h2 className="text-2xl font-bold mb-2">Choose Your Path</h2>
              <p className="text-[var(--foreground-muted)]">
                How do you want to use TradeOS?
              </p>
            </div>

            {accounts.length === 0 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  You haven't connected a brokerage account yet. You can still select your role
                  and connect an account later from your settings to enable trading features.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === 'leader'
                    ? 'border-[var(--primary)] border-2 bg-[var(--primary)] bg-opacity-5'
                    : 'hover:border-[var(--primary)] hover:border-opacity-50'
                }`}
                onClick={() => setSelectedRole('leader')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Leader
                  </CardTitle>
                  <CardDescription>Share your trades with followers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                      <span>Trade freely and earn from followers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                      <span>Build your trading reputation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                      <span>Access advanced analytics</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  selectedRole === 'follower'
                    ? 'border-[var(--primary)] border-2 bg-[var(--primary)] bg-opacity-5'
                    : 'hover:border-[var(--primary)] hover:border-opacity-50'
                }`}
                onClick={() => setSelectedRole('follower')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Follower
                  </CardTitle>
                  <CardDescription>Copy successful traders automatically</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                      <span>Automated trade copying</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                      <span>Risk management controls</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--success)] mt-0.5" />
                      <span>Follow multiple leaders</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleRoleSelection}
              disabled={!selectedRole || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <CheckCircle2 className="w-20 h-20 mx-auto text-[var(--success)]" />
            <div>
              <h2 className="text-3xl font-bold mb-2">All Set!</h2>
              <p className="text-[var(--foreground-muted)]">
                Redirecting you to your dashboard...
              </p>
            </div>
            <Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--primary)]" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-2">
          <CardContent className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-[var(--danger-bg)] border border-[var(--danger)] rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--foreground)]">Error</p>
                  <p className="text-sm text-[var(--foreground-secondary)]">{error}</p>
                </div>
              </div>
            )}

            {renderStepContent()}

            {/* Progress indicator */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {['welcome', 'register', 'connect', 'select-account', 'role-selection', 'complete'].map(
                (step, index) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all ${
                      step === currentStep
                        ? 'w-8 bg-[var(--primary)]'
                        : index <
                          ['welcome', 'register', 'connect', 'select-account', 'role-selection', 'complete'].indexOf(
                            currentStep
                          )
                        ? 'w-2 bg-[var(--primary)]'
                        : 'w-2 bg-[var(--border)]'
                    }`}
                  />
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
