-- Add zillow_integration_active column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zillow_integration_active BOOLEAN DEFAULT false;

-- Add new columns to contacts table
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS lead_source TEXT,
ADD COLUMN IF NOT EXISTS lead_status TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id);

-- Create index for better performance on email + user_id lookups
CREATE INDEX IF NOT EXISTS idx_contacts_email_user_id ON contacts(email, user_id);

-- Create index for zillow integration lookups
CREATE INDEX IF NOT EXISTS idx_profiles_zillow_integration ON profiles(zillow_integration_active) WHERE zillow_integration_active = true;

-- Add RLS policies for the new columns
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policy or create new ones if needed
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = created_by OR 
    auth.uid()::text = assigned_to
  );

DROP POLICY IF EXISTS "Users can insert their own contacts" ON contacts;
CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id OR 
    auth.uid()::text = created_by OR 
    auth.uid()::text = assigned_to
  );

DROP POLICY IF EXISTS "Users can update their own contacts" ON contacts;
CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (
    auth.uid()::text = user_id OR 
    auth.uid()::text = created_by OR 
    auth.uid()::text = assigned_to
  );
