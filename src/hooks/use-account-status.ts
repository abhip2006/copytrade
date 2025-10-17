/**
 * useAccountStatus Hook
 * Client-side hook to check if user has a connected brokerage account
 */

'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface AccountStatus {
  loading: boolean;
  hasAccount: boolean;
  hasSnapTradeCredentials: boolean;
  hasRole: boolean;
  onboardingCompleted: boolean;
  role?: string;
}

export function useAccountStatus() {
  const { isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<AccountStatus>({
    loading: true,
    hasAccount: false,
    hasSnapTradeCredentials: false,
    hasRole: false,
    onboardingCompleted: false,
  });

  useEffect(() => {
    async function checkAccountStatus() {
      // Wait for Clerk to load
      if (!isLoaded) return;

      // If not signed in, return empty status
      if (!isSignedIn) {
        setStatus({
          loading: false,
          hasAccount: false,
          hasSnapTradeCredentials: false,
          hasRole: false,
          onboardingCompleted: false,
        });
        return;
      }

      try {
        const response = await fetch('/api/user/check-onboarding');
        const data = await response.json();

        if (data.success && data.user) {
          setStatus({
            loading: false,
            hasAccount: data.user.hasAccount,
            hasSnapTradeCredentials: data.user.hasSnapTrade,
            hasRole: data.user.hasRole,
            onboardingCompleted: data.user.onboardingCompleted,
            role: data.user.role,
          });
        } else {
          // User doesn't exist yet
          setStatus({
            loading: false,
            hasAccount: false,
            hasSnapTradeCredentials: false,
            hasRole: false,
            onboardingCompleted: false,
          });
        }
      } catch (error) {
        console.error('Error checking account status:', error);
        // Fail open - allow access if check fails
        setStatus({
          loading: false,
          hasAccount: false,
          hasSnapTradeCredentials: false,
          hasRole: false,
          onboardingCompleted: false,
        });
      }
    }

    checkAccountStatus();
  }, [isLoaded, isSignedIn]);

  return status;
}
