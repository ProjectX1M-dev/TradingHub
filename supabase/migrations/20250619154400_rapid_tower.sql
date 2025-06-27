-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved function to handle new user creation with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists boolean;
  tokens_exist boolean;
BEGIN
  -- Check if profile already exists to avoid duplicate key errors
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = new.id
  ) INTO profile_exists;
  
  -- Only insert profile if it doesn't exist
  IF NOT profile_exists THEN
    BEGIN
      -- Insert a row into public.profiles
      INSERT INTO public.profiles (id, updated_at)
      VALUES (new.id, now());
      
      RAISE NOTICE 'Created profile for user %', new.id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Profile already exists for user %', new.id;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key violation when creating profile for user %', new.id;
      WHEN others THEN
        RAISE NOTICE 'Error creating profile for user %: %', new.id, SQLERRM;
    END;
  END IF;
  
  -- Check if user_tokens record already exists
  SELECT EXISTS (
    SELECT 1 FROM public.user_tokens WHERE user_id = new.id
  ) INTO tokens_exist;
  
  -- Only create tokens if they don't exist
  IF NOT tokens_exist THEN
    BEGIN
      -- Create initial token balance for new user
      INSERT INTO public.user_tokens (user_id, balance, earned, spent)
      VALUES (new.id, 100, 100, 0);
      
      RAISE NOTICE 'Created tokens for user %', new.id;
      
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
      
      RAISE NOTICE 'Created welcome transaction for user %', new.id;
    EXCEPTION
      WHEN unique_violation THEN
        RAISE NOTICE 'Tokens already exist for user %', new.id;
      WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key violation when creating tokens for user %', new.id;
      WHEN others THEN
        RAISE NOTICE 'Error creating tokens for user %: %', new.id, SQLERRM;
    END;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users by creating missing profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Loop through all users in auth.users
  FOR user_record IN 
    SELECT id, email FROM auth.users
  LOOP
    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_record.id) THEN
      BEGIN
        -- Create profile
        INSERT INTO public.profiles (id, updated_at)
        VALUES (user_record.id, now());
        
        RAISE NOTICE 'Created missing profile for existing user %', user_record.id;
      EXCEPTION
        WHEN unique_violation THEN
          RAISE NOTICE 'Profile already exists for user %', user_record.id;
        WHEN foreign_key_violation THEN
          RAISE NOTICE 'Foreign key violation when creating profile for user %', user_record.id;
        WHEN others THEN
          RAISE NOTICE 'Error creating profile for user %: %', user_record.id, SQLERRM;
      END;
    END IF;
    
    -- Check if tokens exist
    IF NOT EXISTS (SELECT 1 FROM public.user_tokens WHERE user_id = user_record.id) THEN
      BEGIN
        -- Create tokens
        INSERT INTO public.user_tokens (user_id, balance, earned, spent)
        VALUES (user_record.id, 100, 100, 0);
        
        RAISE NOTICE 'Created missing tokens for existing user %', user_record.id;
        
        -- Create welcome transaction
        INSERT INTO public.token_transactions (
          user_id, 
          type, 
          amount, 
          description, 
          related_service
        )
        VALUES (
          user_record.id, 
          'earned', 
          100, 
          'Welcome bonus - 100 free tokens!', 
          'welcome'
        );
        
        RAISE NOTICE 'Created welcome transaction for existing user %', user_record.id;
      EXCEPTION
        WHEN unique_violation THEN
          RAISE NOTICE 'Tokens already exist for user %', user_record.id;
        WHEN foreign_key_violation THEN
          RAISE NOTICE 'Foreign key violation when creating tokens for user %', user_record.id;
        WHEN others THEN
          RAISE NOTICE 'Error creating tokens for user %: %', user_record.id, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

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