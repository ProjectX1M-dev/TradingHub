/*
  # Reintroduce Demo Account Type

  1. Changes
    - Drop the existing constraint that only allows 'live' and 'prop'
    - Add new constraint allowing 'demo', 'live', and 'prop'
    - Update comment to reflect the new constraint

  2. Security
    - No changes to RLS policies needed
    - Maintains data integrity with proper constraint validation
*/

-- Drop the existing constraint to allow re-adding 'demo'
ALTER TABLE user_accounts
DROP CONSTRAINT IF EXISTS user_accounts_account_type_check;

-- Add new constraint allowing 'demo', 'live', and 'prop'
ALTER TABLE user_accounts
ADD CONSTRAINT user_accounts_account_type_check
CHECK (account_type IN ('demo', 'live', 'prop'));

-- Update comment to reflect the new constraint
COMMENT ON COLUMN user_accounts.account_type IS 'Type of MT5 account: demo, live, or prop firm account';

-- Re-create index for faster account type lookups (if it was dropped, though it usually isn't by ALTER TABLE)
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_type ON user_accounts(account_type);