-- =====================================================
-- SETTINGS TAB - ROW LEVEL SECURITY POLICIES (DOWN/ROLLBACK) - UPDATED
-- =====================================================
-- Purpose: Remove all RLS policies added for Settings Tab
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. DROP CONVERSATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON public.conversations;

-- =====================================================
-- 2. DROP EVENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can delete their events" ON public.events;
DROP POLICY IF EXISTS "Users can update their events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can view events in their organization" ON public.events;

-- =====================================================
-- 3. DROP TEAMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;

-- =====================================================
-- 4. DROP CONTACTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;

-- =====================================================
-- 5. DROP PROPERTIES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can create properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view assigned properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view properties in their organization" ON public.properties;

-- =====================================================
-- 6. DROP PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- =====================================================
-- 7. DROP AUDIT_LOGS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs in their organization" ON public.audit_logs;

-- =====================================================
-- 8. DROP PROPERTY_ASSIGNMENTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete property assignments" ON public.property_assignments;
DROP POLICY IF EXISTS "Admins can update property assignments" ON public.property_assignments;
DROP POLICY IF EXISTS "Admins can create property assignments" ON public.property_assignments;
DROP POLICY IF EXISTS "Users can view their own property assignments" ON public.property_assignments;

-- =====================================================
-- 9. DROP INVITATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can delete invitations in their organization" ON public.invitations;
DROP POLICY IF EXISTS "Admins can update invitations in their organization" ON public.invitations;
DROP POLICY IF EXISTS "Admins can create invitations in their organization" ON public.invitations;
DROP POLICY IF EXISTS "Admins can view invitations in their organization" ON public.invitations;

-- =====================================================
-- 10. DROP USER_ROLES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can remove roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can assign roles in their organization" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view user_roles in their organization" ON public.user_roles;

-- =====================================================
-- 11. DROP ROLES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Everyone can view roles" ON public.roles;

-- =====================================================
-- 12. DROP ORGANIZATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- =====================================================
-- 13. DISABLE RLS ON NEW TABLES (Optional)
-- =====================================================

-- Note: You may want to keep RLS enabled even after removing policies
-- Uncomment these lines if you want to fully disable RLS:

-- ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.invitations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.property_assignments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Note: We do NOT disable RLS on existing tables (profiles, properties, contacts, etc.)
-- as they may have had RLS enabled before this migration

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- RLS ROLLBACK COMPLETE
-- =====================================================
-- All RLS policies for Settings Tab have been removed.
-- =====================================================
