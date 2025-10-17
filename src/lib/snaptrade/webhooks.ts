/**
 * SnapTrade Webhook Service
 * Handles verification and processing of SnapTrade webhook events
 */

import crypto from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type LeaderTradesInsert = Database['public']['Tables']['leader_trades']['Insert'];

/**
 * SnapTrade webhook event types
 */
export enum SnapTradeEventType {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_DELETED = 'USER_DELETED',
  CONNECTION_ATTEMPTED = 'CONNECTION_ATTEMPTED',
  CONNECTION_ADDED = 'CONNECTION_ADDED',
  CONNECTION_DELETED = 'CONNECTION_DELETED',
  CONNECTION_BROKEN = 'CONNECTION_BROKEN',
  CONNECTION_FIXED = 'CONNECTION_FIXED',
  CONNECTION_UPDATED = 'CONNECTION_UPDATED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  NEW_ACCOUNT_AVAILABLE = 'NEW_ACCOUNT_AVAILABLE',
  ACCOUNT_REMOVED = 'ACCOUNT_REMOVED',
  ACCOUNT_TRANSACTIONS_INITIAL_UPDATE = 'ACCOUNT_TRANSACTIONS_INITIAL_UPDATE',
  ACCOUNT_TRANSACTIONS_UPDATED = 'ACCOUNT_TRANSACTIONS_UPDATED',
  ACCOUNT_HOLDINGS_UPDATED = 'ACCOUNT_HOLDINGS_UPDATED',
  TRADES_PLACED = 'TRADES_PLACED',
}

/**
 * SnapTrade webhook payload structure
 */
export interface SnapTradeWebhookPayload {
  webhookId: string;
  clientId: string;
  userId: string;
  eventType: SnapTradeEventType;
  eventTimestamp: string;
  webhookSecret: string;
  details?: Record<string, any>;
}

/**
 * Trade data from TRADES_PLACED webhook
 */
export interface WebhookTradeData {
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  orderType?: string;
  assetType?: 'stock' | 'option' | 'etf' | 'crypto';
  optionType?: 'call' | 'put' | null;
  strikePrice?: number | null;
  expirationDate?: string | null;
  contracts?: number | null;
  orderId?: string;
  timestamp?: string;
}

/**
 * Verify SnapTrade webhook signature
 * @param payload - The raw webhook payload as string
 * @param webhookSecret - The webhook secret from SnapTrade Dashboard
 * @param headers - Request headers from webhook
 * @returns true if webhook is authentic
 */
export function verifySnapTradeWebhook(
  payload: string,
  webhookSecret: string,
  headers?: Record<string, string>
): boolean {
  try {
    // SnapTrade uses webhookSecret field in the payload itself for verification
    // Additional verification can be implemented if SnapTrade provides signature headers
    const jsonPayload = JSON.parse(payload);
    const providedSecret = jsonPayload.webhookSecret;

    // Verify the webhook secret matches
    if (providedSecret !== webhookSecret) {
      console.error('[WEBHOOK] Invalid webhook secret');
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WEBHOOK] Error verifying webhook:', error);
    return false;
  }
}

/**
 * Check if a trade already exists (deduplication)
 * Prevents duplicate trade records from being created
 */
export async function checkTradeExists(
  leaderId: string,
  symbol: string,
  action: string,
  quantity: number,
  detectedAt: string,
  windowMinutes: number = 5
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();

    // Look for trades detected in the last N minutes
    const cutoffTime = new Date(new Date(detectedAt).getTime() - windowMinutes * 60000).toISOString();

    const { data, error } = await supabase
      .from('leader_trades')
      .select('id')
      .eq('leader_id', leaderId)
      .eq('symbol', symbol)
      .eq('action', action.toLowerCase())
      .eq('quantity', quantity)
      .gte('detected_at', cutoffTime)
      .lte('detected_at', detectedAt)
      .limit(1);

    if (error) {
      console.error('[WEBHOOK] Error checking for duplicate trades:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('[WEBHOOK] Error in checkTradeExists:', error);
    return false;
  }
}

/**
 * Create a leader trade record from webhook data
 * This feeds trades into the copy engine for processing
 */
export async function createTradeFromWebhook(
  leaderId: string,
  accountId: string,
  tradeData: WebhookTradeData
): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    // Check for duplicates
    const isDuplicate = await checkTradeExists(
      leaderId,
      tradeData.symbol,
      tradeData.action,
      tradeData.quantity,
      now,
      5 // 5 minute window
    );

    if (isDuplicate) {
      console.log(
        `[WEBHOOK] Duplicate trade detected for ${leaderId} - ${tradeData.symbol} ${tradeData.action} ${tradeData.quantity}`
      );
      return null;
    }

    // Prepare trade record
    const tradeRecord: LeaderTradesInsert = {
      leader_id: leaderId,
      account_id: accountId,
      symbol: tradeData.symbol,
      action: (tradeData.action.toLowerCase() as 'buy' | 'sell'),
      quantity: tradeData.quantity,
      price: tradeData.price || null,
      order_type: tradeData.orderType || 'market',
      asset_type: (tradeData.assetType || 'stock') as 'stock' | 'option' | 'etf' | 'crypto',
      option_type: tradeData.optionType || null,
      strike_price: tradeData.strikePrice || null,
      expiration_date: tradeData.expirationDate || null,
      contracts: tradeData.contracts || null,
      order_id: tradeData.orderId || null,
      processed: false, // Will be processed by the copy engine
      is_exit: false, // Webhook doesn't indicate if it's an exit, copy engine will determine
      detected_at: now,
    };

    // Insert the trade record
    const { data, error } = await supabase
      .from('leader_trades')
      .insert(tradeRecord)
      .select('id')
      .single();

    if (error) {
      console.error('[WEBHOOK] Error creating trade record:', error);
      return null;
    }

    console.log(
      `[WEBHOOK] Trade created successfully: ${leaderId} - ${tradeData.symbol} ${tradeData.action} ${tradeData.quantity}`,
      { tradeId: data?.id }
    );

    return data?.id || null;
  } catch (error) {
    console.error('[WEBHOOK] Error in createTradeFromWebhook:', error);
    return null;
  }
}

/**
 * Get leader info by SnapTrade user ID
 * Maps SnapTrade userId to our database leader_id
 */
export async function getLeaderBySnapTradeUserId(
  snapTradeUserId: string
): Promise<{ id: string; full_name: string | null } | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('snaptrade_user_id', snapTradeUserId)
      .eq('role', 'leader')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is okay, user might not be a leader
        console.log(`[WEBHOOK] No leader found for SnapTrade user ${snapTradeUserId}`);
        return null;
      }
      console.error('[WEBHOOK] Error fetching leader:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[WEBHOOK] Error in getLeaderBySnapTradeUserId:', error);
    return null;
  }
}

/**
 * Get brokerage account by account ID
 */
export async function getAccountBySnaptTradeId(
  accountId: string
): Promise<{ id: string; user_id: string } | null> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('brokerage_connections')
      .select('id, user_id')
      .eq('account_id', accountId)
      .single();

    if (error) {
      console.log(`[WEBHOOK] Account not found: ${accountId}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[WEBHOOK] Error in getAccountBySnaptTradeId:', error);
    return null;
  }
}

/**
 * Process TRADES_PLACED webhook event
 * This is the main entry point for trade processing
 */
export async function processTradesPlacedEvent(
  webhookPayload: SnapTradeWebhookPayload,
  tradesData: WebhookTradeData[]
): Promise<{
  processed: number;
  skipped: number;
  errors: number;
}> {
  const result = { processed: 0, skipped: 0, errors: 0 };

  try {
    const snapTradeUserId = webhookPayload.userId;

    // Get the leader from our database
    const leader = await getLeaderBySnapTradeUserId(snapTradeUserId);
    if (!leader) {
      console.log(`[WEBHOOK] Skipping trades - leader not found for user ${snapTradeUserId}`);
      result.skipped = tradesData.length;
      return result;
    }

    console.log(
      `[WEBHOOK] Processing ${tradesData.length} trades for leader ${leader.full_name} (${leader.id})`
    );

    // Get the account from webhook details if available
    const accountId = webhookPayload.details?.accountId || webhookPayload.details?.account_id;

    if (!accountId) {
      console.warn('[WEBHOOK] No account ID in webhook details, using default');
    }

    // Process each trade
    for (const trade of tradesData) {
      try {
        const tradeId = await createTradeFromWebhook(leader.id, accountId || 'unknown', trade);

        if (tradeId) {
          result.processed++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        console.error(`[WEBHOOK] Error processing trade:`, error);
        result.errors++;
      }
    }

    console.log(`[WEBHOOK] Trade processing complete:`, result);
    return result;
  } catch (error) {
    console.error('[WEBHOOK] Error in processTradesPlacedEvent:', error);
    result.errors = tradesData.length;
    return result;
  }
}

/**
 * Process ACCOUNT_HOLDINGS_UPDATED webhook event
 * Can be used as fallback or supplementary detection
 */
export async function processAccountHoldingsUpdatedEvent(
  webhookPayload: SnapTradeWebhookPayload
): Promise<void> {
  try {
    const snapTradeUserId = webhookPayload.userId;
    const leader = await getLeaderBySnapTradeUserId(snapTradeUserId);

    if (!leader) {
      console.log(`[WEBHOOK] Skipping holdings update - leader not found for user ${snapTradeUserId}`);
      return;
    }

    console.log(
      `[WEBHOOK] Holdings updated for leader ${leader.full_name} (${leader.id})`,
      webhookPayload.details
    );

    // Holdings updates are supplementary - the main trade detection
    // happens via TRADES_PLACED. We could use this for validation.
  } catch (error) {
    console.error('[WEBHOOK] Error in processAccountHoldingsUpdatedEvent:', error);
  }
}
