/*
  # Update account types to remove demo and support live/prop only

  1. Changes
    - Update existing demo accounts to live accounts for data consistency
    - Drop existing account_type constraint
    - Add new constraint allowing only 'live' and 'prop' values
    - Update comment to reflect new allowed values

  2. Security
    - No changes to RLS policies needed
    - Maintains data integrity by updating existing records
*/

-- First, update any existing 'demo' account types to 'live' to maintain data consistency
UPDATE user_accounts 
SET account_type = 'live' 
WHERE account_type = 'demo';

-- Drop the existing constraint
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_account_type_check;

-- Add new constraint allowing only 'live' and 'prop'
ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_account_type_check 
CHECK (account_type IN ('live', 'prop'));

-- Update comment to reflect the new constraint
COMMENT ON COLUMN user_accounts.account_type IS 'Type of MT5 account: live or prop firm account';