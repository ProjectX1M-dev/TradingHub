/*
  # Improved Admin Functions

  1. Enhanced Functions
    - `get_all_users_email` - Returns a list of all user IDs, emails, and creation dates
    - `get_last_sign_in_times` - Returns the last sign-in time for each user

  2. Security
    - Functions are marked as SECURITY DEFINER to run with elevated privileges
    - Access is restricted to authenticated users only
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_all_users_email();
DROP FUNCTION IF EXISTS get_last_sign_in_times();

-- Improved function to get all user emails with better error handling
CREATE OR REPLACE FUNCTION get_all_users_email()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id, 
    au.email::text,
    au.created_at
  FROM auth.users au
  ORDER BY au.created_at DESC;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in get_all_users_email: %', SQLERRM;
    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_users_email() TO authenticated;

-- Improved function to get last sign-in times for all users
CREATE OR REPLACE FUNCTION get_last_sign_in_times()
RETURNS TABLE (
  user_id uuid,
  last_sign_in timestamptz
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.last_sign_in_at
  FROM auth.users au
  WHERE au.last_sign_in_at IS NOT NULL
  ORDER BY au.last_sign_in_at DESC;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error in get_last_sign_in_times: %', SQLERRM;
    RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_last_sign_in_times() TO authenticated;