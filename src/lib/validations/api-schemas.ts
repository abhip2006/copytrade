/**
 * API Request Validation Schemas
 * Using Zod for type-safe runtime validation
 */

import { z } from 'zod';

// ========== Trade Schemas ==========

export const tradeExecuteSchema = z.object({
  tradeId: z.string().min(1, 'Trade ID is required'),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
});

export const tradeImpactSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  action: z.enum(['BUY', 'SELL', 'buy', 'sell']),
  orderType: z.enum(['Market', 'Limit', 'Stop', 'StopLimit', 'market', 'limit', 'stop', 'stoplimit']),
  price: z.number().positive().optional(),
  stop: z.number().positive().optional(),
  timeInForce: z.enum(['Day', 'GTC', 'FOK', 'IOC']).optional(),
  units: z.number().positive().optional(),
  universalSymbolId: z.string().optional(),
});

// ========== Copy Relationship Schemas ==========

export const copyRelationshipCreateSchema = z.object({
  leaderId: z.string().uuid('Invalid leader ID'),
  positionSizingMethod: z.enum([
    'proportional',
    'fixed_dollar',
    'fixed_shares',
    'risk_based',
    'multiplier',
  ]).default('proportional'),
  allocationPercent: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().positive().optional(),
  riskPercent: z.number().min(0).max(100).optional(),
  multiplier: z.number().positive().optional(),
  maxPositionSize: z.number().positive().optional(),
  maxRiskPerTrade: z.number().min(0).max(100).optional(),
  stopCopyingThreshold: z.number().min(-100).max(0).optional(),
  copyStopLoss: z.boolean().default(true),
  copyTakeProfit: z.boolean().default(true),
  customStopLossPercent: z.number().min(0).max(100).optional(),
  customTakeProfitPercent: z.number().positive().optional(),
  trailingStopLoss: z.boolean().default(false),
  trailingStopPercent: z.number().min(0).max(100).optional(),
  allowedAssetTypes: z.array(z.enum(['stock', 'etf', 'option', 'crypto', 'mutual_fund'])).optional(),
  mirrorExits: z.boolean().default(true),
  minMarketCap: z.number().positive().optional(),
  maxPricePerShare: z.number().positive().optional(),
  allowedSectors: z.array(z.string()).optional(),
  maxPositions: z.number().positive().optional(),
  maxExposurePercent: z.number().min(0).max(100).optional(),
  maxSectorConcentration: z.number().min(0).max(100).optional(),
});

export const copyRelationshipUpdateSchema = copyRelationshipCreateSchema.partial();

// ========== User Role Schema ==========

export const userRoleSchema = z.object({
  role: z.enum(['leader', 'follower', 'both'], {
    errorMap: () => ({ message: 'Invalid role. Must be "leader", "follower", or "both"' })
  }),
});

// ========== Watchlist Schemas ==========

export const watchlistAddSchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  name: z.string().optional(),
  exchange: z.string().optional(),
  type: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// ========== Order Schemas ==========

export const orderCancelSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  brokerageOrderId: z.string().min(1, 'Brokerage order ID is required'),
});

export const orderReplaceSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  brokerageOrderId: z.string().min(1, 'Brokerage order ID is required'),
  action: z.enum(['BUY', 'SELL', 'buy', 'sell']).optional(),
  orderType: z.enum(['Market', 'Limit', 'Stop', 'StopLimit']).optional(),
  price: z.number().positive().optional(),
  stop: z.number().positive().optional(),
  timeInForce: z.enum(['Day', 'GTC', 'FOK', 'IOC']).optional(),
  units: z.number().positive().optional(),
});

// ========== Symbol Search Schema ==========

export const symbolSearchSchema = z.object({
  query: z.string().min(1).max(50),
});

// ========== Helper Functions ==========

/**
 * Validate request body against a Zod schema
 * Returns validated data or throws error with details
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Safe validation that returns result object instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errorMessages = result.error.errors
      .map(err => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return { success: false, error: errorMessages };
  }
}
