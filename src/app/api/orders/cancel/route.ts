/**
 * Cancel Order API - Cancel an open order via SnapTrade
 * POST /api/orders/cancel
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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
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

    // Cancel order via SnapTrade
    const params = new URLSearchParams({
      userId: user.snaptrade_user_id,
      userSecret: user.snaptrade_user_secret,
    });

    const response = await fetch(
      `https://api.snaptrade.com/api/v1/accounts/${user.snaptrade_account_id}/orders/cancel?${params}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
        body: JSON.stringify({
          brokerage_order_id: orderId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to cancel order');
    }

    const cancelResult = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        orderId: cancelResult.id,
        symbol: cancelResult.symbol?.symbol || '',
        status: cancelResult.status,
        message: 'Order cancelled successfully',
      },
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to cancel order',
      },
      { status: 500 }
    );
  }
}
