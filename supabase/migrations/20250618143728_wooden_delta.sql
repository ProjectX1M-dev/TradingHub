/*
  # Increase Volume Precision for Trading Operations

  1. Changes
    - Increase `volume` column precision in `trading_signals` table from numeric(10,2) to numeric(10,5)
    - Increase `max_lot_size` column precision in `trading_robots` table from numeric(10,2) to numeric(10,5)
    - This allows for micro-lot precision (0.001) and other high-precision volume formats

  2. Benefits
    - Resolves "Invalid volume" errors when closing positions
    - Supports brokers that require higher precision for volume values
    - Maintains compatibility with existing data while allowing more precise values

  3. Security
    - No changes to RLS policies
    - Existing data remains intact with increased precision capability
*/

-- Increase volume precision in trading_signals table
ALTER TABLE trading_signals 
ALTER COLUMN volume TYPE numeric(10,5);

-- Increase max_lot_size precision in trading_robots table  
ALTER TABLE trading_robots
ALTER COLUMN max_lot_size TYPE numeric(10,5);

-- Update comments to reflect the new precision
COMMENT ON COLUMN trading_signals.volume IS 'Trading volume with 5 decimal places precision for micro-lots support';
COMMENT ON COLUMN trading_robots.max_lot_size IS 'Maximum lot size with 5 decimal places precision for micro-lots support';