-- Ensure phone field is required for customer profiles
-- Remove any phone verification columns if they exist
DO $$ 
BEGIN
    -- Remove verification columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE customer_profiles DROP COLUMN phone_verified;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_profiles' AND column_name = 'phone_verification_code') THEN
        ALTER TABLE customer_profiles DROP COLUMN phone_verification_code;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_profiles' AND column_name = 'phone_verification_expires_at') THEN
        ALTER TABLE customer_profiles DROP COLUMN phone_verification_expires_at;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_profiles' AND column_name = 'phone_verification_attempts') THEN
        ALTER TABLE customer_profiles DROP COLUMN phone_verification_attempts;
    END IF;
END $$;

-- Drop the verification index if it exists
DROP INDEX IF EXISTS idx_customer_profiles_phone_verification;

-- Ensure phone column exists and is properly configured
ALTER TABLE customer_profiles 
ALTER COLUMN phone SET NOT NULL;