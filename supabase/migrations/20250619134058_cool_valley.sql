/*
  # Add User Plugins Table

  1. New Tables
    - `user_plugins` - Stores user purchased plugins
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plugin_id` (text, plugin identifier)
      - `name` (text, plugin name)
      - `description` (text, plugin description)
      - `token_cost` (integer, cost in tokens)
      - `is_active` (boolean, plugin status)
      - `expires_at` (timestamptz, expiration date)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `user_plugins` table
    - Add policy for authenticated users to manage their own plugins
*/

-- Create user_plugins table
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
CREATE POLICY "Users can manage their own plugins"
  ON user_plugins
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_plugins_updated_at
  BEFORE UPDATE ON user_plugins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();