/**
 * Trade Filtering and Exposure Limit Service
 * Converted from Python implementation
 * Filters trades based on user preferences and enforces exposure limits
 */

export interface TradeData {
  symbol: string;
  price: number | null;
  quantity: number;
  action: 'BUY' | 'SELL';
  asset_type: 'STOCK' | 'OPTION' | 'ETF' | 'CRYPTO';
  expiration_date?: string | null;
}

export interface CopyRelationshipFilters {
  // Asset type filters
  skip_penny_stocks?: boolean;
  skip_options?: boolean;
  skip_0dte_options?: boolean;
  skip_crypto?: boolean;

  // Market cap filters
  filter_by_market_cap?: boolean;
  min_market_cap?: number; // in billions
  max_market_cap?: number; // in billions

  // Price filters
  filter_by_price?: boolean;
  min_stock_price?: number;
  max_stock_price?: number;

  // Sector filters
  filter_by_sector?: boolean;
  allowed_sectors?: string; // comma-separated
  blocked_sectors?: string; // comma-separated

  // Exposure limits
  enable_exposure_limits?: boolean;
  max_position_concentration?: number; // % of portfolio in single stock
  max_sector_concentration?: number; // % of portfolio in single sector
  max_open_positions?: number; // total number of positions
  max_daily_trades?: number; // trades per day
  max_daily_volume?: number; // dollar amount per day
}

export interface PositionData {
  quantity: number;
  value: number;
}

export interface FilterResult {
  shouldCopy: boolean;
  skipReason?: string;
}

export class TradeFilterService {
  private sectorMapping: Record<string, string> = {
    // Common sectors (would be expanded with real API data)
    AAPL: 'Technology',
    MSFT: 'Technology',
    GOOGL: 'Technology',
    AMZN: 'Consumer Cyclical',
    TSLA: 'Consumer Cyclical',
    JPM: 'Financial Services',
    BAC: 'Financial Services',
    XOM: 'Energy',
    CVX: 'Energy',
    JNJ: 'Healthcare',
    PFE: 'Healthcare',
    // Add more mappings or integrate with external API
  };

  private marketCapData: Record<string, number> = {
    // Mock market cap data in billions (would use real-time API)
    AAPL: 2800.0,
    MSFT: 2500.0,
    GOOGL: 1700.0,
    AMZN: 1400.0,
    TSLA: 800.0,
    JPM: 450.0,
    // Add more or use API like Alpha Vantage, Yahoo Finance
  };

  /**
   * Determine if a trade should be copied based on filters and limits
   * @returns FilterResult with shouldCopy and optional skipReason
   */
  async shouldCopyTrade(
    trade: TradeData,
    relationship: CopyRelationshipFilters,
    accountBalance: number,
    currentPositions: Record<string, PositionData>,
    todayTradeCount: number,
    todayVolume: number
  ): Promise<FilterResult> {
    // 1. Check trade filtering
    const filterResult = this._checkTradeFilters(trade, relationship);
    if (!filterResult.shouldCopy) {
      return filterResult;
    }

    // 2. Check exposure limits
    const exposureResult = this._checkExposureLimits(
      trade,
      relationship,
      accountBalance,
      currentPositions,
      todayTradeCount,
      todayVolume
    );
    if (!exposureResult.shouldCopy) {
      return exposureResult;
    }

    // All checks passed
    return { shouldCopy: true };
  }

  /**
   * Check if trade passes all filtering criteria
   */
  private _checkTradeFilters(
    trade: TradeData,
    relationship: CopyRelationshipFilters
  ): FilterResult {
    // Skip penny stocks filter
    if (relationship.skip_penny_stocks) {
      if (trade.price && trade.price < 5.0) {
        return {
          shouldCopy: false,
          skipReason: `Penny stock ($${trade.price.toFixed(2)} < $5.00)`,
        };
      }
    }

    // Skip options filter
    if (relationship.skip_options) {
      if (trade.asset_type === 'OPTION') {
        return {
          shouldCopy: false,
          skipReason: 'Options trades disabled',
        };
      }
    }

    // Skip 0DTE options filter
    if (relationship.skip_0dte_options) {
      if (trade.asset_type === 'OPTION' && trade.expiration_date) {
        try {
          const expDate = new Date(trade.expiration_date);
          const today = new Date();
          const daysDiff = Math.floor(
            (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 0) {
            return {
              shouldCopy: false,
              skipReason: '0DTE options disabled',
            };
          }
        } catch (e) {
          // Invalid date format, skip
        }
      }
    }

    // Skip crypto filter
    if (relationship.skip_crypto) {
      if (trade.asset_type === 'CRYPTO') {
        return {
          shouldCopy: false,
          skipReason: 'Crypto trades disabled',
        };
      }
    }

    // Market cap filtering
    if (relationship.filter_by_market_cap) {
      const marketCap = this._getMarketCap(trade.symbol);

      if (marketCap) {
        if (relationship.min_market_cap && marketCap < relationship.min_market_cap) {
          return {
            shouldCopy: false,
            skipReason: `Market cap $${marketCap.toFixed(1)}B < min $${relationship.min_market_cap.toFixed(1)}B`,
          };
        }

        if (relationship.max_market_cap && marketCap > relationship.max_market_cap) {
          return {
            shouldCopy: false,
            skipReason: `Market cap $${marketCap.toFixed(1)}B > max $${relationship.max_market_cap.toFixed(1)}B`,
          };
        }
      }
    }

    // Price filtering
    if (relationship.filter_by_price && trade.price) {
      if (relationship.min_stock_price && trade.price < relationship.min_stock_price) {
        return {
          shouldCopy: false,
          skipReason: `Price $${trade.price.toFixed(2)} < min $${relationship.min_stock_price.toFixed(2)}`,
        };
      }

      if (relationship.max_stock_price && trade.price > relationship.max_stock_price) {
        return {
          shouldCopy: false,
          skipReason: `Price $${trade.price.toFixed(2)} > max $${relationship.max_stock_price.toFixed(2)}`,
        };
      }
    }

    // Sector filtering
    if (relationship.filter_by_sector) {
      const sector = this._getSector(trade.symbol);

      if (sector) {
        // Check allowed sectors
        if (relationship.allowed_sectors) {
          const allowed = relationship.allowed_sectors.split(',').map((s) => s.trim());
          if (!allowed.includes(sector)) {
            return {
              shouldCopy: false,
              skipReason: `Sector '${sector}' not in allowed list`,
            };
          }
        }

        // Check blocked sectors
        if (relationship.blocked_sectors) {
          const blocked = relationship.blocked_sectors.split(',').map((s) => s.trim());
          if (blocked.includes(sector)) {
            return {
              shouldCopy: false,
              skipReason: `Sector '${sector}' is blocked`,
            };
          }
        }
      }
    }

    // All filters passed
    return { shouldCopy: true };
  }

  /**
   * Check if trade would exceed exposure limits
   */
  private _checkExposureLimits(
    trade: TradeData,
    relationship: CopyRelationshipFilters,
    accountBalance: number,
    currentPositions: Record<string, PositionData>,
    todayTradeCount: number,
    todayVolume: number
  ): FilterResult {
    if (!relationship.enable_exposure_limits) {
      return { shouldCopy: true };
    }

    // Default balance if not available
    const balance = accountBalance > 0 ? accountBalance : 10000.0;

    // Check max open positions
    if (relationship.max_open_positions) {
      if (Object.keys(currentPositions).length >= relationship.max_open_positions) {
        return {
          shouldCopy: false,
          skipReason: `Max open positions reached (${relationship.max_open_positions})`,
        };
      }
    }

    // Check position concentration (% of portfolio in single stock)
    if (relationship.max_position_concentration) {
      const estimatedPositionValue = trade.quantity * (trade.price || 100.0);

      // Get existing position in this symbol
      const existingValue = currentPositions[trade.symbol]?.value || 0;
      const totalValue = existingValue + estimatedPositionValue;

      const concentration = (totalValue / balance) * 100;

      if (concentration > relationship.max_position_concentration) {
        return {
          shouldCopy: false,
          skipReason: `Position concentration ${concentration.toFixed(1)}% > max ${relationship.max_position_concentration.toFixed(1)}%`,
        };
      }
    }

    // Check sector concentration
    if (relationship.max_sector_concentration) {
      const sector = this._getSector(trade.symbol);
      if (sector) {
        const sectorExposure = this._calculateSectorExposure(sector, currentPositions, balance);

        const estimatedPositionValue = trade.quantity * (trade.price || 100.0);
        const newSectorExposure =
          ((sectorExposure * balance) / 100 + estimatedPositionValue) / balance * 100;

        if (newSectorExposure > relationship.max_sector_concentration) {
          return {
            shouldCopy: false,
            skipReason: `Sector '${sector}' concentration ${newSectorExposure.toFixed(1)}% > max ${relationship.max_sector_concentration.toFixed(1)}%`,
          };
        }
      }
    }

    // Check daily trade limit
    if (relationship.max_daily_trades) {
      if (todayTradeCount >= relationship.max_daily_trades) {
        return {
          shouldCopy: false,
          skipReason: `Daily trade limit reached (${relationship.max_daily_trades})`,
        };
      }
    }

    // Check daily volume limit
    if (relationship.max_daily_volume) {
      const estimatedTradeValue = trade.quantity * (trade.price || 100.0);

      if (todayVolume + estimatedTradeValue > relationship.max_daily_volume) {
        return {
          shouldCopy: false,
          skipReason: `Daily volume limit would be exceeded ($${(todayVolume + estimatedTradeValue).toFixed(2)} > $${relationship.max_daily_volume.toFixed(2)})`,
        };
      }
    }

    // All exposure limits passed
    return { shouldCopy: true };
  }

  /**
   * Calculate % of portfolio in a sector
   */
  private _calculateSectorExposure(
    sector: string,
    currentPositions: Record<string, PositionData>,
    accountBalance: number
  ): number {
    let sectorValue = 0;

    for (const [symbol, position] of Object.entries(currentPositions)) {
      const symbolSector = this._getSector(symbol);
      if (symbolSector === sector) {
        sectorValue += position.value;
      }
    }

    return accountBalance > 0 ? (sectorValue / accountBalance) * 100 : 0;
  }

  /**
   * Get market cap in billions for a symbol
   * In production, use real-time API (e.g., Alpha Vantage, Yahoo Finance)
   */
  private _getMarketCap(symbol: string): number | undefined {
    return this.marketCapData[symbol];
  }

  /**
   * Get sector for a symbol
   * In production, use real-time API
   */
  private _getSector(symbol: string): string | undefined {
    return this.sectorMapping[symbol];
  }

  /**
   * Get a summary of active filters and limits
   */
  getFilterSummary(relationship: CopyRelationshipFilters): {
    active_filters: string[];
    active_limits: string[];
    total_protections: number;
  } {
    const activeFilters: string[] = [];
    const activeLimits: string[] = [];

    // Check active filters
    if (relationship.skip_penny_stocks) {
      activeFilters.push('Skip penny stocks (<$5)');
    }

    if (relationship.skip_options) {
      activeFilters.push('Skip all options');
    }

    if (relationship.skip_0dte_options) {
      activeFilters.push('Skip 0DTE options');
    }

    if (relationship.filter_by_market_cap) {
      if (relationship.min_market_cap) {
        activeFilters.push(`Min market cap: $${relationship.min_market_cap}B`);
      }
      if (relationship.max_market_cap) {
        activeFilters.push(`Max market cap: $${relationship.max_market_cap}B`);
      }
    }

    if (relationship.filter_by_price) {
      if (relationship.min_stock_price) {
        activeFilters.push(`Min price: $${relationship.min_stock_price}`);
      }
      if (relationship.max_stock_price) {
        activeFilters.push(`Max price: $${relationship.max_stock_price}`);
      }
    }

    if (relationship.filter_by_sector) {
      if (relationship.allowed_sectors) {
        activeFilters.push(`Allowed sectors: ${relationship.allowed_sectors}`);
      }
      if (relationship.blocked_sectors) {
        activeFilters.push(`Blocked sectors: ${relationship.blocked_sectors}`);
      }
    }

    // Check active limits
    if (relationship.enable_exposure_limits) {
      if (relationship.max_position_concentration) {
        activeLimits.push(`Max position: ${relationship.max_position_concentration}%`);
      }

      if (relationship.max_sector_concentration) {
        activeLimits.push(`Max sector: ${relationship.max_sector_concentration}%`);
      }

      if (relationship.max_open_positions) {
        activeLimits.push(`Max positions: ${relationship.max_open_positions}`);
      }

      if (relationship.max_daily_trades) {
        activeLimits.push(`Max daily trades: ${relationship.max_daily_trades}`);
      }

      if (relationship.max_daily_volume) {
        activeLimits.push(`Max daily volume: $${relationship.max_daily_volume.toLocaleString()}`);
      }
    }

    return {
      active_filters: activeFilters,
      active_limits: activeLimits,
      total_protections: activeFilters.length + activeLimits.length,
    };
  }
}

// Export singleton instance
export const tradeFilterService = new TradeFilterService();
export default tradeFilterService;
