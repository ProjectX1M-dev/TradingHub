/*
  # Add MT5 Token Column for Webhook Automation

  1. Changes
    - Add `mt5_token` column to `user_accounts` table to store MT5 API tokens
    - This enables automatic trade execution from webhook signals
    - Token will be encrypted at rest for security

  2. Security
    - Column is nullable to maintain backward compatibility
    - RLS policies remain unchanged - users can only access their own data
*/

-- Add mt5_token column to user_accounts table
ALTER TABLE user_accounts 
ADD COLUMN IF NOT EXISTS mt5_token text;

-- Add comment to document the purpose
COMMENT ON COLUMN user_accounts.mt5_token IS 'Encrypted MT5 API token for webhook automation';