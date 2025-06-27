/*
  # VPS System Database Schema

  1. New Tables
    - `vps_plans` - Available VPS plans and their features
    - `user_tokens` - User token balances and transactions
    - `user_vps_subscriptions` - Active VPS subscriptions
    - `vps_instances` - Server instances for users
    - `token_transactions` - Token transaction history

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
*/

-- VPS Plans Table
CREATE TABLE IF NOT EXISTS vps_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  token_cost integer NOT NULL DEFAULT 0,
  duration text NOT NULL CHECK (duration IN ('monthly', 'yearly', 'lifetime')),
  features jsonb NOT NULL DEFAULT '[]',
  limits jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Tokens Table
CREATE TABLE IF NOT EXISTS user_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  earned integer NOT NULL DEFAULT 0,
  spent integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON user_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Token Transactions Table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earned', 'spent', 'purchased')),
  amount integer NOT NULL,
  description text NOT NULL,
  related_service text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON token_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User VPS Subscriptions Table
CREATE TABLE IF NOT EXISTS user_vps_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text REFERENCES vps_plans(id),
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  tokens_spent integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_vps_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions"
  ON user_vps_subscriptions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- VPS Instances Table
CREATE TABLE IF NOT EXISTS vps_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES user_vps_subscriptions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'starting' CHECK (status IN ('starting', 'running', 'stopped', 'error')),
  server_region text NOT NULL DEFAULT 'us-east-1',
  ip_address text,
  last_heartbeat timestamptz DEFAULT now(),
  uptime integer DEFAULT 0,
  resources jsonb DEFAULT '{"cpu": 0, "memory": 0, "storage": 0}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vps_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own instances"
  ON vps_instances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default VPS plans
INSERT INTO vps_plans (id, name, description, token_cost, duration, features, limits) VALUES
('free', 'Free', 'Basic trading in your browser', 0, 'lifetime', 
 '[{"id": "manual-trading", "name": "Manual Trading", "enabled": true}, {"id": "basic-robots", "name": "Basic Robots", "enabled": true}]',
 '{"maxRobots": 3, "maxPositions": 10, "trailingStops": false, "advancedRiskManagement": false}'),
 
('vps-basic', 'VPS Basic', '24/7 server-side trading', 100, 'monthly',
 '[{"id": "server-trading", "name": "24/7 Server Trading", "enabled": true}, {"id": "trailing-stops", "name": "Trailing Stops", "enabled": true}]',
 '{"maxRobots": 10, "maxPositions": 50, "trailingStops": true, "advancedRiskManagement": true}'),
 
('vps-pro', 'VPS Pro', 'Advanced trading features', 250, 'monthly',
 '[{"id": "advanced-trailing", "name": "Advanced Trailing Stops", "enabled": true}, {"id": "priority-execution", "name": "Priority Execution", "enabled": true}]',
 '{"maxRobots": 50, "maxPositions": 200, "trailingStops": true, "priorityExecution": true}'),
 
('vps-enterprise', 'VPS Enterprise', 'Institutional-grade platform', 500, 'monthly',
 '[{"id": "unlimited-everything", "name": "Unlimited Everything", "enabled": true}, {"id": "api-access", "name": "API Access", "enabled": true}]',
 '{"maxRobots": -1, "maxPositions": -1, "trailingStops": true, "apiAccess": true}');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vps_subscriptions_user_id ON user_vps_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_vps_instances_user_id ON vps_instances(user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_tokens_updated_at
  BEFORE UPDATE ON user_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_vps_subscriptions_updated_at
  BEFORE UPDATE ON user_vps_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vps_instances_updated_at
  BEFORE UPDATE ON vps_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();