/**
 * Trade Impact API - Check order impact before execution
 * POST /api/trades/impact
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      asset_type = 'stock',
      action,
      universal_symbol_id,
      order_type,
      time_in_force,
      units,
      price,
      stop,
      // Options-specific fields
      option_action,
      ticker,
      option_type,
      strike_price,
      expiration_date,
      quantity,
    } = body;

    // Validate required fields based on asset type
    if (asset_type === 'stock') {
      if (!action || !universal_symbol_id || !order_type || !time_in_force || !units) {
        return NextResponse.json(
          { error: 'Missing required fields for stock trade' },
          { status: 400 }
        );
      }
    } else if (asset_type === 'option') {
      if (!option_action || !ticker || !option_type || !strike_price || !expiration_date || !order_type || !time_in_force || !quantity) {
        return NextResponse.json(
          { error: 'Missing required fields for option trade' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid asset_type. Must be "stock" or "option"' },
        { status: 400 }
      );
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

    // Build request body based on asset type
    const requestBody: any = {
      userId: user.snaptrade_user_id,
      userSecret: user.snaptrade_user_secret,
      account_id: user.snaptrade_account_id,
      order_type,
      time_in_force,
    };

    if (asset_type === 'stock') {
      // Stock trade
      requestBody.action = action;
      requestBody.universal_symbol_id = universal_symbol_id;
      requestBody.units = units;
      if (price) requestBody.price = price;
      if (stop) requestBody.stop = stop;
    } else {
      // Option trade
      requestBody.option_action = option_action;
      requestBody.ticker = ticker;
      requestBody.option_type = option_type;
      requestBody.strike_price = strike_price;
      requestBody.expiration_date = expiration_date;
      requestBody.quantity = quantity;
      if (price) requestBody.price = price;
    }

    // Check trade impact via SnapTrade
    const response = await fetch(
      'https://api.snaptrade.com/api/v1/trade/impact',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to check trade impact');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        tradeId: data.trade.id,
        trade: data.trade,
        tradeImpacts: data.trade_impacts,
      },
    });
  } catch (error) {
    console.error('Trade impact check error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to check trade impact',
      },
      { status: 500 }
    );
  }
}
