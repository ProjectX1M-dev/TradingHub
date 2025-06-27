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

-- Add unique constraint to prevent duplicate plugins for a user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_plugins_user_id_plugin_id_key'
  ) THEN
    ALTER TABLE user_plugins ADD CONSTRAINT user_plugins_user_id_plugin_id_key UNIQUE (user_id, plugin_id);
  END IF;
END $$;