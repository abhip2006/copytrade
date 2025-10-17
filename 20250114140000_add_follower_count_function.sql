-- Add PostgreSQL function to increment follower counts
-- This function is called when a new copy relationship is created

CREATE OR REPLACE FUNCTION increment_follower_count(leader_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET
    active_followers = COALESCE(active_followers, 0) + 1,
    total_followers = COALESCE(total_followers, 0) + 1,
    updated_at = NOW()
  WHERE id = leader_user_id;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION increment_follower_count(UUID) IS 'Increments active_followers and total_followers count for a leader when a new follower starts copying them';

-- Add function to decrement follower count (for when copy relationship ends)
CREATE OR REPLACE FUNCTION decrement_follower_count(leader_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET
    active_followers = GREATEST(COALESCE(active_followers, 1) - 1, 0),
    updated_at = NOW()
  WHERE id = leader_user_id;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION decrement_follower_count(UUID) IS 'Decrements active_followers count for a leader when a follower stops copying them';
