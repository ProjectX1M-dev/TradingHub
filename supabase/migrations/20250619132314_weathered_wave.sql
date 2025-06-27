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

-- Create function to update user profile data
CREATE OR REPLACE FUNCTION update_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user metadata in auth.users table
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'address', NEW.address,
    'years_experience', NEW.years_experience,
    'referral_code', NEW.referral_code,
    'how_heard_about', NEW.how_heard_about,
    'newsletter', NEW.newsletter
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;