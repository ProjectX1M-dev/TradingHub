/*
  # Add account nickname field

  1. Changes
    - Add nickname field to user_accounts table
    - Add account_type check constraint
  
  2. Security
    - No changes to RLS policies
*/

-- Add account_name field if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'account_name'
  ) THEN
    ALTER TABLE user_accounts ADD COLUMN account_name text DEFAULT '';
  END IF;
END $$;

-- Add account_type check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'user_accounts' AND constraint_name = 'user_accounts_account_type_check'
  ) THEN
    ALTER TABLE user_accounts ADD CONSTRAINT user_accounts_account_type_check 
      CHECK (account_type IN ('demo', 'live', 'prop'));
  END IF;
END $$;