/**
 * API Route: Leader Discovery
 * Search and filter leaders for discovery/leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/leaders/discover
 * Discover leaders with advanced filtering
 *
 * Query Parameters:
 * - search: string (search by name)
 * - sort: 'followers' | 'roi' | 'sharpe' | 'win_rate' (default: 'followers')
 * - risk_level: 'low' | 'medium' | 'high'
 * - verified_only: 'true' | 'false'
 * - trades_options: 'true' | 'false'
 * - min_win_rate: number (0-100)
 * - min_roi: number
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'followers';
    const riskLevel = searchParams.get('risk_level');
    const verifiedOnly = searchParams.get('verified_only') === 'true';
    const tradesOptions = searchParams.get('trades_options');
    const minWinRate = parseFloat(searchParams.get('min_win_rate') || '0');
    const minRoi = parseFloat(searchParams.get('min_roi') || '0');
    // Validate and cap limit to prevent abuse
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const supabase = createServiceRoleClient();

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .in('role', ['leader', 'both'])
      .eq('is_public', true)
      .eq('accepts_followers', true);

    // Apply filters
    if (search) {
      // Sanitize search input to prevent SQL injection
      const sanitizedSearch = search.replace(/[%_]/g, '\\$&');
      query = query.or(`full_name.ilike.%${sanitizedSearch}%`);
    }

    if (verifiedOnly) {
      query = query.eq('is_verified', true);
    }

    if (riskLevel) {
      if (riskLevel === 'low') {
        query = query.lte('risk_score', 3);
      } else if (riskLevel === 'medium') {
        query = query.gte('risk_score', 4).lte('risk_score', 6);
      } else if (riskLevel === 'high') {
        query = query.gte('risk_score', 7);
      }
    }

    if (tradesOptions !== null) {
      query = query.eq('trades_options', tradesOptions === 'true');
    }

    if (minWinRate > 0) {
      query = query.gte('win_rate', minWinRate);
    }

    if (minRoi > 0) {
      query = query.gte('total_roi', minRoi);
    }

    // Apply sorting
    switch (sort) {
      case 'followers':
        query = query.order('active_followers', { ascending: false });
        break;
      case 'roi':
        query = query.order('total_roi', { ascending: false });
        break;
      case 'sharpe':
        query = query.order('sharpe_ratio', { ascending: false });
        break;
      case 'win_rate':
        query = query.order('win_rate', { ascending: false });
        break;
      default:
        query = query.order('active_followers', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leaders, error, count } = await query;

    if (error) {
      console.error('Error fetching leaders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaders' },
        { status: 500 }
      );
    }

    // Calculate risk level labels and remove sensitive data
    const leadersWithRiskLabels = leaders?.map((leader) => {
      // Destructure to remove sensitive fields
      const {
        snaptrade_user_secret,
        snaptrade_user_id,
        clerk_user_id,
        verified_by_admin_id,
        ...safeLeader
      } = leader;

      return {
        ...safeLeader,
        risk_level:
          leader.risk_score <= 3 ? 'low' :
          leader.risk_score <= 6 ? 'medium' : 'high',
      };
    });

    return NextResponse.json({
      leaders: leadersWithRiskLabels || [],
      total: count || 0,
      limit,
      offset,
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Error in GET /api/leaders/discover:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
