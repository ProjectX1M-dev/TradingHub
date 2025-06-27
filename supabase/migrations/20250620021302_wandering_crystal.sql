/*
  # Add ticket column to trading_signals table

  1. Changes
    - Add `ticket` column to `trading_signals` table
    - This allows for targeted position closing by ticket number
    - Enables more precise trade management

  2. Security
    - No changes to RLS policies needed
    - Maintains existing access controls
*/

-- Add ticket column to trading_signals table
ALTER TABLE trading_signals 
ADD COLUMN IF NOT EXISTS ticket bigint;

-- Add comment to document the purpose
COMMENT ON COLUMN trading_signals.ticket IS 'Ticket number for targeted position closing';