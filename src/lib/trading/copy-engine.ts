/**
 * Copy Trade Engine
 * Converted from Python implementation
 * Executes copy trades for followers when leaders trade
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { snaptradeService } from '@/lib/snaptrade/client';
import { positionSizingCalculator } from './position-sizing';
import { tradeFilterService, type PositionData } from './trade-filters';
import { decryptSnapTradeSecret } from '@/lib/snaptrade/credentials';
import type { Database } from '@/lib/supabase/types';

type LeaderTrade = Database['public']['Tables']['leader_trades']['Row'];
type CopyRelationship = Database['public']['Tables']['copy_relationships']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type BrokerageConnection = Database['public']['Tables']['brokerage_connections']['Row'];
type CopyExecution = Database['public']['Tables']['copy_executions']['Insert'];

interface ExecutionResult {
  execution: CopyExecution;
  success: boolean;
  error?: string;
}

interface ProcessStats {
  totalTrades: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
}

export class CopyTradeEngine {
  private maxRetries: number = 3;

  /**
   * Get all active followers for a leader
   */
  async getActiveFollowers(leaderId: string): Promise<CopyRelationship[]> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('copy_relationships')
      .select('*')
      .eq('leader_id', leaderId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching active followers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get follower's brokerage account
   */
  async getFollowerAccount(followerId: string): Promise<BrokerageConnection | null> {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('brokerage_connections')
      .select('*')
      .eq('user_id', followerId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching follower account:', error);
      return null;
    }

    return data;
  }

  /**
   * Get universal symbol ID from SnapTrade
   */
  async getUniversalSymbolId(userId: string, userSecret: string, symbol: string): Promise<string | null> {
    try {
      const results = await snaptradeService.searchSymbols(symbol);

      // Find exact match
      const exactMatch = results.find(
        (r) => r.symbol?.symbol?.toUpperCase() === symbol.toUpperCase()
      );

      if (exactMatch) {
        return exactMatch.symbol?.id || null;
      }

      // Return first result if no exact match
      return results[0]?.symbol?.id || null;
    } catch (error) {
      console.error(`Error searching for symbol ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Execute function with exponential backoff retry logic
   */
  async executeWithRetry<T>(
    func: () => Promise<T>,
    operation: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await func();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries - 1) {
          const waitTime = Math.pow(2, attempt); // Exponential backoff: 1s, 2s, 4s
          console.warn(
            `Attempt ${attempt + 1}/${this.maxRetries} failed for ${operation}: ${lastError.message}. ` +
            `Retrying in ${waitTime}s...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        } else {
          console.error(`All ${this.maxRetries} attempts failed for ${operation}: ${lastError.message}`);
        }
      }
    }

    throw lastError;
  }

  /**
   * Get current positions for position sizing and filtering
   */
  async getCurrentPositions(
    relationshipId: string
  ): Promise<Record<string, PositionData>> {
    const supabase = createServiceRoleClient();

    // Get all successful copy executions for this relationship
    const { data: executions, error } = await supabase
      .from('copy_executions')
      .select('symbol, action, quantity, executed_price')
      .eq('relationship_id', relationshipId)
      .eq('status', 'success');

    if (error || !executions) {
      return {};
    }

    const positions: Record<string, PositionData> = {};

    for (const execution of executions) {
      if (!positions[execution.symbol]) {
        positions[execution.symbol] = { quantity: 0, value: 0 };
      }

      const qty = execution.quantity;
      const price = execution.executed_price || 0;

      if (execution.action === 'buy') {
        positions[execution.symbol].quantity += qty;
        positions[execution.symbol].value += qty * price;
      } else {
        positions[execution.symbol].quantity -= qty;
        positions[execution.symbol].value -= qty * price;
      }
    }

    // Remove closed positions
    Object.keys(positions).forEach((symbol) => {
      if (positions[symbol].quantity <= 0) {
        delete positions[symbol];
      }
    });

    return positions;
  }

  /**
   * Get today's trade count and volume for limits
   */
  async getTodayStats(relationshipId: string): Promise<{ count: number; volume: number }> {
    const supabase = createServiceRoleClient();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: executions, error } = await supabase
      .from('copy_executions')
      .select('quantity, executed_price')
      .eq('relationship_id', relationshipId)
      .eq('status', 'success')
      .gte('created_at', today.toISOString());

    if (error || !executions) {
      return { count: 0, volume: 0 };
    }

    const count = executions.length;
    const volume = executions.reduce((sum, e) => sum + (e.quantity * (e.executed_price || 0)), 0);

    return { count, volume };
  }

  /**
   * Execute a copy trade for a single follower
   */
  async executeCopyTrade(
    trade: LeaderTrade,
    relationship: CopyRelationship,
    follower: User,
    followerAccount: BrokerageConnection
  ): Promise<ExecutionResult> {
    const supabase = createServiceRoleClient();

    // Decrypt follower's SnapTrade secret once for use throughout execution
    const followerSecret = decryptSnapTradeSecret(follower.snaptrade_user_secret!);

    // Initialize execution record
    const execution: CopyExecution = {
      trade_id: trade.id,
      relationship_id: relationship.id,
      follower_id: follower.id,
      symbol: trade.symbol,
      action: trade.action,
      quantity: 0,
      status: 'pending',
      account_id: followerAccount.account_id,
      asset_type: trade.asset_type,
    };

    try {
      // Step 1: Get current positions and today's stats for filtering
      const [currentPositions, todayStats] = await Promise.all([
        this.getCurrentPositions(relationship.id),
        this.getTodayStats(relationship.id),
      ]);

      // Step 2: Check if trade should be copied (filters + exposure limits)
      const filterResult = await tradeFilterService.shouldCopyTrade(
        {
          symbol: trade.symbol,
          price: trade.price,
          quantity: trade.quantity,
          action: trade.action === 'buy' ? 'BUY' : 'SELL',
          asset_type: trade.asset_type.toUpperCase() as any,
          expiration_date: trade.expiration_date,
        },
        relationship,
        followerAccount.balance,
        currentPositions,
        todayStats.count,
        todayStats.volume
      );

      if (!filterResult.shouldCopy) {
        execution.status = 'skipped';
        execution.error_message = `Filtered: ${filterResult.skipReason}`;

        const { error } = await supabase.from('copy_executions').insert(execution);
        if (error) console.error('Error saving skipped execution:', error);

        console.info(`Trade skipped for follower ${follower.id}: ${filterResult.skipReason}`);

        return { execution, success: false, error: filterResult.skipReason };
      }

      // Step 3: Get universal symbol ID
      const universalSymbolId = await this.getUniversalSymbolId(
        follower.snaptrade_user_id!,
        followerSecret,
        trade.symbol
      );

      if (!universalSymbolId) {
        execution.status = 'failed';
        execution.error_message = `Symbol ${trade.symbol} not found`;

        const { error } = await supabase.from('copy_executions').insert(execution);
        if (error) console.error('Error saving failed execution:', error);

        return { execution, success: false, error: execution.error_message };
      }

      // Step 4: Get current stock price for position sizing
      let currentPrice = trade.price || 0;
      if (currentPrice === 0) {
        try {
          const quote = await snaptradeService.getStockQuote(
            follower.snaptrade_user_id!,
            followerSecret,
            followerAccount.account_id,
            trade.symbol
          );
          currentPrice = quote.price;
        } catch {
          currentPrice = 100; // Fallback
        }
      }

      // Step 5: Calculate follower quantity using position sizing
      const sizingResult = positionSizingCalculator.calculatePositionSize(
        relationship,
        trade.quantity,
        trade.price,
        followerAccount.balance,
        currentPrice
      );

      execution.quantity = sizingResult.quantity;

      console.info(
        `Position sizing: method=${sizingResult.method_used}, ` +
        `quantity=${sizingResult.quantity}, cost=$${sizingResult.estimated_cost.toFixed(2)}, ` +
        `capped=${sizingResult.capped}`
      );

      if (sizingResult.quantity === 0) {
        execution.status = 'skipped';
        execution.error_message = 'Position size calculated as 0';

        const { error } = await supabase.from('copy_executions').insert(execution);
        if (error) console.error('Error saving execution:', error);

        return { execution, success: false, error: execution.error_message };
      }

      // Step 6: Check trade impact
      const impact = await snaptradeService.checkTradeImpact(
        follower.snaptrade_user_id!,
        followerSecret,
        followerAccount.account_id,
        trade.action.toUpperCase() as 'BUY' | 'SELL',
        universalSymbolId,
        'Market',
        sizingResult.quantity
      );

      if (!impact || !impact.trade) {
        execution.status = 'failed';
        execution.error_message = 'Trade impact validation failed';

        const { error } = await supabase.from('copy_executions').insert(execution);
        if (error) console.error('Error saving execution:', error);

        return { execution, success: false, error: execution.error_message };
      }

      // Step 7: Execute trade with retry logic
      const tradeId = impact.trade.id;
      const order = await this.executeWithRetry(
        () => snaptradeService.placeOrder(
          follower.snaptrade_user_id!,
          followerSecret,
          tradeId,
          true // wait for confirmation
        ),
        `place order for ${trade.symbol}`
      );

      // Step 8: Update execution record
      execution.status = 'success';
      execution.order_id = order.order_id;
      execution.executed_at = new Date().toISOString();
      execution.executed_price = order.executed_price || currentPrice;

      console.info(
        `Copy trade executed: follower=${follower.id}, ` +
        `symbol=${trade.symbol}, action=${trade.action}, ` +
        `quantity=${sizingResult.quantity}, price=$${execution.executed_price.toFixed(2)}`
      );

      // Step 9: Place automatic stop-loss if enabled
      if (relationship.auto_stop_loss_enabled && relationship.auto_stop_loss_percent) {
        try {
          const stopPrice = positionSizingCalculator.calculateStopLossPrice(
            execution.executed_price,
            relationship.auto_stop_loss_percent,
            trade.action.toUpperCase() as 'BUY' | 'SELL'
          );

          // Note: Stop-loss order placement would go here
          // SnapTrade API needs to support stop orders
          execution.stop_loss_price = stopPrice;

          console.info(`Stop-loss calculated: price=$${stopPrice.toFixed(2)}`);
        } catch (error) {
          console.error('Failed to place stop-loss order:', error);
        }
      }

      // Step 10: Place automatic take-profit if enabled
      if (relationship.auto_take_profit_enabled && relationship.auto_take_profit_percent) {
        try {
          const takeProfitPrice = positionSizingCalculator.calculateTakeProfitPrice(
            execution.executed_price,
            relationship.auto_take_profit_percent,
            trade.action.toUpperCase() as 'BUY' | 'SELL'
          );

          execution.take_profit_price = takeProfitPrice;

          console.info(`Take-profit calculated: price=$${takeProfitPrice.toFixed(2)}`);
        } catch (error) {
          console.error('Failed to place take-profit order:', error);
        }
      }

      // Step 11: Update relationship statistics
      await supabase
        .from('copy_relationships')
        .update({
          total_trades_copied: relationship.total_trades_copied + 1,
        })
        .eq('id', relationship.id);

      // Step 12: Save execution record
      const { error: insertError } = await supabase.from('copy_executions').insert(execution);
      if (insertError) {
        console.error('Error saving successful execution:', insertError);
      }

      // Step 13: Create in-app notification
      await supabase.from('notifications').insert({
        user_id: follower.id,
        type: 'trade_executed',
        title: 'Trade Executed',
        message: `Copied ${trade.action} ${sizingResult.quantity} ${trade.symbol} at $${execution.executed_price.toFixed(2)}`,
        metadata: {
          trade_id: trade.id,
          symbol: trade.symbol,
          action: trade.action,
          quantity: sizingResult.quantity,
          price: execution.executed_price,
        },
      });

      return { execution, success: true };
    } catch (error) {
      execution.status = 'failed';
      execution.error_message = (error as Error).message;

      console.error(`Error executing copy trade for follower ${follower.id}:`, error);

      // Save failed execution
      const { error: insertError } = await supabase.from('copy_executions').insert(execution);
      if (insertError) console.error('Error saving failed execution:', insertError);

      // Create failure notification
      await supabase.from('notifications').insert({
        user_id: follower.id,
        type: 'trade_failed',
        title: 'Trade Failed',
        message: `Failed to copy ${trade.action} ${trade.symbol}: ${execution.error_message}`,
        metadata: {
          trade_id: trade.id,
          symbol: trade.symbol,
          error: execution.error_message,
        },
      });

      return { execution, success: false, error: execution.error_message };
    }
  }

  /**
   * Process a leader trade and execute copies for all followers
   */
  async processTrade(trade: LeaderTrade): Promise<ExecutionResult[]> {
    const supabase = createServiceRoleClient();

    // Get all active followers
    const relationships = await this.getActiveFollowers(trade.leader_id);

    console.info(`Processing trade ${trade.id} for ${relationships.length} followers`);

    const results: ExecutionResult[] = [];

    for (const relationship of relationships) {
      // Get follower
      const { data: follower } = await supabase
        .from('users')
        .select('*')
        .eq('id', relationship.follower_id)
        .single();

      if (!follower) {
        console.warn(`Follower ${relationship.follower_id} not found`);
        continue;
      }

      // Get follower account
      const followerAccount = await this.getFollowerAccount(follower.id);

      if (!followerAccount) {
        console.warn(`No account found for follower ${follower.id}`);

        // Create skipped execution
        const execution: CopyExecution = {
          trade_id: trade.id,
          relationship_id: relationship.id,
          follower_id: follower.id,
          symbol: trade.symbol,
          action: trade.action,
          quantity: 0,
          status: 'skipped',
          error_message: 'No brokerage account connected',
          account_id: 'none',
        };

        await supabase.from('copy_executions').insert(execution);
        results.push({ execution, success: false, error: execution.error_message });
        continue;
      }

      // Execute copy trade
      const result = await this.executeCopyTrade(trade, relationship, follower, followerAccount);
      results.push(result);
    }

    return results;
  }

  /**
   * Process all pending trades
   */
  async processAllPendingTrades(): Promise<ProcessStats> {
    const supabase = createServiceRoleClient();

    // Get unprocessed trades
    const { data: pendingTrades, error } = await supabase
      .from('leader_trades')
      .select('*')
      .eq('processed', false)
      .order('detected_at', { ascending: true });

    if (error || !pendingTrades) {
      console.error('Error fetching pending trades:', error);
      return {
        totalTrades: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        skippedExecutions: 0,
      };
    }

    const stats: ProcessStats = {
      totalTrades: pendingTrades.length,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      skippedExecutions: 0,
    };

    console.info(`Processing ${pendingTrades.length} pending trades`);

    for (const trade of pendingTrades) {
      const results = await this.processTrade(trade);

      stats.totalExecutions += results.length;
      stats.successfulExecutions += results.filter((r) => r.success).length;
      stats.failedExecutions += results.filter((r) => !r.success && r.execution.status === 'failed').length;
      stats.skippedExecutions += results.filter((r) => r.execution.status === 'skipped').length;

      // Mark trade as processed
      await supabase
        .from('leader_trades')
        .update({ processed: true })
        .eq('id', trade.id);
    }

    console.info('Processing complete:', stats);
    return stats;
  }
}

// Export singleton instance
export const copyTradeEngine = new CopyTradeEngine();
export default copyTradeEngine;
