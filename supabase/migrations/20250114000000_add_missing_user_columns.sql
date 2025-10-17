/**
 * Migration: Add Missing User Columns
 * Date: 2025-01-14
 *
 * Adds missing columns to the users table that are referenced in the application:
 * - snaptrade_account_id: Stores the primary SnapTrade account ID
 * - snaptrade_authorization_id: Stores the SnapTrade authorization ID
 * - onboarding_completed: Tracks whether user completed onboarding
 * - avatar_url: Stores user avatar URL from Clerk
 */

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS snaptrade_account_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS snaptrade_authorization_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_snaptrade_account_id ON users(snaptrade_account_id);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Add comment to describe the columns
COMMENT ON COLUMN users.snaptrade_account_id IS 'Primary SnapTrade account ID selected by user';
COMMENT ON COLUMN users.snaptrade_authorization_id IS 'SnapTrade authorization ID for API access';
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN users.avatar_url IS 'User avatar image URL from Clerk authentication';
