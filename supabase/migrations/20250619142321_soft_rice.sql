-- Create plugins table if it doesn't exist
CREATE TABLE IF NOT EXISTS plugins (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  token_cost integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE plugins ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view plugins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'plugins' 
    AND policyname = 'Authenticated users can view plugins'
  ) THEN
    CREATE POLICY "Authenticated users can view plugins"
      ON plugins
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_plugins_updated_at'
  ) THEN
    CREATE TRIGGER update_plugins_updated_at
      BEFORE UPDATE ON plugins
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create user_plugins table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_plugins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  token_cost integer NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_user_plugins_user_id ON user_plugins(user_id);

-- Enable Row Level Security
ALTER TABLE user_plugins ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to manage their own plugins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_plugins' 
    AND policyname = 'Users can manage their own plugins'
  ) THEN
    CREATE POLICY "Users can manage their own plugins"
      ON user_plugins
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_plugins_updated_at'
  ) THEN
    CREATE TRIGGER update_user_plugins_updated_at
      BEFORE UPDATE ON user_plugins
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default plugins (using ON CONFLICT to avoid duplicates)
INSERT INTO plugins (id, name, description, token_cost, features, is_active)
VALUES 
('multi-account', 'Multi-Account Manager', 'Manage multiple trading accounts simultaneously', 200, 
 '[
    {"name": "Connect unlimited MT5 accounts", "description": "Link as many accounts as you need"},
    {"name": "Copy trades between accounts", "description": "Replicate trades across multiple accounts"},
    {"name": "Individual risk settings", "description": "Set different risk parameters per account"},
    {"name": "Consolidated reporting", "description": "View combined performance metrics"}
  ]'::jsonb, true),
  
('algo-bots', 'Algo Bot Pack', 'Advanced algorithmic trading bots', 300, 
 '[
    {"name": "10 premium trading strategies", "description": "Access to exclusive algorithmic strategies"},
    {"name": "Machine learning optimization", "description": "AI-powered parameter optimization"},
    {"name": "Custom indicators", "description": "Proprietary technical indicators"},
    {"name": "Backtesting tools", "description": "Test strategies against historical data"}
  ]'::jsonb, true),
  
('advanced-signals', 'Advanced Signals', 'Premium trading signals and alerts', 250, 
 '[
    {"name": "Professional signal providers", "description": "Access to expert trader signals"},
    {"name": "Real-time market alerts", "description": "Instant notifications for market events"},
    {"name": "Performance tracking", "description": "Track signal provider performance"},
    {"name": "Custom notification settings", "description": "Configure how you receive alerts"}
  ]'::jsonb, true),
  
('risk-manager-pro', 'Risk Manager Pro', 'Advanced risk management tools', 150, 
 '[
    {"name": "Portfolio-level risk analysis", "description": "Analyze risk across your entire portfolio"},
    {"name": "Drawdown protection", "description": "Automatic protection against excessive losses"},
    {"name": "Correlation monitoring", "description": "Track correlations between positions"},
    {"name": "Risk-adjusted position sizing", "description": "Optimize position sizes based on risk"}
  ]'::jsonb, true)
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  token_cost = EXCLUDED.token_cost,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = now();