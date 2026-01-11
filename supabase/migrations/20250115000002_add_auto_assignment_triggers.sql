-- =====================================================
-- AUTO-ASSIGNMENT TRIGGERS FOR BACKWARD COMPATIBILITY
-- =====================================================
-- Purpose: Automatically assign organization_id when old code creates records
-- This allows old codebase to work without breaking
-- =====================================================

BEGIN;

-- =====================================================
-- 1. AUTO-ASSIGN ORGANIZATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_organization_to_profile()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- If organization_id is not set, assign to default organization
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := default_org_id;
        
        -- Also assign a default ADMIN role if not exists (so they can invite others)
        INSERT INTO public.user_roles (user_id, role_id, organization_id)
        SELECT 
            NEW.id,
            (SELECT id FROM public.roles WHERE name = 'admin' LIMIT 1),
            default_org_id
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = NEW.id 
            AND organization_id = default_org_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. AUTO-ASSIGN FOR PROPERTIES
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_organization_to_property()
RETURNS TRIGGER AS $$
DECLARE
    creator_org_id UUID;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NEW.organization_id IS NULL THEN
        -- Try to get creator's organization
        SELECT organization_id INTO creator_org_id
        FROM public.profiles
        WHERE id = NEW.created_by;
        
        -- If creator has organization, use it; otherwise use default
        NEW.organization_id := COALESCE(creator_org_id, default_org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. AUTO-ASSIGN FOR CONTACTS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_organization_to_contact()
RETURNS TRIGGER AS $$
DECLARE
    creator_org_id UUID;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NEW.organization_id IS NULL THEN
        -- Try to get creator's organization
        SELECT organization_id INTO creator_org_id
        FROM public.profiles
        WHERE id = NEW.created_by;
        
        -- If creator has organization, use it; otherwise use default
        NEW.organization_id := COALESCE(creator_org_id, default_org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. AUTO-ASSIGN FOR TEAMS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_organization_to_team()
RETURNS TRIGGER AS $$
DECLARE
    manager_org_id UUID;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NEW.organization_id IS NULL THEN
        -- Try to get manager's organization
        SELECT organization_id INTO manager_org_id
        FROM public.profiles
        WHERE id = NEW.manager_id;
        
        -- If manager has organization, use it; otherwise use default
        NEW.organization_id := COALESCE(manager_org_id, default_org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. AUTO-ASSIGN FOR EVENTS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_organization_to_event()
RETURNS TRIGGER AS $$
DECLARE
    creator_org_id UUID;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NEW.organization_id IS NULL THEN
        -- Try to get creator's organization
        SELECT organization_id INTO creator_org_id
        FROM public.profiles
        WHERE id = NEW.created_by;
        
        -- If creator has organization, use it; otherwise use default
        NEW.organization_id := COALESCE(creator_org_id, default_org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. AUTO-ASSIGN FOR CONVERSATIONS
-- =====================================================

CREATE OR REPLACE FUNCTION auto_assign_organization_to_conversation()
RETURNS TRIGGER AS $$
DECLARE
    user_org_id UUID;
    default_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    IF NEW.organization_id IS NULL THEN
        -- Try to get user's organization
        SELECT organization_id INTO user_org_id
        FROM public.profiles
        WHERE id = NEW.user_id;
        
        -- If user has organization, use it; otherwise use default
        NEW.organization_id := COALESCE(user_org_id, default_org_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

-- Profiles trigger
DROP TRIGGER IF EXISTS auto_assign_profile_organization ON public.profiles;
CREATE TRIGGER auto_assign_profile_organization
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_organization_to_profile();

-- Properties trigger
DROP TRIGGER IF EXISTS auto_assign_property_organization ON public.properties;
CREATE TRIGGER auto_assign_property_organization
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_organization_to_property();

-- Contacts trigger
DROP TRIGGER IF EXISTS auto_assign_contact_organization ON public.contacts;
CREATE TRIGGER auto_assign_contact_organization
    BEFORE INSERT ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_organization_to_contact();

-- Teams trigger
DROP TRIGGER IF EXISTS auto_assign_team_organization ON public.teams;
CREATE TRIGGER auto_assign_team_organization
    BEFORE INSERT ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_organization_to_team();

-- Events trigger
DROP TRIGGER IF EXISTS auto_assign_event_organization ON public.events;
CREATE TRIGGER auto_assign_event_organization
    BEFORE INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_organization_to_event();

-- Conversations trigger
DROP TRIGGER IF EXISTS auto_assign_conversation_organization ON public.conversations;
CREATE TRIGGER auto_assign_conversation_organization
    BEFORE INSERT ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_organization_to_conversation();

COMMIT;

-- =====================================================
-- AUTO-ASSIGNMENT TRIGGERS COMPLETE
-- =====================================================
-- Benefits:
-- 1. Old code can create records without organization_id
-- 2. Triggers automatically assign organization_id
-- 3. New records inherit creator's organization
-- 4. Falls back to default organization if needed
-- 5. Backward compatible with existing codebase
-- =====================================================

