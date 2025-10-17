/**
 * Cron Job: Monitor Positions
 * Called by Vercel Cron every 30 seconds
 * Monitors open positions for stop-loss and take-profit triggers
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PositionWithRisk {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  avg_cost: number;
  current_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  snaptrade_user_id: string;
  snaptrade_user_secret: string;
  snaptrade_account_id: string;
  universal_symbol_id: string;
}

/**
 * Check if position should be closed based on SL/TP
 */
function shouldClosePosition(position: PositionWithRisk): {
  shouldClose: boolean;
  reason: string | null;
  triggerPrice: number | null;
} {
  const currentPrice = position.current_price;

  // Check stop-loss
  if (position.stop_loss && currentPrice <= position.stop_loss) {
    return {
      shouldClose: true,
      reason: 'stop_loss',
      triggerPrice: position.stop_loss,
    };
  }

  // Check take-profit
  if (position.take_profit && currentPrice >= position.take_profit) {
    return {
      shouldClose: true,
      reason: 'take_profit',
      triggerPrice: position.take_profit,
    };
  }

  return { shouldClose: false, reason: null, triggerPrice: null };
}

/**
 * Close a position via SnapTrade
 */
async function closePosition(position: PositionWithRisk, reason: string) {
  try {
    console.log(`[SL/TP] Closing position ${position.symbol} - ${reason}`);

    // Step 1: Check trade impact
    const impact = await snaptradeService.checkTradeImpact(
      position.snaptrade_user_id,
      position.snaptrade_user_secret,
      position.snaptrade_account_id,
      'SELL',
      position.universal_symbol_id,
      'Market',
      Math.abs(position.quantity)
    );

    if (!impact.trade?.id) {
      throw new Error('Failed to get trade impact');
    }

    // Step 2: Execute trade
    const order = await snaptradeService.placeOrder(
      position.snaptrade_user_id,
      position.snaptrade_user_secret,
      impact.trade.id,
      true // wait for confirmation
    );

    console.log(`[SL/TP] Position closed successfully:`, order);

    return {
      success: true,
      orderId: order.brokerage_order_id,
      executedPrice: order.executed_price,
    };
  } catch (error) {
    console.error(`[SL/TP] Error closing position:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/cron/monitor-positions
 * Vercel Cron calls this endpoint
 */
export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'development';

    // In production, verify the cron secret
    if (process.env.NODE_ENV === 'production') {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.error('Unauthorized cron request');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[CRON] Starting position monitoring...');

    const supabase = await createClient();

    // Get all open positions with stop-loss or take-profit set
    const { data: positions, error } = await supabase
      .from('positions')
      .select(
        `
        id,
        user_id,
        symbol,
        quantity,
        avg_cost,
        current_price,
        stop_loss,
        take_profit,
        universal_symbol_id,
        users!inner (
          snaptrade_user_id,
          snaptrade_user_secret,
          snaptrade_account_id
        )
      `
      )
      .or('stop_loss.not.is.null,take_profit.not.is.null')
      .eq('status', 'open');

    if (error) {
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }

    if (!positions || positions.length === 0) {
      console.log('[CRON] No positions with SL/TP found');
      return NextResponse.json({
        success: true,
        checked: 0,
        triggered: 0,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[CRON] Monitoring ${positions.length} positions`);

    const results = {
      checked: positions.length,
      triggered: 0,
      closed: 0,
      failed: 0,
      details: [] as any[],
    };

    // Check each position
    for (const pos of positions) {
      const position: PositionWithRisk = {
        id: pos.id,
        user_id: pos.user_id,
        symbol: pos.symbol,
        quantity: pos.quantity,
        avg_cost: pos.avg_cost,
        current_price: pos.current_price,
        stop_loss: pos.stop_loss,
        take_profit: pos.take_profit,
        snaptrade_user_id: (pos.users as any).snaptrade_user_id,
        snaptrade_user_secret: (pos.users as any).snaptrade_user_secret,
        snaptrade_account_id: (pos.users as any).snaptrade_account_id,
        universal_symbol_id: pos.universal_symbol_id,
      };

      const check = shouldClosePosition(position);

      if (check.shouldClose) {
        results.triggered++;

        // Close the position
        const closeResult = await closePosition(position, check.reason!);

        if (closeResult.success) {
          results.closed++;

          // Update position status in database
          await supabase
            .from('positions')
            .update({
              status: 'closed',
              exit_reason: check.reason,
              exit_price: closeResult.executedPrice,
              closed_at: new Date().toISOString(),
            })
            .eq('id', position.id);

          results.details.push({
            symbol: position.symbol,
            reason: check.reason,
            triggerPrice: check.triggerPrice,
            executedPrice: closeResult.executedPrice,
            orderId: closeResult.orderId,
          });
        } else {
          results.failed++;

          results.details.push({
            symbol: position.symbol,
            reason: check.reason,
            error: closeResult.error,
          });
        }
      }
    }

    console.log('[CRON] Position monitoring completed:', results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error monitoring positions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to monitor positions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
