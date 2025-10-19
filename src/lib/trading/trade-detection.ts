/**
 * Trade Detection Service
 * Detects trades by comparing position snapshots
 * Converted from Python implementation
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';
import { decryptSnapTradeSecret } from '@/lib/snaptrade/credentials';
import type { Database } from '@/lib/supabase/types';

type User = Database['public']['Tables']['users']['Row'];
type BrokerageConnection = Database['public']['Tables']['brokerage_connections']['Row'];
type PositionSnapshot = any; // Database['public']['Tables']['position_snapshots']['Row'];

interface NormalizedPositions {
  [symbol: string]: number; // symbol -> quantity
}

interface DetectedTrade {
  symbol: string;
  action: 'buy' | 'sell';
  quantity: number;
  isExit: boolean;
}

export class TradeDetector {
  /**
   * Normalize positions from SnapTrade API response to { symbol: quantity } format
   */
  normalizePositions(positions: any[]): NormalizedPositions {
    const normalized: NormalizedPositions = {};

    for (const position of positions) {
      const symbol = position.symbol?.symbol || position.symbol;
      const quantity = position.units || position.quantity || 0;

      if (symbol) {
        normalized[symbol] = Number(quantity);
      }
    }

    return normalized;
  }

  /**
   * Get the last position snapshot for an account
   */
  async getLastSnapshot(userId: string, accountId: string): Promise<PositionSnapshot | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('position_snapshots')
      .select('*')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No previous snapshot is okay for first run
      return null;
    }

    return data;
  }

  /**
   * Save a new position snapshot
   */
  async saveSnapshot(userId: string, accountId: string, positions: NormalizedPositions): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from('position_snapshots').insert({
      user_id: userId,
      account_id: accountId,
      positions,
    });

    if (error) {
      console.error('Error saving position snapshot:', error);
    }
  }

  /**
   * Detect trades by comparing current positions with last snapshot
   */
  detectTrades(
    currentPositions: NormalizedPositions,
    lastPositions: NormalizedPositions
  ): DetectedTrade[] {
    const trades: DetectedTrade[] = [];

    // Get all unique symbols
    const allSymbols = new Set([
      ...Object.keys(currentPositions),
      ...Object.keys(lastPositions),
    ]);

    for (const symbol of allSymbols) {
      const currentQty = currentPositions[symbol] || 0;
      const lastQty = lastPositions[symbol] || 0;

      if (currentQty === lastQty) {
        // No change
        continue;
      }

      if (currentQty > lastQty) {
        // Position increased = BUY
        trades.push({
          symbol,
          action: 'buy',
          quantity: currentQty - lastQty,
          isExit: false,
        });
      } else if (currentQty < lastQty) {
        // Position decreased = SELL
        const isExit = currentQty === 0; // Completely closed position
        trades.push({
          symbol,
          action: 'sell',
          quantity: lastQty - currentQty,
          isExit,
        });
      }
    }

    return trades;
  }

  /**
   * Detect trades for a specific account
   */
  async detectTradesForAccount(user: User, account: BrokerageConnection): Promise<DetectedTrade[]> {
    try {
      // Decrypt user secret
      const userSecret = decryptSnapTradeSecret(user.snaptrade_user_secret!);

      // Fetch current positions from SnapTrade
      const currentPositionsRaw = await snaptradeService.getAccountPositions(
        user.snaptrade_user_id!,
        userSecret,
        account.account_id
      );

      // Normalize positions
      const currentPositions = this.normalizePositions(currentPositionsRaw);

      // Get last snapshot
      const lastSnapshot = await this.getLastSnapshot(user.id, account.account_id);
      const lastPositions: NormalizedPositions = lastSnapshot?.positions || {};

      // Detect trades
      const trades = this.detectTrades(currentPositions, lastPositions);

      // Save new snapshot
      await this.saveSnapshot(user.id, account.account_id, currentPositions);

      return trades;
    } catch (error) {
      console.error(`Error detecting trades for account ${account.account_id}:`, error);
      return [];
    }
  }

  /**
   * Create trade records in the database
   */
  async createTradeRecords(userId: string, accountId: string, trades: DetectedTrade[]): Promise<void> {
    if (trades.length === 0) {
      return;
    }

    const supabase = createServiceRoleClient();

    const tradeRecords = trades.map((trade) => ({
      leader_id: userId,
      account_id: accountId,
      symbol: trade.symbol,
      action: trade.action,
      quantity: trade.quantity,
      processed: false,
      is_exit: trade.isExit,
      detected_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('leader_trades').insert(tradeRecords);

    if (error) {
      console.error('Error creating trade records:', error);
    } else {
      console.info(`Created ${trades.length} trade records for user ${userId}`);
    }
  }

  /**
   * Poll all active leaders for trades
   */
  async pollAllLeaders(): Promise<{ leadersPolled: number; tradesDetected: number }> {
    const supabase = createServiceRoleClient();

    // Get all users who are leaders
    const { data: leaders, error } = await supabase
      .from('users')
      .select('*')
      .in('role', ['leader', 'both'])
      .not('snaptrade_user_id', 'is', null);

    if (error || !leaders) {
      console.error('Error fetching leaders:', error);
      return { leadersPolled: 0, tradesDetected: 0 };
    }

    let totalTrades = 0;

    for (const leader of leaders) {
      // Get leader's brokerage connections
      const { data: connections } = await supabase
        .from('brokerage_connections')
        .select('*')
        .eq('user_id', leader.id)
        .eq('status', 'active');

      if (!connections || connections.length === 0) {
        continue;
      }

      for (const connection of connections) {
        const trades = await this.detectTradesForAccount(leader, connection);

        if (trades.length > 0) {
          await this.createTradeRecords(leader.id, connection.account_id, trades);
          totalTrades += trades.length;

          console.info(
            `Detected ${trades.length} trades for leader ${leader.id} (${leader.full_name || 'Unknown'})`
          );
        }
      }
    }

    return {
      leadersPolled: leaders.length,
      tradesDetected: totalTrades,
    };
  }
}

// Export singleton instance
export const tradeDetector = new TradeDetector();
export default tradeDetector;
