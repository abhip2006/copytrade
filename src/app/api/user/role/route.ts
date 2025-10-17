/**
 * User Role API Route
 * Updates user role (leader/follower) and associated permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (!role || !['leader', 'follower', 'both'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be "leader", "follower", or "both"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update role' },
        { status: 500 }
      );
    }

    // If leader or both, set leader-specific fields in users table
    if (role === 'leader' || role === 'both') {
      const { error: leaderUpdateError } = await supabase
        .from('users')
        .update({
          is_public: true,
          accepts_followers: true,
          max_followers: 1000,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_user_id', userId);

      if (leaderUpdateError) {
        console.error('Error updating leader settings:', leaderUpdateError);
        // Non-critical error, continue anyway
      }
    }

    return NextResponse.json({
      success: true,
      data: { role },
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set role',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch current user role and onboarding status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('role, onboarding_completed')
      .eq('clerk_user_id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        role: user.role,
        onboardingCompleted: user.onboarding_completed,
      },
    });
  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch role',
      },
      { status: 500 }
    );
  }
}
