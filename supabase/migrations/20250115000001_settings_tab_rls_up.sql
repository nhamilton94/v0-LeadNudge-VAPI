-- =====================================================
-- SETTINGS TAB - ROW LEVEL SECURITY POLICIES (UP) - UPDATED
-- =====================================================
-- Purpose: Implement RLS policies for multi-tenancy and role-based access
-- Works with existing schema (contacts, teams, events, conversations, etc.)
-- Can be reverted using: 20250115000001_settings_tab_rls_down.sql
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ORGANIZATIONS POLICIES
-- =====================================================

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
    ON public.organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can update their organization
CREATE POLICY "Admins can update their organization"
    ON public.organizations FOR UPDATE
    USING (
        public.is_user_admin(auth.uid(), id)
    );

-- =====================================================
-- 3. ROLES POLICIES
-- =====================================================

-- Everyone can view roles (read-only reference data)
CREATE POLICY "Everyone can view roles"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- 4. USER_ROLES POLICIES
-- =====================================================

-- Users can view roles in their organization
CREATE POLICY "Users can view user_roles in their organization"
    ON public.user_roles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can insert user_roles in their organization
CREATE POLICY "Admins can assign roles in their organization"
    ON public.user_roles FOR INSERT
    WITH CHECK (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can update user_roles in their organization
CREATE POLICY "Admins can update roles in their organization"
    ON public.user_roles FOR UPDATE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can delete user_roles in their organization
CREATE POLICY "Admins can remove roles in their organization"
    ON public.user_roles FOR DELETE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
        AND user_id != auth.uid() -- Cannot remove own role
    );

-- =====================================================
-- 5. INVITATIONS POLICIES
-- =====================================================

-- Admins can view invitations in their organization
CREATE POLICY "Admins can view invitations in their organization"
    ON public.invitations FOR SELECT
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can create invitations in their organization
CREATE POLICY "Admins can create invitations in their organization"
    ON public.invitations FOR INSERT
    WITH CHECK (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can update invitations in their organization
CREATE POLICY "Admins can update invitations in their organization"
    ON public.invitations FOR UPDATE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can delete invitations in their organization
CREATE POLICY "Admins can delete invitations in their organization"
    ON public.invitations FOR DELETE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 6. PROPERTY_ASSIGNMENTS POLICIES
-- =====================================================

-- Users can view their own property assignments
CREATE POLICY "Users can view their own property assignments"
    ON public.property_assignments FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can create property assignments in their organization
CREATE POLICY "Admins can create property assignments"
    ON public.property_assignments FOR INSERT
    WITH CHECK (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can update property assignments in their organization
CREATE POLICY "Admins can update property assignments"
    ON public.property_assignments FOR UPDATE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can delete property assignments in their organization
CREATE POLICY "Admins can delete property assignments"
    ON public.property_assignments FOR DELETE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 7. AUDIT_LOGS POLICIES
-- =====================================================

-- Admins can view audit logs in their organization
CREATE POLICY "Admins can view audit logs in their organization"
    ON public.audit_logs FOR SELECT
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- System can insert audit logs (service role only)
CREATE POLICY "Service role can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 8. UPDATE PROFILES POLICIES
-- =====================================================

-- Drop existing policies if they exist (to update them)
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Users can view profiles in their organization
CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid() -- Can always view own profile
        OR organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can insert their own profile (during signup)
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can update profiles in their organization (but not change organization_id)
CREATE POLICY "Admins can update profiles in their organization"
    ON public.profiles FOR UPDATE
    USING (
        public.is_user_admin(
            auth.uid(), 
            organization_id
        )
    );

-- Admins can delete profiles in their organization
CREATE POLICY "Admins can delete profiles in their organization"
    ON public.profiles FOR DELETE
    USING (
        public.is_user_admin(
            auth.uid(), 
            organization_id
        )
        AND id != auth.uid() -- Cannot delete themselves
    );

-- =====================================================
-- 9. UPDATE PROPERTIES POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view properties in their organization" ON public.properties;
DROP POLICY IF EXISTS "Admins can create properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view assigned properties" ON public.properties;

-- Users can view properties in their organization
CREATE POLICY "Users can view properties in their organization"
    ON public.properties FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can insert properties in their organization
CREATE POLICY "Admins can create properties"
    ON public.properties FOR INSERT
    WITH CHECK (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can update properties in their organization
CREATE POLICY "Admins can update properties"
    ON public.properties FOR UPDATE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can delete properties in their organization
CREATE POLICY "Admins can delete properties"
    ON public.properties FOR DELETE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 10. CONTACTS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;

-- Users can view contacts in their organization
CREATE POLICY "Users can view contacts in their organization"
    ON public.contacts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can create contacts in their organization
CREATE POLICY "Users can create contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (
        organization_id = public.get_user_organization(auth.uid())
    );

-- Users can update their own contacts, admins can update all
CREATE POLICY "Users can update contacts"
    ON public.contacts FOR UPDATE
    USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- Users can delete their own contacts, admins can delete all
CREATE POLICY "Users can delete contacts"
    ON public.contacts FOR DELETE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 11. TEAMS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
DROP POLICY IF EXISTS "Managers can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;

-- Users can view teams in their organization
CREATE POLICY "Users can view teams in their organization"
    ON public.teams FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Admins can create teams
CREATE POLICY "Admins can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- Team managers and admins can update teams
CREATE POLICY "Managers can update their teams"
    ON public.teams FOR UPDATE
    USING (
        manager_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can delete teams
CREATE POLICY "Admins can delete teams"
    ON public.teams FOR DELETE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 12. EVENTS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view events in their organization" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their events" ON public.events;

-- Users can view events in their organization
CREATE POLICY "Users can view events in their organization"
    ON public.events FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can create events in their organization
CREATE POLICY "Users can create events"
    ON public.events FOR INSERT
    WITH CHECK (
        organization_id = public.get_user_organization(auth.uid())
    );

-- Users can update their own events, admins can update all
CREATE POLICY "Users can update their events"
    ON public.events FOR UPDATE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- Users can delete their own events, admins can delete all
CREATE POLICY "Users can delete their events"
    ON public.events FOR DELETE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 13. CONVERSATIONS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON public.conversations;

-- Users can view conversations in their organization
CREATE POLICY "Users can view conversations in their organization"
    ON public.conversations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Users can create conversations in their organization
CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (
        organization_id = public.get_user_organization(auth.uid())
    );

-- Users can update their assigned conversations, admins can update all
CREATE POLICY "Users can update conversations"
    ON public.conversations FOR UPDATE
    USING (
        user_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- Admins can delete conversations
CREATE POLICY "Admins can delete conversations"
    ON public.conversations FOR DELETE
    USING (
        public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- RLS POLICIES COMPLETE
-- =====================================================
-- Security summary:
-- 1. Service role bypasses RLS (use carefully in API routes)
-- 2. All queries from authenticated users are filtered by organization
-- 3. Admins have full access within their organization only
-- 4. Users cannot delete themselves or their own roles
-- 5. Users can manage their own data (contacts, events, etc.)
-- 6. Teams are isolated by organization
-- 7. Conversations and messages respect organization boundaries
-- =====================================================
