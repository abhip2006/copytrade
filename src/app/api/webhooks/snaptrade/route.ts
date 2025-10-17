/**
 * SnapTrade Webhook Handler
 * Receives and processes real-time trade and account events from SnapTrade
 *
 * Webhook events:
 * - TRADES_PLACED: Trade executed (primary - near real-time)
 * - ACCOUNT_HOLDINGS_UPDATED: Holdings changed
 *
 * Configure your webhook URL in SnapTrade Dashboard:
 * POST {YOUR_DOMAIN}/api/webhooks/snaptrade
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  SnapTradeEventType,
  SnapTradeWebhookPayload,
  WebhookTradeData,
  verifySnapTradeWebhook,
  processTradesPlacedEvent,
  processAccountHoldingsUpdatedEvent,
} from '@/lib/snaptrade/webhooks';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.SNAPTRADE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[WEBHOOK] SNAPTRADE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Get request body
    const body = await request.text();

    // Verify webhook signature
    if (!verifySnapTradeWebhook(body, webhookSecret)) {
      console.error('[WEBHOOK] Invalid webhook signature or secret');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the payload
    let payload: SnapTradeWebhookPayload;
    try {
      payload = JSON.parse(body) as SnapTradeWebhookPayload;
    } catch (error) {
      console.error('[WEBHOOK] Failed to parse webhook payload:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    console.log(`[WEBHOOK] Received ${payload.eventType} event`, {
      webhookId: payload.webhookId,
      userId: payload.userId,
      timestamp: payload.eventTimestamp,
    });

    // Route to appropriate handler based on event type
    switch (payload.eventType) {
      case SnapTradeEventType.TRADES_PLACED:
        return await handleTradesPlaced(payload);

      case SnapTradeEventType.ACCOUNT_HOLDINGS_UPDATED:
        return await handleAccountHoldingsUpdated(payload);

      case SnapTradeEventType.CONNECTION_ADDED:
        return await handleConnectionAdded(payload);

      case SnapTradeEventType.CONNECTION_DELETED:
        return await handleConnectionDeleted(payload);

      case SnapTradeEventType.CONNECTION_FAILED:
        return await handleConnectionFailed(payload);

      // Other events are logged but not actively processed
      default:
        console.log(`[WEBHOOK] Event type '${payload.eventType}' received but not processed`);
        return NextResponse.json({
          success: true,
          message: 'Event received and acknowledged',
          eventType: payload.eventType,
        });
    }
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error in webhook handler:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle TRADES_PLACED event
 * This is the primary event for real-time trade detection
 */
async function handleTradesPlaced(payload: SnapTradeWebhookPayload) {
  try {
    console.log('[WEBHOOK] Processing TRADES_PLACED event');

    // Extract trade data from webhook details
    // The structure may vary, but typically includes trades array or individual trade fields
    let trades: WebhookTradeData[] = [];

    if (payload.details) {
      // If trades is an array
      if (Array.isArray(payload.details.trades)) {
        trades = payload.details.trades as WebhookTradeData[];
      }
      // If it's a single trade
      else if (payload.details.symbol && payload.details.action) {
        trades = [
          {
            symbol: payload.details.symbol,
            action: payload.details.action.toUpperCase() as 'BUY' | 'SELL',
            quantity: payload.details.quantity || 1,
            price: payload.details.price,
            orderType: payload.details.orderType,
            assetType: payload.details.assetType,
            orderId: payload.details.orderId,
            timestamp: payload.details.timestamp,
          } as WebhookTradeData,
        ];
      }
    }

    if (trades.length === 0) {
      console.warn('[WEBHOOK] No trades found in TRADES_PLACED event details');
      return NextResponse.json({
        success: true,
        message: 'No trades to process',
        eventType: SnapTradeEventType.TRADES_PLACED,
      });
    }

    console.log(`[WEBHOOK] Processing ${trades.length} trades from TRADES_PLACED event`);

    // Process trades and feed them into the copy engine
    const result = await processTradesPlacedEvent(payload, trades);

    return NextResponse.json({
      success: true,
      message: 'Trades processed successfully',
      eventType: SnapTradeEventType.TRADES_PLACED,
      result,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error handling TRADES_PLACED event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process trades',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle ACCOUNT_HOLDINGS_UPDATED event
 * Used for supplementary/fallback detection
 */
async function handleAccountHoldingsUpdated(payload: SnapTradeWebhookPayload) {
  try {
    console.log('[WEBHOOK] Processing ACCOUNT_HOLDINGS_UPDATED event');

    await processAccountHoldingsUpdatedEvent(payload);

    return NextResponse.json({
      success: true,
      message: 'Holdings update processed',
      eventType: SnapTradeEventType.ACCOUNT_HOLDINGS_UPDATED,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error handling ACCOUNT_HOLDINGS_UPDATED event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process holdings update',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CONNECTION_ADDED event
 * Log when a brokerage connection is established
 */
async function handleConnectionAdded(payload: SnapTradeWebhookPayload) {
  try {
    console.log('[WEBHOOK] Brokerage connection added for user:', payload.userId, {
      details: payload.details,
    });

    return NextResponse.json({
      success: true,
      message: 'Connection logged',
      eventType: SnapTradeEventType.CONNECTION_ADDED,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error handling CONNECTION_ADDED event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle connection event',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CONNECTION_DELETED event
 * Log when a brokerage connection is removed
 */
async function handleConnectionDeleted(payload: SnapTradeWebhookPayload) {
  try {
    console.log('[WEBHOOK] Brokerage connection deleted for user:', payload.userId, {
      details: payload.details,
    });

    return NextResponse.json({
      success: true,
      message: 'Disconnection logged',
      eventType: SnapTradeEventType.CONNECTION_DELETED,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error handling CONNECTION_DELETED event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle disconnection event',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle CONNECTION_FAILED event
 * Alert when connection has issues
 */
async function handleConnectionFailed(payload: SnapTradeWebhookPayload) {
  try {
    console.warn('[WEBHOOK] Brokerage connection failed for user:', payload.userId, {
      details: payload.details,
    });

    // Could trigger notification to user here
    // For now, just log it

    return NextResponse.json({
      success: true,
      message: 'Connection failure logged',
      eventType: SnapTradeEventType.CONNECTION_FAILED,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error handling CONNECTION_FAILED event:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle connection failure',
      },
      { status: 500 }
    );
  }
}
