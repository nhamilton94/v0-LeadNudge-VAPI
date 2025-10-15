-- =====================================================
-- SETTINGS TAB - DATABASE MIGRATION (UP) - UPDATED
-- =====================================================
-- Purpose: Implement multi-tenancy, roles, invitations, and property assignments
-- Works with existing schema (profiles.role, teams, contacts, etc.)
-- Can be reverted using: 20250115000000_settings_tab_schema_down.sql
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Settings
    max_users INTEGER,
    max_properties INTEGER,
    
    -- Metadata
    settings JSONB DEFAULT '{}',
    
    CONSTRAINT organizations_name_check CHECK (char_length(name) >= 1)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON public.organizations(domain);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at);

-- Add comment
COMMENT ON TABLE public.organizations IS 'Stores organization/company information for multi-tenancy';

-- =====================================================
-- 2. CREATE ROLES TABLE (for Settings Tab permissions)
-- =====================================================
-- Note: This is separate from the existing profiles.role enum
-- profiles.role = team/internal role (agent, manager, etc.)
-- user_roles = organization access role (admin, user)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT roles_name_check CHECK (char_length(name) >= 1)
);

-- Insert default roles for organization access
INSERT INTO public.roles (name, description, permissions) VALUES
    ('admin', 'Organization admin - can manage users, properties, and settings', '{"users": "full", "properties": "full", "settings": "full", "invitations": "full"}'),
    ('user', 'Organization user - limited access to assigned properties', '{"users": "read", "properties": "read", "settings": "read", "invitations": "none"}')
ON CONFLICT (name) DO NOTHING;

-- Add comment
COMMENT ON TABLE public.roles IS 'Organization-level access roles (separate from team roles in profiles.role)';

-- =====================================================
-- 3. CREATE USER_ROLES JUNCTION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate role assignments
    CONSTRAINT unique_user_role_org UNIQUE (user_id, role_id, organization_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON public.user_roles(organization_id);

-- Add comment
COMMENT ON TABLE public.user_roles IS 'Maps users to organization-level roles (supports multiple roles per user)';

-- =====================================================
-- 4. CREATE INVITATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    
    -- Metadata
    properties_to_assign JSONB DEFAULT '[]',
    
    CONSTRAINT invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT invitations_expires_check CHECK (expires_at > created_at)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);

-- Add comment
COMMENT ON TABLE public.invitations IS 'Stores pending and completed user invitations';

-- =====================================================
-- 5. CREATE PROPERTY_ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.property_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate assignments
    CONSTRAINT unique_user_property_org UNIQUE (user_id, property_id, organization_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_property_assignments_user_id ON public.property_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_property_id ON public.property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_organization_id ON public.property_assignments(organization_id);

-- Add comment
COMMENT ON TABLE public.property_assignments IS 'Maps users to properties they can access within an organization';

-- =====================================================
-- 6. CREATE AUDIT_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Add comment
COMMENT ON TABLE public.audit_logs IS 'Tracks all administrative actions for compliance and debugging';

-- =====================================================
-- 7. UPDATE PROFILES TABLE
-- =====================================================
-- Note: Keeping existing 'role' column (team role)
-- Adding organization_id for multi-tenancy

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
    END IF;
END $$;

-- Add invited_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'invited_by') THEN
        ALTER TABLE public.profiles ADD COLUMN invited_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add invited_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'invited_at') THEN
        ALTER TABLE public.profiles ADD COLUMN invited_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add last_login_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'last_login_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'profiles' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
            CHECK (status IN ('active', 'suspended', 'inactive'));
    END IF;
END $$;

COMMENT ON COLUMN public.profiles.role IS 'Team/internal role (agent, manager, etc.) - kept for backward compatibility';
COMMENT ON COLUMN public.profiles.organization_id IS 'Organization this user belongs to';

-- =====================================================
-- 8. UPDATE PROPERTIES TABLE
-- =====================================================

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'properties' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.properties ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_properties_organization_id ON public.properties(organization_id);
    END IF;
END $$;

COMMENT ON COLUMN public.properties.organization_id IS 'Organization that owns this property';

-- =====================================================
-- 9. UPDATE CONTACTS TABLE (for multi-tenancy)
-- =====================================================

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contacts' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.contacts ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);
    END IF;
END $$;

COMMENT ON COLUMN public.contacts.organization_id IS 'Organization that owns this contact';

-- =====================================================
-- 10. UPDATE TEAMS TABLE (for multi-tenancy)
-- =====================================================

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'teams' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.teams ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_teams_organization_id ON public.teams(organization_id);
    END IF;
END $$;

COMMENT ON COLUMN public.teams.organization_id IS 'Organization that owns this team';

-- =====================================================
-- 11. UPDATE EVENTS TABLE (for multi-tenancy)
-- =====================================================

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'events' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.events ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_events_organization_id ON public.events(organization_id);
    END IF;
END $$;

COMMENT ON COLUMN public.events.organization_id IS 'Organization that owns this event';

-- =====================================================
-- 12. UPDATE CONVERSATIONS TABLE (for multi-tenancy)
-- =====================================================

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'conversations' 
                   AND column_name = 'organization_id') THEN
        ALTER TABLE public.conversations ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        CREATE INDEX idx_conversations_organization_id ON public.conversations(organization_id);
    END IF;
END $$;

COMMENT ON COLUMN public.conversations.organization_id IS 'Organization that owns this conversation';

-- =====================================================
-- 13. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user's organization-level role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_organization_id UUID)
RETURNS TABLE (role_name VARCHAR, role_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.id
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id 
    AND ur.organization_id = p_organization_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_role IS 'Get user''s organization-level access role (admin/user)';

-- Function to check if user is organization admin
CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id UUID, p_organization_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id 
        AND ur.organization_id = p_organization_id
        AND r.name = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_user_admin IS 'Check if user has organization admin role';

-- Function to get user's assigned properties
CREATE OR REPLACE FUNCTION public.get_user_properties(p_user_id UUID)
RETURNS TABLE (
    property_id UUID,
    address TEXT,
    city TEXT,
    state TEXT,
    organization_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.address, p.city, p.state, p.organization_id
    FROM public.property_assignments pa
    JOIN public.properties p ON pa.property_id = p.id
    WHERE pa.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_properties IS 'Get all properties assigned to a user';

-- Function to auto-expire invitations
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.invitations
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.expire_old_invitations IS 'Auto-expire invitations older than 7 days (call via cron)';

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM public.profiles
    WHERE id = p_user_id;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_user_organization IS 'Get organization ID for a user';

-- =====================================================
-- 14. CREATE DEFAULT ORGANIZATION (FOR MIGRATION)
-- =====================================================

-- Create a default organization for existing users
INSERT INTO public.organizations (id, name, domain)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    'default.com'
) ON CONFLICT (id) DO NOTHING;

-- Update existing profiles to belong to default organization
UPDATE public.profiles
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Update existing properties to belong to default organization
UPDATE public.properties
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Update existing contacts to belong to default organization
UPDATE public.contacts
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Update existing teams to belong to default organization
UPDATE public.teams
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Update existing events to belong to default organization
UPDATE public.events
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Update existing conversations to belong to default organization
UPDATE public.conversations
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- =====================================================
-- 15. MIGRATE EXISTING USERS TO ROLES
-- =====================================================
-- Assign organization-level roles based on existing team role
-- If profiles.role = 'manager' or 'broker', make them admin
-- Otherwise, make them regular user

DO $$
DECLARE
    admin_role_id UUID;
    user_role_id UUID;
    profile_record RECORD;
BEGIN
    -- Get role IDs
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
    
    -- Loop through all profiles
    FOR profile_record IN SELECT id, role FROM public.profiles
    LOOP
        -- Check if user already has an organization role
        IF NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = profile_record.id 
            AND organization_id = '00000000-0000-0000-0000-000000000001'
        ) THEN
            -- Assign admin role if they're a manager/broker, otherwise user role
            -- Note: This assumes profiles.role is a text/enum field
            IF profile_record.role::text IN ('manager', 'broker', 'admin') THEN
                INSERT INTO public.user_roles (user_id, role_id, organization_id)
                VALUES (profile_record.id, admin_role_id, '00000000-0000-0000-0000-000000000001')
                ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
            ELSE
                INSERT INTO public.user_roles (user_id, role_id, organization_id)
                VALUES (profile_record.id, user_role_id, '00000000-0000-0000-0000-000000000001')
                ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
            END IF;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 16. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to organizations table
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary of changes:
-- 1. Created organizations, roles, user_roles, invitations, property_assignments, audit_logs tables
-- 2. Added organization_id to: profiles, properties, contacts, teams, events, conversations
-- 3. Created helper functions for role checking and property access
-- 4. Migrated existing data to default organization
-- 5. Assigned organization roles based on existing team roles
-- 6. Preserved existing profiles.role column for team/internal roles
--
-- Next steps:
-- 1. Review this migration
-- 2. Apply RLS policies (separate migration: 20250115000001_settings_tab_rls_up.sql)
-- 3. Test with sample data
-- 4. Run the down migration to test rollback if needed
-- =====================================================
