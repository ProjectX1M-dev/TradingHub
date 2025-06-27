/*
  # Add unique constraint to user_accounts table

  1. Changes
    - Add unique constraint on (user_id, mt5_username, mt5_server) columns
    - This allows the upsert operation in authStore.ts to work correctly

  2. Security
    - No changes to existing RLS policies
    - Maintains data integrity by preventing duplicate account entries
*/

-- Add unique constraint to prevent duplicate user account entries
ALTER TABLE user_accounts 
ADD CONSTRAINT unique_user_mt5_account 
UNIQUE (user_id, mt5_username, mt5_server);