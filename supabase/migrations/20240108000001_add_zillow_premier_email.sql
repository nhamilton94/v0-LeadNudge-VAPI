-- Add zillow_premier_email column to profiles table
ALTER TABLE profiles 
ADD COLUMN zillow_premier_email TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.zillow_premier_email IS 'Email address used for Zillow Premier Agent account';
