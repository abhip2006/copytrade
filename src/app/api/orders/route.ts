/**
 * Orders API - Get user account orders from SnapTrade
 * GET /api/orders
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
    const state = searchParams.get('state'); // Optional filter: 'open', 'executed', 'cancelled'

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

    // Build query parameters
    const params = new URLSearchParams({
      userId: user.snaptrade_user_id,
      userSecret: user.snaptrade_user_secret,
    });

    if (state) {
      params.append('state', state);
    }

    // Fetch orders from SnapTrade
    const response = await fetch(
      `https://api.snaptrade.com/api/v1/accounts/${user.snaptrade_account_id}/orders?${params}`,
      {
        method: 'GET',
        headers: {
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch orders');
    }

    const orders = await response.json();

    // Format orders for frontend
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      symbol: order.symbol?.symbol || '',
      symbolId: order.symbol?.id || '',
      description: order.symbol?.description || '',
      action: order.action,
      orderType: order.order_type,
      status: order.status,
      units: order.units,
      filledUnits: order.filled_units || 0,
      openUnits: order.open_units || 0,
      canceledUnits: order.canceled_units || 0,
      price: order.price,
      limitPrice: order.limit_price,
      stopPrice: order.stop_price,
      executedPrice: order.executed_price,
      timeInForce: order.time_in_force,
      timePlaced: order.time_placed,
      timeUpdated: order.time_updated,
      timeExecuted: order.time_executed,
      exchangeOrderId: order.exchange_order_id,
    }));

    return NextResponse.json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
      },
      { status: 500 }
    );
  }
}
