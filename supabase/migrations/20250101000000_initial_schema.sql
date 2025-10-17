-- CopyTrade Platform - Initial Database Schema
-- Converted from SQLAlchemy models to PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('leader', 'follower', 'both', 'admin');
CREATE TYPE connection_status AS ENUM ('active', 'broken', 'deleted');
CREATE TYPE copy_relationship_status AS ENUM ('active', 'paused', 'stopped');
CREATE TYPE trade_action AS ENUM ('buy', 'sell');
CREATE TYPE execution_status AS ENUM ('pending', 'success', 'failed', 'skipped');
CREATE TYPE position_sizing_method AS ENUM ('proportional', 'fixed_dollar', 'fixed_shares', 'risk_based', 'multiplier');
CREATE TYPE asset_type AS ENUM ('stock', 'option', 'etf', 'crypto');
CREATE TYPE option_type AS ENUM ('call', 'put');
CREATE TYPE notification_type AS ENUM ('trade_executed', 'trade_failed', 'leader_new_trade', 'performance_alert', 'daily_summary', 'custom_alert', 'leader_activity', 'new_follower', 'new_review', 'system_alert');
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'discord', 'telegram', 'push');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Clerk auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL, -- Clerk user ID
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,

    -- SnapTrade credentials (encrypted)
    snaptrade_user_id TEXT UNIQUE,
    snaptrade_user_secret TEXT, -- Encrypted

    -- Role
    role user_role DEFAULT 'follower',

    -- Leader profile (optional)
    bio TEXT,
    strategy_description TEXT,
    max_followers INTEGER DEFAULT 100,
    subscription_fee DECIMAL(10, 2) DEFAULT 0.00,

    -- Leader verification & badges
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMPTZ,
    verified_by_admin_id UUID,
    has_performance_badge BOOLEAN DEFAULT FALSE,
    has_consistency_badge BOOLEAN DEFAULT FALSE,

    -- Risk scores (1-10 scale)
    risk_score INTEGER DEFAULT 5,
    volatility_score INTEGER DEFAULT 5,
    leverage_score INTEGER DEFAULT 1,
    transparency_score INTEGER DEFAULT 100,

    -- Performance stats (cached)
    total_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,
    total_roi DECIMAL(10, 2) DEFAULT 0.00,
    avg_return DECIMAL(10, 2) DEFAULT 0.00,
    sharpe_ratio DECIMAL(10, 4) DEFAULT 0.0000,
    max_drawdown DECIMAL(10, 2) DEFAULT 0.00,
    total_followers INTEGER DEFAULT 0,
    active_followers INTEGER DEFAULT 0,

    -- Trading characteristics
    trades_options BOOLEAN DEFAULT FALSE,
    trades_0dte BOOLEAN DEFAULT FALSE,
    uses_margin BOOLEAN DEFAULT FALSE,
    avg_position_size DECIMAL(12, 2) DEFAULT 0.00,

    -- Profile visibility
    is_public BOOLEAN DEFAULT TRUE,
    accepts_followers BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    stats_updated_at TIMESTAMPTZ,

    CONSTRAINT valid_risk_score CHECK (risk_score BETWEEN 1 AND 10),
    CONSTRAINT valid_volatility_score CHECK (volatility_score BETWEEN 1 AND 10),
    CONSTRAINT valid_leverage_score CHECK (leverage_score BETWEEN 1 AND 10),
    CONSTRAINT valid_transparency_score CHECK (transparency_score BETWEEN 0 AND 100)
);

-- Brokerage connections
CREATE TABLE brokerage_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- SnapTrade connection info
    connection_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    brokerage_name TEXT NOT NULL,
    account_number TEXT,

    -- Status
    status connection_status DEFAULT 'active',

    -- Account info
    account_type TEXT,
    balance DECIMAL(12, 2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, account_id)
);

-- Copy relationships
CREATE TABLE copy_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationship
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Position Sizing Settings
    position_sizing_method position_sizing_method DEFAULT 'proportional',
    allocation_percent DECIMAL(5, 2) DEFAULT 100.00,
    fixed_dollar_amount DECIMAL(10, 2),
    fixed_shares_amount DECIMAL(10, 2),
    risk_percent DECIMAL(5, 2),
    multiplier DECIMAL(5, 2),
    max_position_size DECIMAL(12, 2),

    -- Automatic Risk Management
    auto_stop_loss_enabled BOOLEAN DEFAULT FALSE,
    auto_stop_loss_percent DECIMAL(5, 2),
    auto_stop_loss_type TEXT DEFAULT 'percentage',
    trailing_stop_loss BOOLEAN DEFAULT FALSE,

    auto_take_profit_enabled BOOLEAN DEFAULT FALSE,
    auto_take_profit_percent DECIMAL(5, 2),
    auto_take_profit_type TEXT DEFAULT 'percentage',
    scale_out_enabled BOOLEAN DEFAULT FALSE,
    scale_out_percentage DECIMAL(5, 2),

    -- Position Exit Settings
    mirror_exits BOOLEAN DEFAULT TRUE,
    stop_loss_percent DECIMAL(5, 2),

    -- Trade Filtering Settings
    filter_by_market_cap BOOLEAN DEFAULT FALSE,
    min_market_cap DECIMAL(10, 2),
    max_market_cap DECIMAL(10, 2),

    filter_by_price BOOLEAN DEFAULT FALSE,
    min_stock_price DECIMAL(10, 2),
    max_stock_price DECIMAL(10, 2),

    filter_by_sector BOOLEAN DEFAULT FALSE,
    allowed_sectors TEXT,
    blocked_sectors TEXT,

    skip_penny_stocks BOOLEAN DEFAULT TRUE,
    skip_options BOOLEAN DEFAULT FALSE,
    skip_0dte_options BOOLEAN DEFAULT FALSE,
    skip_crypto BOOLEAN DEFAULT FALSE,

    -- Maximum Exposure Limits
    enable_exposure_limits BOOLEAN DEFAULT TRUE,
    max_position_concentration DECIMAL(5, 2),
    max_sector_concentration DECIMAL(5, 2),
    max_open_positions INTEGER,
    max_daily_trades INTEGER,
    max_daily_volume DECIMAL(12, 2),

    -- Diversification settings
    require_diversification BOOLEAN DEFAULT FALSE,
    min_positions INTEGER DEFAULT 3,

    -- Status
    status copy_relationship_status DEFAULT 'active',

    -- Statistics
    total_trades_copied INTEGER DEFAULT 0,
    total_profit_loss DECIMAL(12, 2) DEFAULT 0.00,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(leader_id, follower_id),
    CONSTRAINT follower_not_leader CHECK (leader_id != follower_id)
);

-- Leader trades
CREATE TABLE leader_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Leader info
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,

    -- Trade details
    symbol TEXT NOT NULL,
    action trade_action NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    price DECIMAL(12, 4),
    order_type TEXT DEFAULT 'market',

    -- Asset type
    asset_type asset_type DEFAULT 'stock',

    -- Options-specific fields
    option_type option_type,
    strike_price DECIMAL(12, 4),
    expiration_date TEXT,
    contracts INTEGER,

    -- SnapTrade IDs
    universal_symbol_id TEXT,
    order_id TEXT,

    -- Stop-loss and take-profit (for monitoring)
    stop_loss DECIMAL(12, 4),
    take_profit DECIMAL(12, 4),

    -- Status
    processed BOOLEAN DEFAULT FALSE,
    is_exit BOOLEAN DEFAULT FALSE,

    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,

    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Copy executions
CREATE TABLE copy_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    trade_id UUID NOT NULL REFERENCES leader_trades(id) ON DELETE CASCADE,
    relationship_id UUID NOT NULL REFERENCES copy_relationships(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Execution details
    symbol TEXT NOT NULL,
    action trade_action NOT NULL,
    quantity DECIMAL(12, 4) NOT NULL,
    executed_price DECIMAL(12, 4),

    -- Asset type
    asset_type asset_type DEFAULT 'stock',

    -- Options-specific fields
    option_type option_type,
    strike_price DECIMAL(12, 4),
    expiration_date TEXT,
    contracts INTEGER,

    -- Risk management orders
    stop_loss_order_id TEXT,
    stop_loss_price DECIMAL(12, 4),
    take_profit_order_id TEXT,
    take_profit_price DECIMAL(12, 4),

    -- Status
    status execution_status DEFAULT 'pending',
    error_message TEXT,

    -- SnapTrade info
    order_id TEXT,
    account_id TEXT NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ,

    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Position snapshots (for trade detection)
CREATE TABLE position_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Account info
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,

    -- Position data (JSONB for flexibility)
    positions JSONB NOT NULL,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Leader reviews
CREATE TABLE leader_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Review content
    rating INTEGER NOT NULL,
    title TEXT,
    comment TEXT,

    -- Review metadata
    helpful_count INTEGER DEFAULT 0,
    is_verified_copy_trader BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(leader_id, reviewer_id),
    CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5)
);

-- Leader comments
CREATE TABLE leader_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commenter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES leader_comments(id) ON DELETE CASCADE,

    -- Comment content
    comment TEXT NOT NULL,

    -- Engagement
    likes_count INTEGER DEFAULT 0,

    -- Moderation
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification details
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Metadata (JSONB)
    metadata JSONB,

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom alerts
CREATE TABLE custom_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Alert configuration
    alert_type TEXT NOT NULL,
    params JSONB NOT NULL,

    -- Notification settings
    channels TEXT NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User relationship
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Channel preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    email_address TEXT,

    sms_enabled BOOLEAN DEFAULT FALSE,
    phone_number TEXT,

    discord_enabled BOOLEAN DEFAULT FALSE,
    discord_webhook_url TEXT,

    telegram_enabled BOOLEAN DEFAULT FALSE,
    telegram_chat_id TEXT,

    push_enabled BOOLEAN DEFAULT TRUE,

    -- Notification type preferences
    notify_on_trade_executed BOOLEAN DEFAULT TRUE,
    notify_on_trade_failed BOOLEAN DEFAULT TRUE,
    notify_on_leader_new_trade BOOLEAN DEFAULT TRUE,
    notify_on_performance_alert BOOLEAN DEFAULT TRUE,
    notify_on_daily_summary BOOLEAN DEFAULT FALSE,
    notify_on_leader_activity BOOLEAN DEFAULT FALSE,
    notify_on_new_follower BOOLEAN DEFAULT TRUE,
    notify_on_new_review BOOLEAN DEFAULT TRUE,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS & SUBSCRIPTIONS
-- ============================================

-- User subscriptions
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User relationship
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Stripe info
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,

    -- Subscription details
    plan_tier subscription_tier DEFAULT 'free',
    status subscription_status DEFAULT 'active',

    -- Billing period
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leader earnings
CREATE TABLE leader_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Stripe info
    stripe_connect_account_id TEXT,

    -- Earnings details
    gross_amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending',
    payout_id TEXT,
    paid_at TIMESTAMPTZ,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leader watchlist
CREATE TABLE leader_watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Symbol
    symbol TEXT NOT NULL,

    -- Timestamp
    added_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(leader_id, symbol)
);

-- ============================================
-- ADMIN & MONITORING
-- ============================================

-- Admin audit log
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Admin relationship
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Action details
    action TEXT NOT NULL,
    target_user_id UUID,
    metadata JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy trade errors
CREATE TABLE copy_trade_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leader_trade_id UUID REFERENCES leader_trades(id) ON DELETE SET NULL,

    -- Error details
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context JSONB,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leader stats (materialized view for performance)
CREATE TABLE leader_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Leader relationship
    leader_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Follower stats
    follower_count INTEGER DEFAULT 0,

    -- Trade stats
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0.00,

    -- ROI metrics
    roi_1m DECIMAL(10, 2) DEFAULT 0.00,
    roi_3m DECIMAL(10, 2) DEFAULT 0.00,
    roi_6m DECIMAL(10, 2) DEFAULT 0.00,
    roi_1y DECIMAL(10, 2) DEFAULT 0.00,
    roi_all_time DECIMAL(10, 2) DEFAULT 0.00,

    -- Risk metrics
    avg_trade_duration_hours DECIMAL(10, 2) DEFAULT 0.00,
    max_drawdown DECIMAL(10, 2) DEFAULT 0.00,
    sharpe_ratio DECIMAL(10, 4) DEFAULT 0.0000,
    sortino_ratio DECIMAL(10, 4) DEFAULT 0.0000,

    -- Portfolio metrics
    portfolio_value DECIMAL(15, 2) DEFAULT 0.00,
    last_trade_date TIMESTAMPTZ,

    -- Calculation timestamp
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_verified ON users(is_verified);
CREATE INDEX idx_users_is_public ON users(is_public);

-- Brokerage connections indexes
CREATE INDEX idx_brokerage_connections_user_id ON brokerage_connections(user_id);
CREATE INDEX idx_brokerage_connections_account_id ON brokerage_connections(account_id);
CREATE INDEX idx_brokerage_connections_status ON brokerage_connections(status);

-- Copy relationships indexes
CREATE INDEX idx_copy_relationships_leader_id ON copy_relationships(leader_id);
CREATE INDEX idx_copy_relationships_follower_id ON copy_relationships(follower_id);
CREATE INDEX idx_copy_relationships_status ON copy_relationships(status);
CREATE INDEX idx_copy_relationships_active ON copy_relationships(leader_id, status) WHERE status = 'active';

-- Leader trades indexes
CREATE INDEX idx_leader_trades_leader_id ON leader_trades(leader_id);
CREATE INDEX idx_leader_trades_symbol ON leader_trades(symbol);
CREATE INDEX idx_leader_trades_executed_at ON leader_trades(executed_at DESC);
CREATE INDEX idx_leader_trades_processed ON leader_trades(processed) WHERE processed = FALSE;

-- Copy executions indexes
CREATE INDEX idx_copy_executions_trade_id ON copy_executions(trade_id);
CREATE INDEX idx_copy_executions_relationship_id ON copy_executions(relationship_id);
CREATE INDEX idx_copy_executions_follower_id ON copy_executions(follower_id);
CREATE INDEX idx_copy_executions_status ON copy_executions(status);
CREATE INDEX idx_copy_executions_executed_at ON copy_executions(executed_at DESC);

-- Position snapshots indexes
CREATE INDEX idx_position_snapshots_user_id ON position_snapshots(user_id);
CREATE INDEX idx_position_snapshots_account_id ON position_snapshots(account_id);
CREATE INDEX idx_position_snapshots_created_at ON position_snapshots(created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Leader stats indexes
CREATE INDEX idx_leader_stats_roi_all_time ON leader_stats(roi_all_time DESC);
CREATE INDEX idx_leader_stats_follower_count ON leader_stats(follower_count DESC);
CREATE INDEX idx_leader_stats_sharpe_ratio ON leader_stats(sharpe_ratio DESC);

-- Leader reviews indexes
CREATE INDEX idx_leader_reviews_leader_id ON leader_reviews(leader_id);
CREATE INDEX idx_leader_reviews_rating ON leader_reviews(rating DESC);

-- Copy trade errors indexes
CREATE INDEX idx_copy_trade_errors_created_at ON copy_trade_errors(created_at DESC);
CREATE INDEX idx_copy_trade_errors_follower_id ON copy_trade_errors(follower_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_brokerage_connections_updated_at BEFORE UPDATE ON brokerage_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_copy_relationships_updated_at BEFORE UPDATE ON copy_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leader_reviews_updated_at BEFORE UPDATE ON leader_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leader_comments_updated_at BEFORE UPDATE ON leader_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_alerts_updated_at BEFORE UPDATE ON custom_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leader_stats_updated_at BEFORE UPDATE ON leader_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE brokerage_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE copy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leader_watchlist ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (clerk_user_id = auth.jwt()->>'sub');
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (clerk_user_id = auth.jwt()->>'sub');
CREATE POLICY "Public users viewable" ON users FOR SELECT USING (is_public = TRUE);

-- Brokerage connections policies
CREATE POLICY "Users can manage own connections" ON brokerage_connections FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Copy relationships policies
CREATE POLICY "Users can manage own relationships" ON copy_relationships FOR ALL USING (
    leader_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub') OR
    follower_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub')
);

-- Leader trades policies
CREATE POLICY "Leaders can manage own trades" ON leader_trades FOR ALL USING (leader_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));
CREATE POLICY "Followers can view leader trades" ON leader_trades FOR SELECT USING (
    leader_id IN (SELECT leader_id FROM copy_relationships WHERE follower_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'))
);

-- Copy executions policies
CREATE POLICY "Users can view own executions" ON copy_executions FOR SELECT USING (
    follower_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub') OR
    trade_id IN (SELECT id FROM leader_trades WHERE leader_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'))
);

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Note: Additional policies can be added as needed
