/**
 * useOnboardingCheck Hook
 *
 * Checks if the current user has completed onboarding and redirects appropriately.
 * - New users (no DB record) → Redirect to /onboarding
 * - Existing users (has DB record) → Allow access, redirect to appropriate dashboard if needed
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface OnboardingStatus {
  loading: boolean;
  needsOnboarding: boolean;
  userRole?: 'leader' | 'follower';
}

export function useOnboardingCheck(options?: { redirectIfComplete?: boolean }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [status, setStatus] = useState<OnboardingStatus>({
    loading: true,
    needsOnboarding: false,
  });

  useEffect(() => {
    async function checkOnboarding() {
      // Wait for Clerk to load
      if (!isLoaded) return;

      // If not signed in, don't check
      if (!isSignedIn) {
        setStatus({ loading: false, needsOnboarding: false });
        return;
      }

      try {
        const response = await fetch('/api/user/check-onboarding');
        const data = await response.json();

        if (data.success) {
          // User is truly new (doesn't exist in DB) - redirect to onboarding
          if (data.needsOnboarding && !data.user) {
            setStatus({ loading: false, needsOnboarding: true });
            router.push('/onboarding');
            return;
          }

          // User exists but might have incomplete onboarding
          if (data.needsOnboarding && data.user) {
            // User has partial data - redirect to onboarding to complete
            setStatus({ loading: false, needsOnboarding: true });
            router.push('/onboarding');
            return;
          }

          // User has completed onboarding
          // If redirectIfComplete is true, redirect to their dashboard
          if (options?.redirectIfComplete && data.user) {
            // Get user role from API response or fetch it
            const roleResponse = await fetch('/api/user/role');
            const roleData = await roleResponse.json();

            if (roleData.success && roleData.role) {
              setStatus({
                loading: false,
                needsOnboarding: false,
                userRole: roleData.role,
              });

              // Redirect to appropriate dashboard
              if (roleData.role === 'leader') {
                router.push('/leader');
              } else {
                router.push('/dashboard');
              }
              return;
            }
          }

          setStatus({
            loading: false,
            needsOnboarding: false,
          });
        }
      } catch (error) {
        console.error('Onboarding check error:', error);
        // Fail open - allow access if check fails
        setStatus({ loading: false, needsOnboarding: false });
      }
    }

    checkOnboarding();
  }, [isLoaded, isSignedIn, router, options?.redirectIfComplete]);

  return status;
}
