/**
 * Position Sizing Calculator
 * Converted from Python implementation
 * Calculates appropriate position sizes based on different methods
 */

/**
 * Position sizing methods available
 */
export enum PositionSizingMethod {
  PROPORTIONAL = 'proportional',     // Use X% of portfolio for each trade
  FIXED_DOLLAR = 'fixed_dollar',     // Always invest exactly $X per trade
  FIXED_SHARES = 'fixed_shares',     // Always buy exactly X shares
  RISK_BASED = 'risk_based',         // Size based on risk percentage
  MULTIPLIER = 'multiplier',         // Copy leader at X times their size
}

/**
 * Copy relationship settings needed for position sizing
 */
export interface CopyRelationshipSettings {
  position_sizing_method: PositionSizingMethod;
  allocation_percent?: number;      // For proportional
  fixed_dollar_amount?: number;     // For fixed dollar
  fixed_shares_amount?: number;     // For fixed shares
  risk_percent?: number;            // For risk-based
  auto_stop_loss_percent?: number;  // For risk-based
  multiplier?: number;              // For multiplier
  max_position_size?: number;       // Max dollar amount cap (applies to all methods)
}

/**
 * Result from position size calculation
 */
export interface PositionSizeResult {
  quantity: number;         // Number of shares/contracts to buy
  estimated_cost: number;   // Estimated dollar cost
  method_used: string;      // Which sizing method was applied
  capped: boolean;          // Whether max_position_size limit was applied
}

export class PositionSizingCalculator {
  /**
   * Calculate appropriate position size for follower
   *
   * @param relationship - Copy relationship settings
   * @param leaderQuantity - Leader's trade quantity
   * @param leaderPrice - Leader's execution price (if available)
   * @param followerBalance - Follower's account balance
   * @param currentStockPrice - Current market price of the stock
   * @returns Position size calculation result
   */
  calculatePositionSize(
    relationship: CopyRelationshipSettings,
    leaderQuantity: number,
    leaderPrice: number | null,
    followerBalance: number,
    currentStockPrice: number
  ): PositionSizeResult {
    const method = relationship.position_sizing_method;
    const price = leaderPrice || currentStockPrice;

    switch (method) {
      case PositionSizingMethod.PROPORTIONAL:
        return this._proportionalSizing(
          relationship.allocation_percent || 10,
          followerBalance,
          price,
          relationship.max_position_size
        );

      case PositionSizingMethod.FIXED_DOLLAR:
        return this._fixedDollarSizing(
          relationship.fixed_dollar_amount,
          price,
          relationship.max_position_size
        );

      case PositionSizingMethod.FIXED_SHARES:
        return this._fixedSharesSizing(
          relationship.fixed_shares_amount,
          price,
          relationship.max_position_size
        );

      case PositionSizingMethod.RISK_BASED:
        return this._riskBasedSizing(
          relationship.risk_percent,
          relationship.auto_stop_loss_percent,
          followerBalance,
          price,
          relationship.max_position_size
        );

      case PositionSizingMethod.MULTIPLIER:
        return this._multiplierSizing(
          relationship.multiplier,
          leaderQuantity,
          price,
          relationship.max_position_size
        );

      default:
        console.error(`Unknown position sizing method: ${method}`);
        return {
          quantity: 0,
          estimated_cost: 0,
          method_used: 'error',
          capped: false,
        };
    }
  }

  /**
   * Proportional sizing: Use X% of portfolio for each trade
   *
   * Example: 10% allocation with $10,000 balance = $1,000 per trade
   */
  private _proportionalSizing(
    allocationPercent: number,
    followerBalance: number,
    price: number,
    maxPositionSize?: number
  ): PositionSizeResult {
    if (!allocationPercent || allocationPercent <= 0) {
      allocationPercent = 10.0; // Default to 10%
    }

    // Calculate dollar amount to invest
    let dollarAmount = (allocationPercent / 100.0) * followerBalance;

    // Apply max position size cap if set
    let capped = false;
    if (maxPositionSize && dollarAmount > maxPositionSize) {
      dollarAmount = maxPositionSize;
      capped = true;
    }

    // Calculate quantity (ensure at least 1 share if affordable)
    let quantity = price > 0 ? Math.floor(dollarAmount / price) : 0;

    if (quantity === 0 && dollarAmount >= price && price > 0) {
      quantity = 1;
    }

    return {
      quantity,
      estimated_cost: quantity * price,
      method_used: 'proportional',
      capped,
    };
  }

  /**
   * Fixed dollar sizing: Always invest exactly $X per trade
   *
   * Example: $500 fixed amount, $50 stock = 10 shares
   */
  private _fixedDollarSizing(
    fixedAmount: number | undefined,
    price: number,
    maxPositionSize?: number
  ): PositionSizeResult {
    if (!fixedAmount || fixedAmount <= 0) {
      console.error('Fixed dollar amount not set');
      return { quantity: 0, estimated_cost: 0, method_used: 'error', capped: false };
    }

    let dollarAmount = fixedAmount;

    // Apply max position size cap if set
    let capped = false;
    if (maxPositionSize && dollarAmount > maxPositionSize) {
      dollarAmount = maxPositionSize;
      capped = true;
    }

    // Calculate quantity
    let quantity = price > 0 ? Math.floor(dollarAmount / price) : 0;

    if (quantity === 0 && dollarAmount >= price && price > 0) {
      quantity = 1;
    }

    return {
      quantity,
      estimated_cost: quantity * price,
      method_used: 'fixed_dollar',
      capped,
    };
  }

  /**
   * Fixed shares sizing: Always buy exactly X shares
   *
   * Example: Always buy 10 shares regardless of price
   */
  private _fixedSharesSizing(
    fixedShares: number | undefined,
    price: number,
    maxPositionSize?: number
  ): PositionSizeResult {
    if (!fixedShares || fixedShares <= 0) {
      console.error('Fixed shares amount not set');
      return { quantity: 0, estimated_cost: 0, method_used: 'error', capped: false };
    }

    let quantity = Math.floor(fixedShares);
    let estimatedCost = quantity * price;

    // Apply max position size cap if set
    let capped = false;
    if (maxPositionSize && estimatedCost > maxPositionSize) {
      // Reduce quantity to fit within max
      quantity = price > 0 ? Math.floor(maxPositionSize / price) : 0;
      estimatedCost = quantity * price;
      capped = true;
    }

    return {
      quantity,
      estimated_cost: estimatedCost,
      method_used: 'fixed_shares',
      capped,
    };
  }

  /**
   * Risk-based sizing: Size position so that if stop-loss hits, you lose X% of account
   *
   * Example: Risk 2% of $10,000 = $200 max loss
   *          Stop-loss at 5% = position size can be $4,000
   *          ($4,000 * 5% loss = $200 total loss = 2% of account)
   *
   * Formula: Position Size = (Account Balance * Risk%) / Stop Loss%
   */
  private _riskBasedSizing(
    riskPercent: number | undefined,
    stopLossPercent: number | undefined,
    followerBalance: number,
    price: number,
    maxPositionSize?: number
  ): PositionSizeResult {
    if (!riskPercent || riskPercent <= 0) {
      console.error('Risk percent not set');
      return { quantity: 0, estimated_cost: 0, method_used: 'error', capped: false };
    }

    if (!stopLossPercent || stopLossPercent <= 0) {
      console.warn('Stop-loss percent not set, defaulting to 5%');
      stopLossPercent = 5.0; // Default stop-loss
    }

    // Calculate max dollar risk
    const maxRiskDollars = (riskPercent / 100.0) * followerBalance;

    // Calculate position size based on stop-loss
    // If we can lose stop_loss_percent of position, and that should equal max_risk_dollars:
    let dollarAmount = (maxRiskDollars / stopLossPercent) * 100;

    // Apply max position size cap if set
    let capped = false;
    if (maxPositionSize && dollarAmount > maxPositionSize) {
      dollarAmount = maxPositionSize;
      capped = true;
    }

    // Calculate quantity
    let quantity = price > 0 ? Math.floor(dollarAmount / price) : 0;

    if (quantity === 0 && dollarAmount >= price && price > 0) {
      quantity = 1;
    }

    return {
      quantity,
      estimated_cost: quantity * price,
      method_used: 'risk_based',
      capped,
    };
  }

  /**
   * Multiplier sizing: Copy leader at X times their size
   *
   * Example: Leader buys 100 shares, multiplier 0.5 = you buy 50 shares
   *          Leader buys 100 shares, multiplier 2.0 = you buy 200 shares
   */
  private _multiplierSizing(
    multiplier: number | undefined,
    leaderQuantity: number,
    price: number,
    maxPositionSize?: number
  ): PositionSizeResult {
    if (!multiplier || multiplier <= 0) {
      console.error('Multiplier not set');
      return { quantity: 0, estimated_cost: 0, method_used: 'error', capped: false };
    }

    // Calculate quantity as multiple of leader's quantity
    let quantity = Math.floor(leaderQuantity * multiplier);

    if (quantity < 1) {
      quantity = 1; // At minimum, copy 1 share
    }

    let estimatedCost = quantity * price;

    // Apply max position size cap if set
    let capped = false;
    if (maxPositionSize && estimatedCost > maxPositionSize) {
      quantity = price > 0 ? Math.floor(maxPositionSize / price) : 0;
      estimatedCost = quantity * price;
      capped = true;
    }

    return {
      quantity,
      estimated_cost: estimatedCost,
      method_used: 'multiplier',
      capped,
    };
  }

  /**
   * Calculate stop-loss price
   *
   * For BUY orders: Stop-loss is below entry price
   * For SELL orders: Stop-loss is above entry price
   */
  calculateStopLossPrice(
    entryPrice: number,
    stopLossPercent: number,
    action: 'BUY' | 'SELL'
  ): number {
    if (action.toUpperCase() === 'BUY') {
      // For long positions, stop-loss is below entry
      const stopPrice = entryPrice * (1 - stopLossPercent / 100.0);
      return Math.round(stopPrice * 100) / 100;
    } else {
      // For short positions, stop-loss is above entry
      const stopPrice = entryPrice * (1 + stopLossPercent / 100.0);
      return Math.round(stopPrice * 100) / 100;
    }
  }

  /**
   * Calculate take-profit price
   *
   * For BUY orders: Take-profit is above entry price
   * For SELL orders: Take-profit is below entry price
   */
  calculateTakeProfitPrice(
    entryPrice: number,
    takeProfitPercent: number,
    action: 'BUY' | 'SELL'
  ): number {
    if (action.toUpperCase() === 'BUY') {
      // For long positions, take-profit is above entry
      const takeProfit = entryPrice * (1 + takeProfitPercent / 100.0);
      return Math.round(takeProfit * 100) / 100;
    } else {
      // For short positions, take-profit is below entry
      const takeProfit = entryPrice * (1 - takeProfitPercent / 100.0);
      return Math.round(takeProfit * 100) / 100;
    }
  }
}

// Export singleton instance
export const positionSizingCalculator = new PositionSizingCalculator();
export default positionSizingCalculator;
