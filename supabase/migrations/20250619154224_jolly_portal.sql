-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved function to handle new user creation with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists boolean;
BEGIN
  -- Check if profile already exists to avoid duplicate key errors
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = new.id
  ) INTO profile_exists;
  
  -- Only insert profile if it doesn't exist
  IF NOT profile_exists THEN
    -- Insert a row into public.profiles
    INSERT INTO public.profiles (id, updated_at)
    VALUES (new.id, now());
  END IF;
  
  -- Check if user_tokens record already exists
  IF NOT EXISTS (SELECT 1 FROM public.user_tokens WHERE user_id = new.id) THEN
    -- Create initial token balance for new user
    INSERT INTO public.user_tokens (user_id, balance, earned, spent)
    VALUES (new.id, 100, 100, 0);
    
    -- Create welcome transaction
    INSERT INTO public.token_transactions (
      user_id, 
      type, 
      amount, 
      description, 
      related_service
    )
    VALUES (
      new.id, 
      'earned', 
      100, 
      'Welcome bonus - 100 free tokens!', 
      'welcome'
    );
  END IF;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the transaction
    RAISE NOTICE 'Error in handle_new_user function: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create profiles for existing users who don't have one
INSERT INTO public.profiles (id, updated_at)
SELECT id, now() FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Create user_tokens for existing users who don't have them
INSERT INTO public.user_tokens (user_id, balance, earned, spent)
SELECT id, 100, 100, 0 FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_tokens)
ON CONFLICT (user_id) DO NOTHING;

-- Create welcome transactions for users who just got tokens
INSERT INTO public.token_transactions (user_id, type, amount, description, related_service)
SELECT user_id, 'earned', 100, 'Welcome bonus - 100 free tokens!', 'welcome'
FROM public.user_tokens
WHERE user_id NOT IN (
  SELECT user_id FROM public.token_transactions 
  WHERE type = 'earned' AND description = 'Welcome bonus - 100 free tokens!'
)
ON CONFLICT DO NOTHING;

-- Ensure all policies exist for profiles table
DO $$
BEGIN
  -- Check if SELECT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON profiles
      FOR SELECT
      TO public
      USING (auth.uid() = id);
  END IF;

  -- Check if UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON profiles
      FOR UPDATE
      TO public
      USING (auth.uid() = id);
  END IF;

  -- Check if INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;