/**
 * Trade Execute API - Execute trade after impact check
 * POST /api/trades/execute
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { decryptSnapTradeSecret } from '@/lib/snaptrade/credentials';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tradeId, stopLoss, takeProfit } = body;

    if (!tradeId) {
      return NextResponse.json(
        { error: 'tradeId is required' },
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

    if (userError || !user?.snaptrade_user_id) {
      return NextResponse.json(
        { error: 'SnapTrade account not connected' },
        { status: 400 }
      );
    }

    // Decrypt user secret before using
    const userSecret = decryptSnapTradeSecret(user.snaptrade_user_secret);

    // Execute trade via SnapTrade using the checked order endpoint
    const params = new URLSearchParams({
      userId: user.snaptrade_user_id,
      userSecret: userSecret,
    });

    const response = await fetch(
      `https://api.snaptrade.com/api/v1/trade/${tradeId}?${params}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
        body: JSON.stringify({
          wait_to_confirm: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to execute trade');
    }

    const orderData = await response.json();

    // Get user's UUID for foreign key relationship
    const { data: userData, error: userFetchError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userFetchError || !userData) {
      console.error('Failed to fetch user UUID:', userFetchError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store trade in database
    const { error: insertError } = await supabase
      .from('leader_trades')
      .insert({
        leader_id: userData.id,
        account_id: user.snaptrade_account_id, // Fixed: was snaptrade_account_id
        symbol: orderData.symbol?.symbol || '',
        universal_symbol_id: orderData.symbol?.id || '',
        action: orderData.action?.toLowerCase() || 'buy',
        quantity: orderData.units || 0,
        price: orderData.executed_price, // Fixed: was executed_price
        order_type: orderData.order_type?.toLowerCase() || 'market',
        asset_type: 'stock', // Added: required field
        order_id: orderData.order_id, // Fixed: was snaptrade_order_id
        stop_loss: stopLoss,
        take_profit: takeProfit,
        processed: false, // Added: for copy engine to pick up
        is_exit: false, // Added: required field
        executed_at: orderData.time_placed ? new Date(orderData.time_placed) : new Date(),
        // Removed: limit_price, stop_price, time_in_force, status, snaptrade_trade_id, filled_units (not in schema)
      });

    if (insertError) {
      console.error('Failed to store trade in database:', insertError);
      // Don't fail the request - trade was executed successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        symbol: orderData.symbol,
        action: orderData.action,
        units: orderData.units,
        filledUnits: orderData.filled_units,
        openUnits: orderData.open_units,
        canceledUnits: orderData.canceled_units,
        executedPrice: orderData.executed_price,
        limitPrice: orderData.limit_price,
        stopPrice: orderData.stop_price,
        status: orderData.status,
        orderId: orderData.order_id,
        timePlaced: orderData.time_placed,
      },
    });
  } catch (error) {
    console.error('Trade execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to execute trade',
      },
      { status: 500 }
    );
  }
}
