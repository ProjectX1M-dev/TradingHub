/*
  # Promo Codes System

  1. New Tables
    - `promo_codes` - Stores promotional discount codes
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `discount_percent` (integer)
      - `max_uses` (integer)
      - `used_count` (integer)
      - `expires_at` (timestamptz)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `promo_codes` table
    - Add policies for admin access
*/

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_uses integer NOT NULL DEFAULT 100,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for all users to view active promo codes
CREATE POLICY "Users can view active promo codes"
  ON promo_codes
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()) AND used_count < max_uses);

-- Create trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(code_to_check text)
RETURNS TABLE (
  is_valid boolean,
  discount_percent integer,
  message text
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  promo_record promo_codes%ROWTYPE;
BEGIN
  -- Find the promo code
  SELECT * INTO promo_record
  FROM promo_codes
  WHERE code = UPPER(code_to_check);
  
  -- Check if promo code exists
  IF promo_record.id IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Promo code not found';
    RETURN;
  END IF;
  
  -- Check if promo code is active
  IF NOT promo_record.is_active THEN
    RETURN QUERY SELECT false, 0, 'Promo code is inactive';
    RETURN;
  END IF;
  
  -- Check if promo code has expired
  IF promo_record.expires_at IS NOT NULL AND promo_record.expires_at < now() THEN
    RETURN QUERY SELECT false, 0, 'Promo code has expired';
    RETURN;
  END IF;
  
  -- Check if promo code has reached max uses
  IF promo_record.used_count >= promo_record.max_uses THEN
    RETURN QUERY SELECT false, 0, 'Promo code has reached maximum uses';
    RETURN;
  END IF;
  
  -- Promo code is valid
  RETURN QUERY SELECT true, promo_record.discount_percent, 'Promo code is valid';
EXCEPTION
  WHEN others THEN
    RETURN QUERY SELECT false, 0, 'Error validating promo code: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION validate_promo_code(text) TO authenticated;

-- Create function to use a promo code (increment used_count)
CREATE OR REPLACE FUNCTION use_promo_code(code_to_use text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  promo_record promo_codes%ROWTYPE;
BEGIN
  -- Find the promo code
  SELECT * INTO promo_record
  FROM promo_codes
  WHERE code = UPPER(code_to_use);
  
  -- Check if promo code exists and is valid
  IF promo_record.id IS NULL OR 
     NOT promo_record.is_active OR
     (promo_record.expires_at IS NOT NULL AND promo_record.expires_at < now()) OR
     promo_record.used_count >= promo_record.max_uses THEN
    RETURN false;
  END IF;
  
  -- Increment used_count
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE id = promo_record.id;
  
  RETURN true;
EXCEPTION
  WHEN others THEN
    RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION use_promo_code(text) TO authenticated;

-- Insert some sample promo codes
INSERT INTO promo_codes (code, discount_percent, max_uses, expires_at, is_active)
VALUES 
('WELCOME10', 10, 1000, now() + interval '30 days', true),
('SUMMER20', 20, 500, now() + interval '60 days', true),
('VIP50', 50, 100, now() + interval '14 days', true)
ON CONFLICT (code) DO NOTHING;