/**
 * API Route: Leader Profile
 * Get detailed information about a specific leader
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/leaders/[id]
 * Get leader profile with stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createServiceRoleClient();

    // Get leader
    const { data: leader, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (error || !leader) {
      return NextResponse.json(
        { error: 'Leader not found' },
        { status: 404 }
      );
    }

    // Get leader stats
    const { data: stats } = await supabase
      .from('leader_stats')
      .select('*')
      .eq('leader_id', id)
      .single();

    // Get recent trades (last 10)
    const { data: recentTrades } = await supabase
      .from('leader_trades')
      .select('*')
      .eq('leader_id', id)
      .order('executed_at', { ascending: false })
      .limit(10);

    // Get reviews
    const { data: reviews } = await supabase
      .from('leader_reviews')
      .select(`
        *,
        reviewer:reviewer_id(full_name)
      `)
      .eq('leader_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate average rating
    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Remove sensitive data
    const {
      snaptrade_user_secret,
      ...leaderPublicData
    } = leader;

    return NextResponse.json({
      leader: {
        ...leaderPublicData,
        risk_level:
          leader.risk_score <= 3 ? 'low' :
          leader.risk_score <= 6 ? 'medium' : 'high',
        avg_rating: avgRating,
        review_count: reviews?.length || 0,
      },
      stats,
      recentTrades: recentTrades || [],
      reviews: reviews || [],
    });
  } catch (error) {
    console.error('Error in GET /api/leaders/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
