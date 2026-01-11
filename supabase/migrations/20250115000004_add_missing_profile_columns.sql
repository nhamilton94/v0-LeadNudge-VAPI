-- =====================================================
-- ADD MISSING PROFILE COLUMNS FOR SETTINGS TAB
-- =====================================================

BEGIN;

-- Add missing columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
        AND ur.organization_id = p_organization_id
        AND r.name = 'admin'
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$;

-- Create helper function to update last login
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET last_login_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Create trigger to update last_login_at on auth
-- Note: This trigger fires on auth.users table updates
-- You might need to manually call this from your auth flow

COMMIT;
