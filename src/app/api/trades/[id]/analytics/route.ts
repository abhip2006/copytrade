/**
 * Trade Analytics API - Get comprehensive analytics for a specific trade
 * GET /api/trades/[id]/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';

interface TradeAnalytics {
  // Basic Trade Info
  tradeId: string;
  symbol: string;
  description: string;
  action: 'BUY' | 'SELL';
  status: string;

  // Entry Details
  entryDate: string;
  entryPrice: number;
  units: number;
  entryValue: number;

  // Exit Details (if closed)
  exitDate?: string;
  exitPrice?: number;
  exitValue?: number;

  // P&L Breakdown
  grossPL?: number;
  fees: number;
  netPL?: number;
  returnPercent?: number;

  // Execution Quality
  orderType: string;
  limitPrice?: number;
  slippage?: number;
  fillRate: number;

  // Time Metrics
  holdDuration?: number; // in hours
  executionTime?: number; // time from order to fill in seconds

  // Position Sizing
  portfolioValueAtEntry?: number;
  positionSizePercent?: number;

  // Current Position (if still open)
  currentPrice?: number;
  currentValue?: number;
  unrealizedPL?: number;

  // Market Context
  marketHours: boolean;

  // Related Orders (stop loss, take profit)
  relatedOrders?: any[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: orderId } = await params;

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

    // Fetch all orders to find the specific one
    const ordersResponse = await fetch(
      `https://api.snaptrade.com/api/v1/accounts/${user.snaptrade_account_id}/orders?userId=${user.snaptrade_user_id}&userSecret=${user.snaptrade_user_secret}`,
      {
        method: 'GET',
        headers: {
          'ConsumerKey': process.env.SNAPTRADE_CONSUMER_KEY!,
        },
      }
    );

    if (!ordersResponse.ok) {
      throw new Error('Failed to fetch orders');
    }

    const orders = await ordersResponse.json();
    const order = orders.find((o: any) => o.id === orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get account activities for fee and execution details
    const activities = await snaptradeService.getAccountActivities(
      user.snaptrade_user_id,
      user.snaptrade_user_secret,
      user.snaptrade_account_id
    );

    // Find matching activity
    const matchingActivity = activities.find(
      (a) => a.symbol?.id === order.symbol?.id &&
      Math.abs(new Date(a.trade_date).getTime() - new Date(order.time_executed || order.time_placed).getTime()) < 60000
    );

    // Get current position to calculate unrealized P&L if order is still open
    let currentPosition = null;
    let currentPrice = null;

    if (order.status === 'EXECUTED' && order.action === 'BUY') {
      try {
        const positions = await snaptradeService.getAccountPositions(
          user.snaptrade_user_id,
          user.snaptrade_user_secret,
          user.snaptrade_account_id
        );

        currentPosition = positions.find(
          (p) => p.symbol?.id === order.symbol?.id
        );

        if (currentPosition) {
          currentPrice = currentPosition.price;
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    }

    // Get portfolio value at entry for position sizing
    let portfolioValueAtEntry = null;
    try {
      const holdings = await snaptradeService.getAllHoldings(
        user.snaptrade_user_id,
        user.snaptrade_user_secret,
        user.snaptrade_account_id
      );
      portfolioValueAtEntry = holdings.total_value?.amount || null;
    } catch (error) {
      console.error('Error fetching holdings:', error);
    }

    // Calculate metrics
    const entryPrice = order.executed_price || order.price || 0;
    const units = order.filled_units || order.units || 0;
    const entryValue = entryPrice * units;
    const fees = matchingActivity?.fee || 0;

    // Calculate P&L if we have exit data
    let grossPL, netPL, returnPercent, exitPrice, exitValue;
    if (order.status === 'EXECUTED' && currentPrice && order.action === 'BUY') {
      exitPrice = currentPrice;
      exitValue = exitPrice * units;
      grossPL = exitValue - entryValue;
      netPL = grossPL - fees;
      returnPercent = (netPL / entryValue) * 100;
    }

    // Calculate slippage if limit order
    let slippage = null;
    if (order.order_type === 'Limit' && order.limit_price) {
      slippage = ((entryPrice - order.limit_price) / order.limit_price) * 100;
    }

    // Calculate fill rate
    const fillRate = order.units > 0 ? (order.filled_units / order.units) * 100 : 0;

    // Calculate hold duration
    let holdDuration = null;
    if (order.time_executed && order.status === 'EXECUTED') {
      const entryTime = new Date(order.time_executed).getTime();
      const currentTime = new Date().getTime();
      holdDuration = (currentTime - entryTime) / (1000 * 60 * 60); // in hours
    }

    // Calculate execution time (order to fill)
    let executionTime = null;
    if (order.time_placed && order.time_executed) {
      const placedTime = new Date(order.time_placed).getTime();
      const executedTime = new Date(order.time_executed).getTime();
      executionTime = (executedTime - placedTime) / 1000; // in seconds
    }

    // Position sizing
    const positionSizePercent = portfolioValueAtEntry
      ? (entryValue / portfolioValueAtEntry) * 100
      : null;

    // Check if trade was during market hours (rough estimate: 9:30 AM - 4:00 PM ET)
    const tradeTime = new Date(order.time_placed);
    const tradeHour = tradeTime.getUTCHours() - 5; // Convert to EST
    const marketHours = tradeHour >= 9.5 && tradeHour < 16;

    const analytics: TradeAnalytics = {
      tradeId: order.id,
      symbol: order.symbol?.symbol || '',
      description: order.symbol?.description || '',
      action: order.action,
      status: order.status,

      entryDate: order.time_placed,
      entryPrice,
      units,
      entryValue,

      exitDate: order.time_executed || undefined,
      exitPrice,
      exitValue,

      grossPL,
      fees,
      netPL,
      returnPercent,

      orderType: order.order_type,
      limitPrice: order.limit_price,
      slippage,
      fillRate,

      holdDuration,
      executionTime,

      portfolioValueAtEntry,
      positionSizePercent,

      currentPrice,
      currentValue: currentPrice ? currentPrice * units : undefined,
      unrealizedPL: currentPrice ? (currentPrice * units) - entryValue - fees : undefined,

      marketHours,

      relatedOrders: [], // TODO: Implement related orders detection
    };

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Trade analytics error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch trade analytics',
      },
      { status: 500 }
    );
  }
}
