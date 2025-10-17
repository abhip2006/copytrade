/**
 * SnapTrade API Client
 * Converted from Python implementation
 * Handles all interactions with SnapTrade API for brokerage integration
 */

import { Snaptrade } from 'snaptrade-typescript-sdk';
import type {
  RegisterUserResponse,
  SnapTradeUser,
  BrokerageAuthorization,
  Account,
  Balance,
  Position,
  AccountHoldings,
  Activity,
  SymbolSearchResult,
  TradeImpact,
  AccountOrderRecord,
  OptionPosition,
  SymbolsQuotesInner,
} from './types';

class SnapTradeService {
  private client: Snaptrade;

  constructor() {
    const clientId = process.env.SNAPTRADE_CLIENT_ID;
    const consumerKey = process.env.SNAPTRADE_CONSUMER_KEY;

    if (!clientId || !consumerKey) {
      throw new Error('SnapTrade credentials not configured');
    }

    this.client = new Snaptrade({
      clientId,
      consumerKey,
    });
  }

  // ========== User Management ==========

  /**
   * Register a new user with SnapTrade
   * @param userId - Unique identifier for the user (use Clerk user ID)
   * @returns User ID and user secret
   */
  async registerUser(userId: string): Promise<RegisterUserResponse> {
    try {
      const response = await this.client.authentication.registerSnapTradeUser({
        userId,
      });

      return {
        userId: response.data.userId || userId,
        userSecret: response.data.userSecret || '',
      };
    } catch (error: any) {
      console.error(`Error registering user ${userId}:`, error);
      if (error.responseBody) {
        console.error('SnapTrade API Response:', JSON.stringify(error.responseBody, null, 2));
      }

      // Check if user already exists (error code 1010)
      if (error.responseBody?.code === '1010' || error.responseBody?.detail?.includes('already exist')) {
        console.log(`User ${userId} already registered with SnapTrade`);
        // Throw a specific error that can be caught upstream
        const userExistsError = new Error('USER_ALREADY_EXISTS');
        (userExistsError as any).code = 'USER_ALREADY_EXISTS';
        throw userExistsError;
      }

      throw new Error(`Failed to register user: ${error.message || error}`);
    }
  }

  /**
   * Delete a SnapTrade user
   * @param userId - SnapTrade user ID
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.client.authentication.deleteSnapTradeUser({
        userId,
      });
      return true;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw new Error(`Failed to delete user: ${error}`);
    }
  }

  // ========== Connection Management ==========

  /**
   * Generate connection portal URL for user to connect brokerage
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @returns Connection portal URL
   */
  async getRedirectUri(userId: string, userSecret: string): Promise<string> {
    try {
      const response = await this.client.authentication.loginSnapTradeUser({
        userId,
        userSecret,
      });

      return response.data.redirectURI || '';
    } catch (error) {
      console.error(`Error getting redirect URI for user ${userId}:`, error);
      throw new Error(`Failed to get redirect URI: ${error}`);
    }
  }

  /**
   * Get all brokerage connections for a user
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @returns List of brokerage authorizations
   */
  async listBrokerageAuthorizations(
    userId: string,
    userSecret: string
  ): Promise<BrokerageAuthorization[]> {
    try {
      const response = await this.client.connections.listBrokerageAuthorizations({
        userId,
        userSecret,
      });

      return response.data as BrokerageAuthorization[];
    } catch (error) {
      console.error(`Error listing authorizations for user ${userId}:`, error);
      throw new Error(`Failed to list authorizations: ${error}`);
    }
  }

  /**
   * Remove a brokerage connection
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param authorizationId - Authorization ID to remove
   */
  async deleteBrokerageAuthorization(
    userId: string,
    userSecret: string,
    authorizationId: string
  ): Promise<boolean> {
    try {
      await this.client.connections.removeBrokerageAuthorization({
        authorizationId,
        userId,
        userSecret,
      });
      return true;
    } catch (error) {
      console.error(`Error deleting authorization ${authorizationId}:`, error);
      throw new Error(`Failed to delete authorization: ${error}`);
    }
  }

  /**
   * Refresh brokerage connection to get latest data
   * @param authorizationId - Authorization ID to refresh
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   */
  async refreshBrokerageAuthorization(
    authorizationId: string,
    userId: string,
    userSecret: string
  ): Promise<any> {
    try {
      const response = await this.client.connections.refreshBrokerageAuthorization({
        authorizationId,
        userId,
        userSecret,
      });
      return response.data;
    } catch (error) {
      console.error(`Error refreshing authorization ${authorizationId}:`, error);
      throw new Error(`Failed to refresh authorization: ${error}`);
    }
  }

  // ========== Account Data ==========

  /**
   * Get all accounts for a user
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @returns List of accounts
   */
  async listUserAccounts(userId: string, userSecret: string): Promise<Account[]> {
    try {
      const response = await this.client.accountInformation.listUserAccounts({
        userId,
        userSecret,
      });

      return response.data as Account[];
    } catch (error) {
      console.error(`Error listing accounts for user ${userId}:`, error);
      throw new Error(`Failed to list accounts: ${error}`);
    }
  }

  /**
   * Get account balance information
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @returns Account balance data
   */
  async getAccountBalances(
    userId: string,
    userSecret: string,
    accountId: string
  ): Promise<Balance[]> {
    try {
      const response = await this.client.accountInformation.getUserAccountBalance({
        userId,
        userSecret,
        accountId,
      });

      return response.data as Balance[];
    } catch (error) {
      console.error(`Error getting balance for account ${accountId}:`, error);
      throw new Error(`Failed to get account balance: ${error}`);
    }
  }

  /**
   * Get current positions for an account
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @returns List of positions
   */
  async getAccountPositions(
    userId: string,
    userSecret: string,
    accountId: string
  ): Promise<Position[]> {
    try {
      const response = await this.client.accountInformation.getUserAccountPositions({
        userId,
        userSecret,
        accountId,
      });

      return response.data as Position[];
    } catch (error) {
      console.error(`Error getting positions for account ${accountId}:`, error);
      throw new Error(`Failed to get account positions: ${error}`);
    }
  }

  /**
   * Get all holdings (balances + positions) for an account
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @returns Account holdings data
   */
  async getAllHoldings(
    userId: string,
    userSecret: string,
    accountId: string
  ): Promise<AccountHoldings> {
    try {
      const response = await this.client.accountInformation.getUserHoldings({
        userId,
        userSecret,
        accountId,
      });

      return response.data as AccountHoldings;
    } catch (error) {
      console.error(`Error getting holdings for account ${accountId}:`, error);
      throw new Error(`Failed to get account holdings: ${error}`);
    }
  }

  /**
   * Get recent account activities/orders
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @returns List of activities
   */
  async getAccountActivities(
    userId: string,
    userSecret: string,
    accountId: string
  ): Promise<Activity[]> {
    try {
      const response = await this.client.transactionsAndReporting.getActivities({
        userId,
        userSecret,
        accountId,
      });

      return response.data as Activity[];
    } catch (error) {
      console.error(`Error getting activities for account ${accountId}:`, error);
      throw new Error(`Failed to get account activities: ${error}`);
    }
  }

  // ========== Trading ==========

  /**
   * Search for symbols to get universal symbol ID
   * Does not require user authentication
   * @param query - Search query (e.g., "AAPL")
   * @returns List of matching symbols
   */
  async searchSymbols(query: string): Promise<SymbolSearchResult[]> {
    try {
      const response = await this.client.referenceData.getSymbols({
        substring: query,
      });

      return response.data as SymbolSearchResult[];
    } catch (error) {
      console.error(`Error searching symbols with query '${query}':`, error);
      throw new Error(`Failed to search symbols: ${error}`);
    }
  }

  /**
   * Get real-time stock quote for a symbol
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @param symbol - Stock symbol (e.g., 'AAPL')
   * @returns Quote data with price, bid, ask
   */
  async getStockQuote(
    userId: string,
    userSecret: string,
    accountId: string,
    symbol: string
  ): Promise<{
    symbol: string;
    price: number;
    bidPrice: number;
    askPrice: number;
    lastPrice: number;
    universalSymbolId: string;
    symbolData: any;
  }> {
    try {
      // First search for the symbol
      const symbols = await this.searchSymbols(symbol);

      if (!symbols || symbols.length === 0) {
        throw new Error(`Symbol '${symbol}' not found`);
      }

      // Find exact match or use first result
      const matchedSymbol = symbols.find(
        (s) => s.symbol?.symbol?.toUpperCase() === symbol.toUpperCase()
      ) || symbols[0];

      const universalSymbolId = matchedSymbol.symbol?.id || '';

      // Use check trade impact to get current price
      const impact = await this.checkTradeImpact(
        userId,
        userSecret,
        accountId,
        'BUY',
        universalSymbolId,
        'Market',
        1
      );

      const trade = impact.trade || {};

      return {
        symbol: symbol.toUpperCase(),
        price: trade.price || 0,
        bidPrice: trade.bidPrice || 0,
        askPrice: trade.askPrice || 0,
        lastPrice: trade.lastTradePrice || 0,
        universalSymbolId,
        symbolData: matchedSymbol,
      };
    } catch (error) {
      console.error(`Error getting quote for symbol '${symbol}':`, error);
      throw new Error(`Failed to get stock quote: ${error}`);
    }
  }

  /**
   * Check the impact of a trade before execution
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @param action - "BUY" or "SELL"
   * @param universalSymbolId - Universal symbol ID from SnapTrade
   * @param orderType - "Market" or "Limit"
   * @param quantity - Number of shares/units
   * @param price - Limit price (optional, required for limit orders)
   * @returns Trade impact data including remaining cash and commissions
   */
  async checkTradeImpact(
    userId: string,
    userSecret: string,
    accountId: string,
    action: 'BUY' | 'SELL',
    universalSymbolId: string,
    orderType: 'Market' | 'Limit',
    quantity: number,
    price?: number
  ): Promise<TradeImpact> {
    try {
      const body: any = {
        account_id: accountId,
        action: action.toUpperCase(),
        universal_symbol_id: universalSymbolId,
        order_type: orderType,
        time_in_force: 'Day',
        units: quantity,
      };

      if (price && orderType.toLowerCase() === 'limit') {
        body.price = price;
      }

      const response = await this.client.trading.getOrderImpact({
        userId,
        userSecret,
        manualTradeForm: body,
      });

      return response.data as TradeImpact;
    } catch (error) {
      console.error('Error checking trade impact:', error);
      throw new Error(`Failed to check trade impact: ${error}`);
    }
  }

  /**
   * Place a trade order
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param tradeId - Trade ID from checkTradeImpact (expires in 5 minutes)
   * @param waitToConfirm - Wait for broker confirmation
   * @returns Order confirmation data
   */
  async placeOrder(
    userId: string,
    userSecret: string,
    tradeId: string,
    waitToConfirm: boolean = true
  ): Promise<AccountOrderRecord> {
    try {
      const response = await this.client.trading.placeOrder({
        tradeId,
        userId,
        userSecret,
        waitToConfirm,
      });

      return response.data as AccountOrderRecord;
    } catch (error) {
      console.error('Error placing order:', error);
      throw new Error(`Failed to place order: ${error}`);
    }
  }

  /**
   * Cancel an existing order
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @param orderId - Brokerage order ID
   */
  async cancelOrder(
    userId: string,
    userSecret: string,
    accountId: string,
    orderId: string
  ): Promise<boolean> {
    try {
      await this.client.trading.cancelUserAccountOrder({
        userId,
        userSecret,
        accountId,
        tradingCancelUserAccountOrderRequest: {
          brokerage_order_id: orderId,
        },
      });
      return true;
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw new Error(`Failed to cancel order: ${error}`);
    }
  }

  /**
   * Get option holdings/positions for an account
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @returns List of option positions
   */
  async getOptionHoldings(
    userId: string,
    userSecret: string,
    accountId: string
  ): Promise<OptionPosition[]> {
    try {
      const response = await this.client.options.listOptionHoldings({
        userId,
        userSecret,
        accountId,
      });

      return response.data as OptionPosition[];
    } catch (error) {
      console.error(`Error getting option holdings for account ${accountId}:`, error);
      throw new Error(`Failed to get option holdings: ${error}`);
    }
  }

  /**
   * Get real-time quotes for symbols
   * @param userId - SnapTrade user ID
   * @param userSecret - SnapTrade user secret
   * @param accountId - Account ID
   * @param symbols - Comma-separated list of symbols or universal symbol IDs
   * @param useTicker - True if using ticker symbols, False for universal symbol IDs
   * @returns List of quote objects
   */
  async getAccountQuotes(
    userId: string,
    userSecret: string,
    accountId: string,
    symbols: string,
    useTicker: boolean = true
  ): Promise<SymbolsQuotesInner[]> {
    try {
      const response = await this.client.trading.getUserAccountQuotes({
        userId,
        userSecret,
        symbols,
        accountId,
        useTicker,
      });

      return response.data as SymbolsQuotesInner[];
    } catch (error) {
      console.error(`Error getting quotes for symbols '${symbols}':`, error);
      throw new Error(`Failed to get account quotes: ${error}`);
    }
  }
}

// Export singleton instance
export const snaptradeService = new SnapTradeService();
export default snaptradeService;
