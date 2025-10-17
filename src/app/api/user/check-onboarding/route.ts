/**
 * Check Onboarding Status API
 * GET /api/user/check-onboarding
 *
 * Checks if the authenticated user has completed onboarding
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user exists in database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, snaptrade_user_id, snaptrade_account_id, role, onboarding_completed')
      .eq('clerk_user_id', userId)
      .single();

    // User needs onboarding if:
    // 1. They don't exist in the database yet
    // 2. They don't have SnapTrade credentials
    // 3. They don't have a role set
    // 4. They haven't completed onboarding
    const needsOnboarding = !user ||
                           !user.snaptrade_user_id ||
                           !user.role ||
                           user.onboarding_completed !== true;

    return NextResponse.json({
      success: true,
      needsOnboarding,
      user: user ? {
        hasSnapTrade: !!user.snaptrade_user_id,
        hasAccount: !!user.snaptrade_account_id,
        hasRole: !!user.role,
        onboardingCompleted: user.onboarding_completed,
        role: user.role,
      } : null,
    });
  } catch (error) {
    console.error('Check onboarding error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check onboarding status',
      },
      { status: 500 }
    );
  }
}
