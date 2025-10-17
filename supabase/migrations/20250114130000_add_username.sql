-- Add username field to users table
-- This migration adds support for unique usernames during sign-up

-- Add username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add index for username lookups (for faster queries)
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add constraint for username format (alphanumeric, underscores, hyphens, 3-30 chars)
ALTER TABLE users ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$');

-- Add comment for documentation
COMMENT ON COLUMN users.username IS 'Unique username from Clerk authentication. Alphanumeric, underscores, hyphens allowed. 3-30 characters.';
