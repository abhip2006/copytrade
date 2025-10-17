/**
 * API Route: Copy Relationships
 * CRUD operations for follower-leader relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { copyRelationshipCreateSchema, safeValidate } from '@/lib/validations/api-schemas';

export const runtime = 'nodejs';

/**
 * GET /api/copy-relationships
 * List user's copy relationships (as leader or follower)
 */
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameter for role filter
    const { searchParams } = new URL(request.url);
    const as = searchParams.get('as'); // 'leader' or 'follower'

    let query = supabase
      .from('copy_relationships')
      .select(`
        *,
        leader:leader_id(id, full_name, email, total_roi, win_rate, sharpe_ratio, is_verified),
        follower:follower_id(id, full_name, email)
      `);

    if (as === 'leader') {
      query = query.eq('leader_id', user.id);
    } else if (as === 'follower') {
      query = query.eq('follower_id', user.id);
    } else {
      // Get both
      query = query.or(`leader_id.eq.${user.id},follower_id.eq.${user.id}`);
    }

    const { data: relationships, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching relationships:', error);
      return NextResponse.json(
        { error: 'Failed to fetch relationships' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      relationships: relationships || [],
    });
  } catch (error) {
    console.error('Error in GET /api/copy-relationships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/copy-relationships
 * Create a new copy relationship (follow a leader)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = safeValidate(copyRelationshipCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const {
      leaderId: leader_id,
      positionSizingMethod: position_sizing_method,
      allocationPercent: allocation_percent,
      ...otherSettings
    } = validation.data;

    const supabase = createServiceRoleClient();

    // Get follower
    const { data: follower } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (!follower) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate leader exists and accepts followers
    const { data: leader } = await supabase
      .from('users')
      .select('*')
      .eq('id', leader_id)
      .single();

    if (!leader) {
      return NextResponse.json(
        { error: 'Leader not found' },
        { status: 404 }
      );
    }

    if (!leader.accepts_followers) {
      return NextResponse.json(
        { error: 'Leader is not accepting followers' },
        { status: 400 }
      );
    }

    // Check if follower has a connected brokerage account
    const { data: connections } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('user_id', follower.id)
      .eq('status', 'active')
      .limit(1);

    if (!connections || connections.length === 0) {
      return NextResponse.json(
        { error: 'You must connect a brokerage account before following a leader' },
        { status: 400 }
      );
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from('copy_relationships')
      .select('*')
      .eq('leader_id', leader_id)
      .eq('follower_id', follower.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You are already following this leader' },
        { status: 400 }
      );
    }

    // Create relationship
    const { data: relationship, error } = await supabase
      .from('copy_relationships')
      .insert({
        leader_id,
        follower_id: follower.id,
        position_sizing_method,
        allocation_percent,
        status: 'active',
        ...otherSettings,
      })
      .select(`
        *,
        leader:leader_id(id, full_name, email, total_roi, win_rate)
      `)
      .single();

    if (error) {
      console.error('Error creating relationship:', error);
      return NextResponse.json(
        { error: 'Failed to create relationship' },
        { status: 500 }
      );
    }

    // Update leader's follower count
    const { error: rpcError } = await supabase.rpc('increment_follower_count', { leader_user_id: leader_id });
    if (rpcError) {
      console.error('Failed to increment follower count:', rpcError);
      // Non-critical error, continue anyway
    }

    // Create notification for leader
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: leader_id,
      type: 'new_follower',
      title: 'New Follower',
      message: `${follower.full_name || 'Someone'} started following you`,
      metadata: { follower_id: follower.id },
    });
    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Non-critical error, continue anyway
    }

    return NextResponse.json({
      message: 'Successfully following leader',
      relationship,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/copy-relationships:', error);
    return NextResponse.json(
      {
        error: 'Failed to create relationship',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
