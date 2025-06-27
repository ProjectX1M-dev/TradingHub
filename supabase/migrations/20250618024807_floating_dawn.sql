/*
  # Add bot_token column to trading_robots table

  1. Changes
    - Add bot_token column to trading_robots table
    - Add bot_token column to trading_signals table
    - Update webhook_logs to support bot-specific processing

  2. Security
    - Bot tokens are unique identifiers for webhook targeting
    - Each robot gets its own token for isolated signal processing
*/

-- Add bot_token column to trading_robots table
ALTER TABLE trading_robots 
ADD COLUMN IF NOT EXISTS bot_token text UNIQUE;

-- Add bot_token column to trading_signals table  
ALTER TABLE trading_signals
ADD COLUMN IF NOT EXISTS bot_token text;

-- Add comment to document the purpose
COMMENT ON COLUMN trading_robots.bot_token IS 'Unique token for this robot to receive targeted webhook signals';
COMMENT ON COLUMN trading_signals.bot_token IS 'Bot token that should process this signal';

-- Create index for faster bot token lookups
CREATE INDEX IF NOT EXISTS idx_trading_robots_bot_token ON trading_robots(bot_token);
CREATE INDEX IF NOT EXISTS idx_trading_signals_bot_token ON trading_signals(bot_token);