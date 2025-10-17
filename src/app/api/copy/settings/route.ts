/**
 * Copy Settings API Route
 * Manages follower copy settings for following leaders
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

    const body = await request.json();
    const {
      leader_id,
      allocation_type,
      allocation_value,
      max_position_size,
      stop_copying_on_loss,
      copy_stop_loss,
      copy_take_profit,
      custom_stop_loss,
      custom_take_profit,
      asset_classes,
      max_risk_per_trade,
      trailing_stop,
    } = body;

    // Validate required fields
    if (!leader_id || !allocation_type || !allocation_value) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is a follower
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_user_id', userId)
      .single();

    if (!user || user.role !== 'follower') {
      return NextResponse.json(
        { success: false, error: 'Only followers can copy leaders' },
        { status: 403 }
      );
    }

    // Check if leader exists and is public
    const { data: leader } = await supabase
      .from('leader_profiles')
      .select('is_public')
      .eq('leader_id', leader_id)
      .single();

    if (!leader || !leader.is_public) {
      return NextResponse.json(
        { success: false, error: 'Leader not found or not accepting followers' },
        { status: 404 }
      );
    }

    // Check if copy relationship already exists
    const { data: existing } = await supabase
      .from('copy_relationships')
      .select('id, status')
      .eq('follower_id', userId)
      .eq('leader_id', leader_id)
      .single();

    if (existing) {
      // Update existing relationship
      const { data, error } = await supabase
        .from('copy_relationships')
        .update({
          status: 'active',
          allocation_type,
          allocation_value,
          max_position_size: max_position_size || null,
          stop_copying_on_loss: stop_copying_on_loss || null,
          copy_stop_loss,
          copy_take_profit,
          custom_stop_loss: custom_stop_loss || null,
          custom_take_profit: custom_take_profit || null,
          asset_class_filters: asset_classes,
          max_risk_per_trade: max_risk_per_trade || null,
          trailing_stop: trailing_stop || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating copy relationship:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update settings' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Settings updated successfully',
      });
    } else {
      // Create new copy relationship
      const { data, error } = await supabase
        .from('copy_relationships')
        .insert({
          follower_id: userId,
          leader_id,
          status: 'active',
          allocation_type,
          allocation_value,
          max_position_size: max_position_size || null,
          stop_copying_on_loss: stop_copying_on_loss || null,
          copy_stop_loss,
          copy_take_profit,
          custom_stop_loss: custom_stop_loss || null,
          custom_take_profit: custom_take_profit || null,
          asset_class_filters: asset_classes,
          max_risk_per_trade: max_risk_per_trade || null,
          trailing_stop: trailing_stop || false,
          started_copying_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating copy relationship:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to create copy relationship' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
        message: 'Started copying successfully',
      });
    }
  } catch (error) {
    console.error('Error in copy settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save settings',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch copy settings for a specific leader
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

    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get('leader_id');

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'leader_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('copy_relationships')
      .select('*')
      .eq('follower_id', userId)
      .eq('leader_id', leaderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching copy settings:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error('Error fetching copy settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch settings',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Stop copying a leader
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get('leader_id');

    if (!leaderId) {
      return NextResponse.json(
        { success: false, error: 'leader_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Set status to 'stopped' instead of deleting
    const { error } = await supabase
      .from('copy_relationships')
      .update({
        status: 'stopped',
        stopped_copying_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('follower_id', userId)
      .eq('leader_id', leaderId);

    if (error) {
      console.error('Error stopping copy relationship:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to stop copying' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stopped copying successfully',
    });
  } catch (error) {
    console.error('Error stopping copy relationship:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stop copying',
      },
      { status: 500 }
    );
  }
}
