-- Update account_type column to only support demo and live
ALTER TABLE user_accounts 
DROP CONSTRAINT IF EXISTS user_accounts_account_type_check;

ALTER TABLE user_accounts 
ADD CONSTRAINT user_accounts_account_type_check 
CHECK (account_type IN ('demo', 'live'));

-- Update comment to reflect the new constraint
COMMENT ON COLUMN user_accounts.account_type IS 'Type of MT5 account: demo or live account';

-- Create index for faster account type lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_accounts_account_type ON user_accounts(account_type);