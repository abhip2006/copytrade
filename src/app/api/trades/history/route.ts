/**
 * Trade History API - Get user's past trades
 * GET /api/trades/history?days=30
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');

    // Get trades from database
    const supabase = await createClient();

    // First, get user to check their role
    const { data: user } = await supabase
      .from('users')
      .select('id, role, clerk_user_id')
      .eq('clerk_user_id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let trades: any[] = [];
    let error = null;

    // Leaders see their own trades
    if (user.role === 'leader' || user.role === 'both') {
      const result = await supabase
        .from('leader_trades')
        .select('*')
        .eq('leader_id', user.id)
        .gte('executed_at', cutoffDate.toISOString())
        .order('executed_at', { ascending: false })
        .limit(100);

      trades = result.data || [];
      error = result.error;
    } else {
      // Followers see their copied trades
      const result = await supabase
        .from('copy_executions')
        .select(`
          *,
          leader_trade:leader_trades!trade_id(symbol, action, order_type, leader_id),
          relationship:copy_relationships!relationship_id(
            leader:users!leader_id(full_name)
          )
        `)
        .eq('follower_id', user.id)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      trades = result.data || [];
      error = result.error;
    }

    if (error) {
      console.error('Failed to fetch trade history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trade history' },
        { status: 500 }
      );
    }

    // Format trades - map database fields to UI expected format
    const formattedTrades = (trades || []).map((trade) => {
      // Check if this is a copy_execution (follower trade) or leader_trade
      const isCopyExecution = 'follower_id' in trade;

      if (isCopyExecution) {
        // Follower's copied trade
        return {
          id: trade.id,
          leader_name: trade.relationship?.leader?.full_name || 'Unknown',
          symbol: trade.leader_trade?.symbol || trade.symbol || 'N/A',
          action: trade.leader_trade?.action || trade.action,
          quantity: trade.quantity,
          price: trade.executed_price || 0,
          total: (trade.quantity || 0) * (trade.executed_price || 0),
          status: trade.status === 'success' ? 'completed' :
                  trade.status === 'failed' ? 'failed' :
                  trade.status === 'skipped' ? 'skipped' : 'pending',
          executed_at: trade.executed_at || trade.created_at,
        };
      } else {
        // Leader's own trade
        return {
          id: trade.id,
          leader_name: 'You',
          symbol: trade.symbol,
          action: trade.action,
          quantity: trade.quantity,
          price: trade.price || 0,
          total: (trade.quantity || 0) * (trade.price || 0),
          // Derive status from processed and executed_at fields
          status: trade.executed_at
            ? (trade.processed ? 'completed' : 'pending')
            : 'failed',
          executed_at: trade.executed_at || trade.detected_at,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: formattedTrades,
    });
  } catch (error) {
    console.error('Trade history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade history' },
      { status: 500 }
    );
  }
}
