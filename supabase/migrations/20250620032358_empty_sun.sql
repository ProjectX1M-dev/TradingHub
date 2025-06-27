/*
  # Add Token Circulation Stats Function

  1. New Functions
    - `get_token_circulation_stats` - Returns global token circulation statistics
    - This helps track total tokens in the system, earned, and spent

  2. Security
    - Function is marked as SECURITY DEFINER to run with elevated privileges
    - Access is restricted to authenticated users only
*/

-- Function to get token circulation statistics
CREATE OR REPLACE FUNCTION get_token_circulation_stats()
RETURNS TABLE (
  total_balance bigint,
  total_earned bigint,
  total_spent bigint,
  active_users bigint
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(balance), 0) as total_balance,
    COALESCE(SUM(earned), 0) as total_earned,
    COALESCE(SUM(spent), 0) as total_spent,
    COUNT(DISTINCT user_id) as active_users
  FROM user_tokens;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in get_token_circulation_stats: %', SQLERRM;
    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_token_circulation_stats() TO authenticated;