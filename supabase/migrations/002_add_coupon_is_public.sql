-- Add is_public column to coupons table
ALTER TABLE coupons ADD COLUMN is_public BOOLEAN DEFAULT false NOT NULL;

-- Update existing coupons to be public by default
UPDATE coupons SET is_public = true WHERE is_public IS NULL;