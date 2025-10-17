/**
 * Account Connection Check Utilities
 * Helper functions to verify if a user has a connected brokerage account
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Check if the current user has a connected brokerage account
 * @param clerkUserId - The Clerk user ID
 * @returns True if user has snaptrade_account_id set
 */
export async function hasConnectedAccount(clerkUserId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('snaptrade_account_id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error || !user) {
      return false;
    }

    return !!user.snaptrade_account_id;
  } catch (error) {
    console.error('Error checking connected account:', error);
    return false;
  }
}

/**
 * Check if a user has completed onboarding
 * @param clerkUserId - The Clerk user ID
 * @returns True if user has completed onboarding
 */
export async function hasCompletedOnboarding(clerkUserId: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error || !user) {
      return false;
    }

    return user.onboarding_completed === true;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

/**
 * Get user's account connection status
 * @param clerkUserId - The Clerk user ID
 * @returns Object with connection details
 */
export async function getAccountConnectionStatus(clerkUserId: string): Promise<{
  hasAccount: boolean;
  hasSnapTradeCredentials: boolean;
  hasRole: boolean;
  onboardingCompleted: boolean;
  role?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_account_id, role, onboarding_completed')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error || !user) {
      return {
        hasAccount: false,
        hasSnapTradeCredentials: false,
        hasRole: false,
        onboardingCompleted: false,
      };
    }

    return {
      hasAccount: !!user.snaptrade_account_id,
      hasSnapTradeCredentials: !!user.snaptrade_user_id,
      hasRole: !!user.role,
      onboardingCompleted: user.onboarding_completed === true,
      role: user.role,
    };
  } catch (error) {
    console.error('Error getting account connection status:', error);
    return {
      hasAccount: false,
      hasSnapTradeCredentials: false,
      hasRole: false,
      onboardingCompleted: false,
    };
  }
}
