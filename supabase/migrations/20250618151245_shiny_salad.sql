/*
  # Add account type column to user_accounts table

  1. Changes
    - Add `account_type` column to `user_accounts` table
    - This allows differentiation between demo, live, and prop accounts
    - Enables conditional signal execution based on account type

  2. Security
    - No changes to existing RLS policies
    - Maintains data integrity and user isolation
*/

-- Add account_type column to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'demo' CHECK (account_type IN ('demo', 'live', 'prop'));

-- Add comment to document the purpose
COMMENT ON COLUMN user_accounts.account_type IS 'Type of MT5 account: demo, live, or prop firm account';

-- Create index for faster account type lookups
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_type ON user_accounts(account_type);