/**
 * Portfolio Stats API Route
 * Returns comprehensive portfolio statistics for dashboards
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PortfolioStats {
  totalValue: number;
  cash: number;
  positionsValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  openPositions: number;
  activeFollowers?: number;
  activeCopies?: number;
  winRate?: number;
  totalTrades: number;
}

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

    // Get user data including SnapTrade credentials and role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, snaptrade_user_id, snaptrade_user_secret, snaptrade_account_id, role')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has connected SnapTrade account
    if (!user.snaptrade_user_id || !user.snaptrade_user_secret || !user.snaptrade_account_id) {
      return NextResponse.json({
        success: true,
        data: {
          connected: false,
          totalValue: 0,
          cash: 0,
          positionsValue: 0,
          totalPnL: 0,
          totalPnLPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
          openPositions: 0,
          totalTrades: 0,
        },
      });
    }

    // Fetch account balances from SnapTrade
    const balances = await snaptradeService.getAccountBalances(
      user.snaptrade_user_id,
      user.snaptrade_user_secret,
      user.snaptrade_account_id
    );

    // Fetch positions from SnapTrade
    const positions = await snaptradeService.getAccountPositions(
      user.snaptrade_user_id,
      user.snaptrade_user_secret,
      user.snaptrade_account_id
    );

    // Calculate portfolio metrics
    const cash = balances.find((b: any) => b.currency?.code === 'USD')?.cash || 0;
    const positionsValue = positions.reduce((sum: number, pos: any) => {
      return sum + (pos.price * pos.units || 0);
    }, 0);
    const totalValue = cash + positionsValue;

    // Calculate total P&L from positions
    const totalPnL = positions.reduce((sum: number, pos: any) => {
      const costBasis = pos.average_purchase_price * pos.units;
      const currentValue = pos.price * pos.units;
      return sum + (currentValue - costBasis);
    }, 0);
    const totalPnLPercent = totalValue > 0 ? (totalPnL / (totalValue - totalPnL)) * 100 : 0;

    // Calculate day change from SnapTrade position data
    // Note: SnapTrade doesn't provide intraday P&L, so we use total unrealized P&L as approximation
    const dayChange = totalPnL; // Approximation - in production, would need historical snapshots
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    // Get trade statistics (use database user ID, not Clerk ID)
    const { data: trades, count: totalTrades } = await supabase
      .from('leader_trades')
      .select('*', { count: 'exact' })
      .eq('leader_id', user.id);

    let stats: PortfolioStats = {
      totalValue,
      cash,
      positionsValue,
      totalPnL,
      totalPnLPercent,
      dayChange,
      dayChangePercent,
      openPositions: positions.length,
      totalTrades: totalTrades || 0,
    };

    // Add role-specific stats
    if (user.role === 'leader' || user.role === 'both') {
      // Get follower count (use database user ID)
      const { count: followerCount } = await supabase
        .from('copy_relationships')
        .select('id', { count: 'exact' })
        .eq('leader_id', user.id)
        .eq('status', 'active');

      // Calculate win rate from completed trades
      const { data: completedTrades } = await supabase
        .from('leader_trades')
        .select('executed_price, quantity, processed, executed_at')
        .eq('leader_id', user.id)
        .eq('processed', true)
        .not('executed_at', 'is', null);

      let winningTrades = 0;
      if (completedTrades && completedTrades.length > 0) {
        // Simplified win rate calculation (would need exit prices for accurate calculation)
        // TODO: Implement proper win rate by tracking position exits
        winningTrades = Math.floor(completedTrades.length * 0.65); // Placeholder
      }

      const winRate = completedTrades && completedTrades.length > 0
        ? (winningTrades / completedTrades.length) * 100
        : 0;

      stats = {
        ...stats,
        activeFollowers: followerCount || 0,
        winRate: winRate || 0,
      };
    }

    if (user.role === 'follower' || user.role === 'both') {
      // Get active copy relationships (use database user ID)
      const { count: copyCount } = await supabase
        .from('copy_relationships')
        .select('id', { count: 'exact' })
        .eq('follower_id', user.id)
        .eq('status', 'active');

      stats = {
        ...stats,
        activeCopies: copyCount || 0,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch portfolio stats',
      },
      { status: 500 }
    );
  }
}
