/*
  # Admin Helper Functions

  1. New Functions
    - `get_all_users_email` - Returns a list of all user IDs and emails
    - `get_last_sign_in_times` - Returns the last sign-in time for each user

  2. Security
    - Functions are marked as SECURITY DEFINER to run with elevated privileges
    - Access is restricted to authenticated users only
*/

-- Function to get all user emails (for admin dashboard)
CREATE OR REPLACE FUNCTION get_all_users_email()
RETURNS TABLE (
  id uuid,
  email text
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_email() TO authenticated;

-- Function to get last sign-in times for all users
CREATE OR REPLACE FUNCTION get_last_sign_in_times()
RETURNS TABLE (
  user_id uuid,
  last_sign_in timestamptz
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.last_sign_in_at
  FROM auth.users au;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_last_sign_in_times() TO authenticated;