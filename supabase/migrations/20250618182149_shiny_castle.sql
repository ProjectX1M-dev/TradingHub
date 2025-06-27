/*
  # Make symbol column required in trading_robots table

  1. Changes
    - Make the `symbol` column in `trading_robots` table NOT NULL
    - This enforces that every robot must have a specific symbol
    - Removes the ability to create "All Symbols" robots

  2. Data Migration
    - Update any existing robots with NULL symbols to have a default symbol
    - This ensures data consistency before applying the constraint

  3. Security
    - No changes to RLS policies needed
    - Maintains existing access controls
*/

-- First, update any existing robots with NULL symbols to have a default symbol
-- This prevents constraint violation errors
UPDATE trading_robots 
SET symbol = 'EURUSD' 
WHERE symbol IS NULL;

-- Now make the symbol column NOT NULL
ALTER TABLE trading_robots 
ALTER COLUMN symbol SET NOT NULL;

-- Update the comment to reflect the new requirement
COMMENT ON COLUMN trading_robots.symbol IS 'Symbol for the robot (required - each robot must be symbol-specific)';