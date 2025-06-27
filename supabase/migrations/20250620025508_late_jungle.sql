/*
  # Add MT5 Account ID to Trading Robots

  1. Changes
    - Add `mt5_account_id` column to `trading_robots` table
    - Add foreign key constraint to `user_accounts` table
    - Update RLS policies to filter by active MT5 account
    - Add index for better performance

  2. Security
    - Ensures users can only see and manage robots associated with their active MT5 account
    - Maintains existing user isolation through RLS
*/

-- Add mt5_account_id column to trading_robots table
ALTER TABLE trading_robots 
ADD COLUMN IF NOT EXISTS mt5_account_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE;

-- Add comment to document the purpose
COMMENT ON COLUMN trading_robots.mt5_account_id IS 'Links robot to specific MT5 account for multi-account support';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trading_robots_mt5_account_id ON trading_robots(mt5_account_id);

-- Drop existing RLS policy
DROP POLICY IF EXISTS "Users can manage their own robots" ON trading_robots;

-- Create new RLS policy that filters by both user_id and active MT5 account
CREATE POLICY "Users can manage their own robots with active account"
  ON trading_robots
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    (
      mt5_account_id IS NULL OR 
      mt5_account_id IN (
        SELECT id FROM user_accounts 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id AND 
    (
      mt5_account_id IS NULL OR 
      mt5_account_id IN (
        SELECT id FROM user_accounts 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Update existing robots to link them to their user's active MT5 account
-- This ensures existing robots remain visible after the migration
UPDATE trading_robots
SET mt5_account_id = (
  SELECT id FROM user_accounts
  WHERE user_accounts.user_id = trading_robots.user_id
  AND user_accounts.is_active = true
  LIMIT 1
)
WHERE mt5_account_id IS NULL;