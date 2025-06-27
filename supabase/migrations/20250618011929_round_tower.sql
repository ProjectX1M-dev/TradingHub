/*
  # Make robot symbols optional

  1. Changes
    - Make the `symbol` column in `trading_robots` table nullable
    - This allows robots to be created without a specific symbol
    - Robots with NULL symbol will respond to signals from any symbol

  2. Security
    - No changes to RLS policies needed
    - Existing constraints remain intact
*/

-- Make the symbol column nullable
ALTER TABLE trading_robots 
ALTER COLUMN symbol DROP NOT NULL;

-- Add a comment to explain the new behavior
COMMENT ON COLUMN trading_robots.symbol IS 'Symbol for the robot. NULL means robot applies to all symbols';