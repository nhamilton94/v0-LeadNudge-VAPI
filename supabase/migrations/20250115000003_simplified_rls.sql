-- =====================================================
-- SIMPLIFIED RLS POLICIES (DEFAULT ORGANIZATION)
-- =====================================================
-- Purpose: Simple RLS policies for default organization approach
-- All users auto-assigned to default organization via triggers
-- Multi-org support can be added later without breaking changes
-- =====================================================

BEGIN;

-- =====================================================
-- 1. PROFILES POLICIES (Simplified)
-- =====================================================

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles (backward compatible)" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile (backward compatible)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (backward compatible)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles (backward compatible)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles (backward compatible)" ON public.profiles;

-- Simple SELECT: View profiles in same organization
CREATE POLICY "Users can view profiles in their organization"
    ON public.profiles FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Simple INSERT: User can create own profile (signup)
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Simple UPDATE: Own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can update profiles in their organization
CREATE POLICY "Admins can update profiles in organization"
    ON public.profiles FOR UPDATE
    USING (
        public.is_user_admin(
            auth.uid(), 
            organization_id
        )
    );

-- Admins can delete profiles (except themselves)
CREATE POLICY "Admins can delete profiles"
    ON public.profiles FOR DELETE
    USING (
        id != auth.uid()
        AND public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 2. PROPERTIES POLICIES (Simplified)
-- =====================================================

DROP POLICY IF EXISTS "Users can view properties in their organization" ON public.properties;
DROP POLICY IF EXISTS "Users can view properties (backward compatible)" ON public.properties;
DROP POLICY IF EXISTS "Users can create properties" ON public.properties;
DROP POLICY IF EXISTS "Users can create properties (backward compatible)" ON public.properties;
DROP POLICY IF EXISTS "Admins can create properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update properties (backward compatible)" ON public.properties;
DROP POLICY IF EXISTS "Admins can update properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete properties (backward compatible)" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;

CREATE POLICY "Users can view properties in their organization"
    ON public.properties FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create properties"
    ON public.properties FOR INSERT
    WITH CHECK (true); -- Trigger will assign organization_id

CREATE POLICY "Creators and admins can update properties"
    ON public.properties FOR UPDATE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

CREATE POLICY "Creators and admins can delete properties"
    ON public.properties FOR DELETE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 3. CONTACTS POLICIES (Simplified)
-- =====================================================

DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can view contacts (backward compatible)" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can create contacts (backward compatible)" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts (backward compatible)" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts (backward compatible)" ON public.contacts;

CREATE POLICY "Users can view contacts in their organization"
    ON public.contacts FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (true); -- Trigger will assign organization_id

CREATE POLICY "Users can update their contacts"
    ON public.contacts FOR UPDATE
    USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

CREATE POLICY "Users can delete their contacts"
    ON public.contacts FOR DELETE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 4. TEAMS POLICIES (Simplified)
-- =====================================================

DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams (backward compatible)" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams (backward compatible)" ON public.teams;
DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can update teams" ON public.teams;
DROP POLICY IF EXISTS "Users can update teams (backward compatible)" ON public.teams;
DROP POLICY IF EXISTS "Managers can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Users can delete teams" ON public.teams;
DROP POLICY IF EXISTS "Users can delete teams (backward compatible)" ON public.teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;

CREATE POLICY "Users can view teams in their organization"
    ON public.teams FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create teams"
    ON public.teams FOR INSERT
    WITH CHECK (true); -- Trigger will assign organization_id

CREATE POLICY "Managers can update their teams"
    ON public.teams FOR UPDATE
    USING (
        manager_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

CREATE POLICY "Managers can delete their teams"
    ON public.teams FOR DELETE
    USING (
        manager_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 5. EVENTS POLICIES (Simplified)
-- =====================================================

DROP POLICY IF EXISTS "Users can view events in their organization" ON public.events;
DROP POLICY IF EXISTS "Users can view events (backward compatible)" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can create events (backward compatible)" ON public.events;
DROP POLICY IF EXISTS "Users can update events" ON public.events;
DROP POLICY IF EXISTS "Users can update their events" ON public.events;
DROP POLICY IF EXISTS "Users can update events (backward compatible)" ON public.events;
DROP POLICY IF EXISTS "Users can delete events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their events" ON public.events;
DROP POLICY IF EXISTS "Users can delete events (backward compatible)" ON public.events;

CREATE POLICY "Users can view events in their organization"
    ON public.events FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create events"
    ON public.events FOR INSERT
    WITH CHECK (true); -- Trigger will assign organization_id

CREATE POLICY "Creators can update their events"
    ON public.events FOR UPDATE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

CREATE POLICY "Creators can delete their events"
    ON public.events FOR DELETE
    USING (
        created_by = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

-- =====================================================
-- 6. CONVERSATIONS POLICIES (Simplified)
-- =====================================================

DROP POLICY IF EXISTS "Users can view conversations in their organization" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations (backward compatible)" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations (backward compatible)" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations (backward compatible)" ON public.conversations;
DROP POLICY IF EXISTS "Admins can delete conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can delete conversations (backward compatible)" ON public.conversations;

CREATE POLICY "Users can view conversations in their organization"
    ON public.conversations FOR SELECT
    USING (
        organization_id = (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (true); -- Trigger will assign organization_id

CREATE POLICY "Users can update their conversations"
    ON public.conversations FOR UPDATE
    USING (
        user_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

CREATE POLICY "Admins can delete conversations"
    ON public.conversations FOR DELETE
    USING (
        user_id = auth.uid()
        OR public.is_user_admin(auth.uid(), organization_id)
    );

COMMIT;

-- =====================================================
-- SIMPLIFIED RLS COMPLETE
-- =====================================================
-- Summary:
-- 1. All policies check organization_id match (simple!)
-- 2. No NULL checks needed (triggers handle everything)
-- 3. All users auto-assigned to default organization
-- 4. Settings Tab works with default organization
-- 5. Multi-org can be added later without breaking changes
--
-- Benefits:
-- - Cleaner code
-- - Easier to understand
-- - Better performance (no NULL checks)
-- - Still future-proof for multi-org
-- =====================================================

