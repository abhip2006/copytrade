/**
 * TypeScript type definitions for SnapTrade API responses
 */

export interface RegisterUserResponse {
  userId: string;
  userSecret: string;
}

export interface SnapTradeUser {
  userId: string;
  userSecret: string;
}

export interface BrokerageAuthorization {
  id: string;
  created_date: string;
  brokerage: {
    id: string;
    name: string;
  };
  name: string;
  type: string;
  disabled: boolean;
  disabled_date: string | null;
}

export interface Account {
  id: string;
  brokerage_authorization: string;
  name: string;
  number: string;
  institution_name: string;
  balance: {
    total: {
      amount: number;
      currency: string;
    };
  };
  status: string;
  raw_type: string;
  sync_status: {
    holdings: {
      initial_sync_completed: boolean;
      last_successful_sync: string;
    };
    transactions: {
      initial_sync_completed: boolean;
      last_successful_sync: string;
    };
  };
}

export interface Balance {
  currency: {
    code: string;
    name: string;
  };
  cash: number;
  buying_power: number;
}

export interface Position {
  symbol: {
    id: string;
    symbol: string;
    description: string;
  };
  units: number;
  price: number;
  average_purchase_price: number;
  currency: {
    code: string;
  };
  open_pnl: number;
  fractional_units: number;
}

export interface AccountHoldings {
  account: Account;
  balances: Balance[];
  positions: Position[];
  total_value: {
    amount: number;
    currency: string;
  };
}

export interface Activity {
  id: string;
  account_id: string;
  symbol: {
    id: string;
    symbol: string;
    description: string;
  };
  action: string;
  units: number;
  price: number;
  total_amount: number;
  trade_date: string;
  settlement_date: string;
  fee: number;
  description: string;
}

export interface SymbolSearchResult {
  symbol: {
    id: string;
    symbol: string;
    raw_symbol: string;
    description: string;
    currency: {
      code: string;
      name: string;
    };
    exchange: {
      code: string;
      name: string;
    };
    type: {
      code: string;
      description: string;
    };
  };
}

export interface TradeImpact {
  trade: {
    id: string;
    order_type: string;
    time_in_force: string;
    symbol: {
      id: string;
      symbol: string;
      description: string;
    };
    action: string;
    units: number;
    price: number;
    bidPrice?: number;
    askPrice?: number;
    lastTradePrice?: number;
  };
  trade_impacts: Array<{
    account: string;
    currency: string;
    remaining_cash: number;
    estimated_commissions: number;
    forex_fees: number;
  }>;
}

export interface AccountOrderRecord {
  symbol: {
    id: string;
    symbol: string;
    description: string;
  };
  action: string;
  units: number;
  filled_units: number;
  open_units: number;
  canceled_units: number;
  executed_price: number;
  limit_price: number | null;
  stop_price: number | null;
  status: 'EXECUTED' | 'ACCEPTED' | 'PENDING' | 'FAILED' | 'REJECTED';
  order_id: string;
  time_placed: string;
}

export interface OptionPosition {
  symbol: {
    id: string;
    option_symbol: string;
    ticker: string;
    option_type: string;
    strike_price: number;
    expiration_date: string;
  };
  units: number;
  price: number;
  average_purchase_price: number;
  currency: {
    code: string;
  };
  open_pnl: number;
}

export interface SymbolsQuotesInner {
  symbol: {
    id: string;
    symbol: string;
    description: string;
  };
  last_trade_price: number;
  bid_price: number;
  ask_price: number;
  bid_size: number;
  ask_size: number;
}

// Request types
export interface PlaceOrderRequest {
  account_id: string;
  action: 'BUY' | 'SELL';
  universal_symbol_id: string;
  order_type: 'Market' | 'Limit' | 'Stop' | 'StopLimit';
  time_in_force: 'Day' | 'GTC' | 'FOK' | 'IOC';
  units: number;
  price?: number;
  stop?: number;
}

export interface OptionLeg {
  action: 'BUY_TO_OPEN' | 'SELL_TO_OPEN' | 'BUY_TO_CLOSE' | 'SELL_TO_CLOSE';
  quantity: number;
  option_symbol: {
    ticker: string;
    option_type: 'CALL' | 'PUT';
    strike_price: number;
    expiration_date: string;
  };
}

export interface PlaceMLEGOrderRequest {
  account_id: string;
  order_type: 'Market' | 'Limit';
  time_in_force: 'Day' | 'GTC' | 'FOK' | 'IOC';
  legs: OptionLeg[];
  price?: number;
}
