-- Update properties table to support weekday/weekend pricing
-- Remove price_per_adult and price_per_child columns
-- Add weekday and weekend pricing columns

ALTER TABLE properties 
DROP COLUMN IF EXISTS price_per_adult,
DROP COLUMN IF EXISTS price_per_child,
DROP COLUMN IF EXISTS base_price_night;

-- Add new weekday/weekend pricing columns
ALTER TABLE properties 
ADD COLUMN weekday_price_night INTEGER NOT NULL DEFAULT 0,
ADD COLUMN weekend_price_night INTEGER NOT NULL DEFAULT 0;

-- Update any existing properties to have default pricing
-- Set weekend pricing 20% higher than weekday as a reasonable default
UPDATE properties 
SET weekday_price_night = 500,
    weekend_price_night = 600
WHERE weekday_price_night = 0 AND weekend_price_night = 0;