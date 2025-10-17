/**
 * API Route: Single Copy Relationship
 * Update or delete a specific copy relationship
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * PATCH /api/copy-relationships/[id]
 * Update relationship settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

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

    // Get relationship
    const { data: relationship } = await supabase
      .from('copy_relationships')
      .select('*')
      .eq('id', id)
      .single();

    if (!relationship) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    // Verify user is the follower
    if (relationship.follower_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update relationship
    const { data: updated, error } = await supabase
      .from('copy_relationships')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating relationship:', error);
      return NextResponse.json(
        { error: 'Failed to update relationship' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Relationship updated successfully',
      relationship: updated,
    });
  } catch (error) {
    console.error('Error in PATCH /api/copy-relationships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/copy-relationships/[id]
 * Stop following a leader (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    // Get relationship
    const { data: relationship } = await supabase
      .from('copy_relationships')
      .select('*')
      .eq('id', id)
      .single();

    if (!relationship) {
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    // Verify user is the follower
    if (relationship.follower_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Soft delete: set status to 'stopped'
    const { error } = await supabase
      .from('copy_relationships')
      .update({ status: 'stopped' })
      .eq('id', id);

    if (error) {
      console.error('Error deleting relationship:', error);
      return NextResponse.json(
        { error: 'Failed to delete relationship' },
        { status: 500 }
      );
    }

    // Update leader's follower count
    await supabase.rpc('decrement_follower_count', { leader_user_id: relationship.leader_id });

    return NextResponse.json({
      message: 'Successfully unfollowed leader',
    });
  } catch (error) {
    console.error('Error in DELETE /api/copy-relationships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
