/**
 * Positions API - Get user's open positions
 * GET /api/positions
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

    // Get user's SnapTrade credentials
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_user_secret, snaptrade_account_id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user?.snaptrade_user_id || !user?.snaptrade_account_id) {
      return NextResponse.json(
        { error: 'SnapTrade account not connected' },
        { status: 400 }
      );
    }

    // Get positions from SnapTrade
    const params = new URLSearchParams({
      userId: user.snaptrade_user_id,
      userSecret: user.snaptrade_user_secret,
    });

    const response = await fetch(
      `https://api.snaptrade.com/api/v1/accounts/${user.snaptrade_account_id}/positions?${params}`,
      {
        headers: {
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch positions from SnapTrade');
    }

    const positions = await response.json();

    // Format positions
    const formattedPositions = positions.map((pos: any) => {
      const pnl = pos.open_pnl || 0;
      const costBasis = (pos.units || 0) * (pos.average_purchase_price || 0);
      const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

      return {
        id: pos.symbol?.id || Math.random().toString(),
        symbol: pos.symbol?.symbol || '',
        quantity: pos.units || 0,
        avg_cost: pos.average_purchase_price || 0,
        current_price: pos.price || 0,
        current_value: (pos.units || 0) * (pos.price || 0),
        unrealized_pnl: pnl,
        unrealized_pnl_percent: pnlPercent,
        stop_loss: null, // TODO: Get from database if set
        take_profit: null, // TODO: Get from database if set
        opened_at: new Date().toISOString(), // TODO: Get actual date
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPositions,
    });
  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}
