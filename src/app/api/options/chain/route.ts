/**
 * Options Chain API - Get options chain for a symbol
 * GET /api/options/chain?ticker=AAPL
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
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json(
        { error: 'ticker parameter is required' },
        { status: 400 }
      );
    }

    // Get user's SnapTrade credentials
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('snaptrade_user_id, snaptrade_user_secret')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user?.snaptrade_user_id || !user?.snaptrade_user_secret) {
      return NextResponse.json(
        { error: 'SnapTrade account not connected' },
        { status: 400 }
      );
    }

    // Get options chain from SnapTrade
    const params = new URLSearchParams({
      userId: user.snaptrade_user_id,
      userSecret: user.snaptrade_user_secret,
    });

    const response = await fetch(
      `https://api.snaptrade.com/api/v1/options/chain?ticker=${encodeURIComponent(ticker)}&${params}`,
      {
        headers: {
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch options chain');
    }

    const optionsChain = await response.json();

    // Format response
    const formattedChain = optionsChain.map((option: any) => ({
      symbol: option.symbol,
      strike_price: option.strike_price,
      expiration_date: option.expiration_date,
      option_type: option.option_type, // 'CALL' or 'PUT'
      bid: option.bid,
      ask: option.ask,
      last_price: option.last_trade_price,
      volume: option.volume,
      open_interest: option.open_interest,
      implied_volatility: option.implied_volatility,
      delta: option.greeks?.delta,
      gamma: option.greeks?.gamma,
      theta: option.greeks?.theta,
      vega: option.greeks?.vega,
    }));

    return NextResponse.json({
      success: true,
      data: formattedChain,
    });
  } catch (error) {
    console.error('Options chain error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch options chain',
      },
      { status: 500 }
    );
  }
}
