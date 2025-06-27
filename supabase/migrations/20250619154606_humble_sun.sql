/*
  # Fix profiles table foreign key constraint

  1. Changes
    - Drop the existing foreign key constraint on profiles table
    - Recreate the constraint to properly reference auth.users instead of public.users
    - This fixes the "violates foreign key constraint profiles_id_fkey" error

  2. Security
    - No changes to RLS policies
    - Maintains existing access controls
    - Ensures proper referential integrity
*/

-- First, drop the existing foreign key constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recreate the constraint to properly reference auth.users
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE;

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