-- Create watchlist table for tracking user's watched symbols
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(clerk_user_id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  exchange TEXT,
  type TEXT, -- stock, crypto, forex, etc.
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Create index for faster lookups
CREATE INDEX idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX idx_watchlist_symbol ON watchlist(symbol);

-- Enable Row Level Security
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own watchlist
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

-- Create policy: Users can insert their own watchlist items
CREATE POLICY "Users can insert their own watchlist items"
  ON watchlist FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Create policy: Users can update their own watchlist items
CREATE POLICY "Users can update their own watchlist items"
  ON watchlist FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

-- Create policy: Users can delete their own watchlist items
CREATE POLICY "Users can delete their own watchlist items"
  ON watchlist FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_watchlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER watchlist_updated_at
  BEFORE UPDATE ON watchlist
  FOR EACH ROW
  EXECUTE FUNCTION update_watchlist_updated_at();
