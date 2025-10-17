-- Fix watchlist user_id foreign key mismatch
-- Change from TEXT (referencing clerk_user_id) to UUID (referencing users.id)

-- Drop existing watchlist table
DROP TABLE IF EXISTS watchlist CASCADE;

-- Recreate watchlist table with correct foreign key
CREATE TABLE watchlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Fixed: was TEXT, now UUID
    symbol TEXT NOT NULL,
    company_name TEXT,
    price DECIMAL(12, 4),
    change_percent DECIMAL(6, 3),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate symbols per user
    UNIQUE(user_id, symbol)
);

-- Create indexes for performance
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);

-- Create trigger for updated_at
CREATE TRIGGER update_watchlist_updated_at
    BEFORE UPDATE ON watchlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using user.id (not clerk_user_id)
CREATE POLICY "Users can view own watchlist"
    ON watchlist FOR SELECT
    USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can insert own watchlist"
    ON watchlist FOR INSERT
    WITH CHECK (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can update own watchlist"
    ON watchlist FOR UPDATE
    USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

CREATE POLICY "Users can delete own watchlist"
    ON watchlist FOR DELETE
    USING (user_id = (SELECT id FROM users WHERE clerk_user_id = auth.jwt()->>'sub'));

-- Add comment
COMMENT ON TABLE watchlist IS 'User watchlists for tracking symbols of interest';
