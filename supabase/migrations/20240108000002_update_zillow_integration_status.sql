-- Drop the old boolean column and add the new status column
ALTER TABLE profiles DROP COLUMN IF EXISTS zillow_integration_active;

-- Add the new status column with enum-like constraint
ALTER TABLE profiles ADD COLUMN zillow_integration_status TEXT CHECK (zillow_integration_status IN ('inactive', 'pending', 'active', 'failed'));

-- Set default value to 'inactive' for existing records
UPDATE profiles SET zillow_integration_status = 'inactive' WHERE zillow_integration_status IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_zillow_integration_status ON profiles(zillow_integration_status);
