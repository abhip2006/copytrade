/**
 * Role-Based Access Control Utilities
 * Simplified version - relies on Clerk webhooks to create users
 */

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'leader' | 'follower' | 'admin';

export interface UserRoleData {
  userId: string;
  role: UserRole;
  onboardingCompleted: boolean;
}

/**
 * Get user role from database
 * Returns null if user doesn't exist - they need to be created by webhook first
 */
export async function getUserRole(): Promise<UserRoleData | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, role, clerk_user_id, snaptrade_user_id, snaptrade_account_id')
      .eq('clerk_user_id', userId)
      .single();

    if (error || !data) {
      // User doesn't exist in database yet
      return null;
    }

    // Check if onboarding is complete by seeing if they have SnapTrade configured
    const onboardingCompleted = !!(data.snaptrade_user_id && data.snaptrade_account_id);

    return {
      userId: data.clerk_user_id,
      role: data.role as UserRole,
      onboardingCompleted,
    };
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
}

/**
 * Require specific role - redirects if user doesn't have required role
 * Use in Server Components
 */
export async function requireRole(requiredRole: UserRole | UserRole[]): Promise<UserRoleData> {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const userData = await getUserRole();

  if (!userData) {
    // User exists in Clerk but not in database yet
    // Redirect to onboarding to trigger user creation
    redirect('/onboarding');
  }

  // Check if onboarding is completed
  if (!userData.onboardingCompleted) {
    redirect('/onboarding');
  }

  // Check role permission
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  if (!allowedRoles.includes(userData.role)) {
    // Redirect to appropriate dashboard based on their role
    if (userData.role === 'leader') {
      redirect('/leader');
    } else if (userData.role === 'follower') {
      redirect('/dashboard');
    } else {
      redirect('/');
    }
  }

  return userData;
}

/**
 * Check if user has specific role (doesn't redirect)
 * Use in API routes
 */
export async function hasRole(requiredRole: UserRole | UserRole[]): Promise<boolean> {
  const userData = await getUserRole();

  if (!userData) {
    return false;
  }

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return allowedRoles.includes(userData.role);
}

/**
 * Require leader role
 */
export async function requireLeader(): Promise<UserRoleData> {
  return requireRole('leader');
}

/**
 * Require follower role
 */
export async function requireFollower(): Promise<UserRoleData> {
  return requireRole('follower');
}

/**
 * Check if user is leader
 */
export async function isLeader(): Promise<boolean> {
  return hasRole('leader');
}

/**
 * Check if user is follower
 */
export async function isFollower(): Promise<boolean> {
  return hasRole('follower');
}
