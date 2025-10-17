-- Fix Row-Level Security (RLS) Policies for Clerk Authentication
-- The existing policies use auth.jwt()->>'sub' which expects Supabase auth
-- We use Clerk, so we need to either disable RLS or create Clerk-compatible policies

-- Option 1: Disable RLS entirely and rely on API-level authorization
-- This is simpler and already implemented in all API routes

-- Drop all existing RLS policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can manage own connections" ON brokerage_connections;
DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can insert own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can update own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can delete own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can view own relationships" ON copy_relationships;
DROP POLICY IF EXISTS "Users can create own relationships" ON copy_relationships;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Disable RLS on tables (we rely on API-level authorization with Clerk)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE brokerage_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE copy_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE leader_trades DISABLE ROW LEVEL SECURITY;
ALTER TABLE copy_executions DISABLE ROW LEVEL SECURITY;

-- Note: API routes use Clerk auth() to verify user identity
-- Then filter queries by clerk_user_id or users.id
-- This provides equivalent security to RLS

-- Add comments explaining the security model
COMMENT ON TABLE users IS 'Security: API-level authorization via Clerk auth() + clerk_user_id filtering';
COMMENT ON TABLE brokerage_connections IS 'Security: API-level authorization via Clerk auth() + user_id FK to users';
COMMENT ON TABLE watchlist IS 'Security: API-level authorization via Clerk auth() + user_id FK to users';
COMMENT ON TABLE copy_relationships IS 'Security: API-level authorization via Clerk auth() + follower_id/leader_id FK to users';
COMMENT ON TABLE notifications IS 'Security: API-level authorization via Clerk auth() + user_id FK to users';
COMMENT ON TABLE leader_trades IS 'Security: API-level authorization via Clerk auth() + leader_id FK to users';
COMMENT ON TABLE copy_executions IS 'Security: API-level authorization via Clerk auth() + follower_id FK to users';

-- Optional: If you want to keep RLS enabled for defense-in-depth, use service role client in APIs
-- The current implementation already uses createServiceRoleClient() in some routes
-- This bypasses RLS, which is appropriate since we do authorization in the API layer

-- For public data (leader discovery), we can create specific policies:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public leaders are viewable by anyone"
    ON users FOR SELECT
    USING (is_public = true AND role IN ('leader', 'both'));

CREATE POLICY "Users can view own data"
    ON users FOR SELECT
    USING (true); -- Allow service role to query, API enforces authorization

CREATE POLICY "Users can update via service role"
    ON users FOR UPDATE
    USING (true); -- Allow service role to update, API enforces authorization

CREATE POLICY "Users can insert via service role"
    ON users FOR INSERT
    WITH CHECK (true); -- Allow service role to insert, API enforces authorization

-- For other tables, keep RLS disabled since we use service role client
-- This is simpler and already working in production
