/**
 * Replace Order API - Replace an existing order via SnapTrade
 * POST /api/orders/replace
 *
 * Note: This endpoint is for leaders only. The UI should redirect to the trade interface
 * with pre-filled data from the existing order, then the new order can be placed while
 * the old one is cancelled.
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
      orderId,
      orderType,
      timeInForce,
      price,
      stop,
      units,
    } = body;

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

    // Verify user is a leader (has leader account type)
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('account_type')
      .eq('clerk_user_id', userId)
      .single();

    if (roleError || userRole?.account_type !== 'leader') {
      return NextResponse.json(
        { error: 'Only leaders can replace orders' },
        { status: 403 }
      );
    }

    // Build request body for replace order
    const requestBody: any = {
      brokerage_order_id: orderId,
    };

    if (orderType) requestBody.order_type = orderType;
    if (timeInForce) requestBody.time_in_force = timeInForce;
    if (price !== undefined) requestBody.price = price;
    if (stop !== undefined) requestBody.stop = stop;
    if (units !== undefined) requestBody.units = units;

    // Replace order via SnapTrade
    const params = new URLSearchParams({
      userId: user.snaptrade_user_id,
      userSecret: user.snaptrade_user_secret,
    });

    const response = await fetch(
      `https://api.snaptrade.com/api/v1/accounts/${user.snaptrade_account_id}/orders/replace?${params}`,
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
      throw new Error(errorData.detail || 'Failed to replace order');
    }

    const replaceResult = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        orderId: replaceResult.id,
        symbol: replaceResult.symbol?.symbol || '',
        status: replaceResult.status,
        message: 'Order replaced successfully',
      },
    });
  } catch (error) {
    console.error('Replace order error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to replace order',
      },
      { status: 500 }
    );
  }
}
