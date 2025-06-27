/*
  # Add INSERT policy for token_transactions table

  1. Security Changes
    - Add INSERT policy for `token_transactions` table
    - Allow authenticated users to insert their own transaction records
    - Users can only insert records where the user_id matches their auth.uid()

  This fixes the 403 error when trying to create new token transaction records.
*/

-- Add INSERT policy for token_transactions table
CREATE POLICY "Users can insert their own transactions"
  ON token_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);