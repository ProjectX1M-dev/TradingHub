/*
  # Trading Platform Database Schema

  1. New Tables
    - `user_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `mt5_username` (text)
      - `mt5_server` (text)
      - `account_name` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `trading_signals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symbol` (text)
      - `action` (text)
      - `volume` (decimal)
      - `price` (decimal)
      - `stop_loss` (decimal)
      - `take_profit` (decimal)
      - `source` (text)
      - `status` (text)
      - `executed_at` (timestamp)
      - `created_at` (timestamp)

    - `trading_robots`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `symbol` (text)
      - `strategy` (text)
      - `risk_level` (text)
      - `max_lot_size` (decimal)
      - `stop_loss` (integer)
      - `take_profit` (integer)
      - `is_active` (boolean)
      - `total_trades` (integer)
      - `win_rate` (decimal)
      - `profit` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `webhook_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `payload` (jsonb)
      - `source` (text)
      - `processed` (boolean)
      - `error_message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- User Accounts Table
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mt5_username text NOT NULL,
  mt5_server text NOT NULL,
  account_name text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own accounts"
  ON user_accounts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trading Signals Table
CREATE TABLE IF NOT EXISTS trading_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  action text NOT NULL CHECK (action IN ('BUY', 'SELL', 'CLOSE')),
  volume decimal(10,2) NOT NULL DEFAULT 0.01,
  price decimal(10,5),
  stop_loss decimal(10,5),
  take_profit decimal(10,5),
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
  executed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own signals"
  ON trading_signals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trading Robots Table
CREATE TABLE IF NOT EXISTS trading_robots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  symbol text NOT NULL,
  strategy text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  max_lot_size decimal(10,2) NOT NULL DEFAULT 0.01,
  stop_loss integer NOT NULL DEFAULT 50,
  take_profit integer NOT NULL DEFAULT 100,
  is_active boolean DEFAULT false,
  total_trades integer DEFAULT 0,
  win_rate decimal(5,2) DEFAULT 0.00,
  profit decimal(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE trading_robots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own robots"
  ON trading_robots
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Webhook Logs Table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  source text NOT NULL DEFAULT 'tradingview',
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own webhook logs"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_id ON trading_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_signals_created_at ON trading_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_robots_user_id ON trading_robots(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_robots_updated_at
  BEFORE UPDATE ON trading_robots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();