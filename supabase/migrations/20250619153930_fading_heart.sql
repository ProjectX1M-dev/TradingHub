/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add INSERT policy for `profiles` table to allow authenticated users to create their own profile
    - This resolves the "new row violates row-level security policy" error when new users try to create their profile

  The policy ensures users can only insert their own profile record by checking that the `id` matches their authenticated user ID.
*/

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);