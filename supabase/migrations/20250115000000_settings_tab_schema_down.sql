-- =====================================================
-- SETTINGS TAB - DATABASE MIGRATION (DOWN/ROLLBACK) - UPDATED
-- =====================================================
-- Purpose: Revert all changes made by settings_tab_schema_up.sql
-- WARNING: This will delete all data in new tables!
-- =====================================================

-- Start transaction
BEGIN;

-- =====================================================
-- 1. DROP TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;

-- =====================================================
-- 2. DROP HELPER FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_organization(UUID);
DROP FUNCTION IF EXISTS public.expire_old_invitations();
DROP FUNCTION IF EXISTS public.get_user_properties(UUID);
DROP FUNCTION IF EXISTS public.is_user_admin(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID, UUID);
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- =====================================================
-- 3. REMOVE COLUMNS FROM CONVERSATIONS TABLE
-- =====================================================

ALTER TABLE public.conversations DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS public.idx_conversations_organization_id;

-- =====================================================
-- 4. REMOVE COLUMNS FROM EVENTS TABLE
-- =====================================================

ALTER TABLE public.events DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS public.idx_events_organization_id;

-- =====================================================
-- 5. REMOVE COLUMNS FROM TEAMS TABLE
-- =====================================================

ALTER TABLE public.teams DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS public.idx_teams_organization_id;

-- =====================================================
-- 6. REMOVE COLUMNS FROM CONTACTS TABLE
-- =====================================================

ALTER TABLE public.contacts DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS public.idx_contacts_organization_id;

-- =====================================================
-- 7. REMOVE COLUMNS FROM PROPERTIES TABLE
-- =====================================================

ALTER TABLE public.properties DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS public.idx_properties_organization_id;

-- =====================================================
-- 8. REMOVE COLUMNS FROM PROFILES TABLE
-- =====================================================

ALTER TABLE public.profiles DROP COLUMN IF EXISTS status;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS last_login_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS invited_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS invited_by;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organization_id;
DROP INDEX IF EXISTS public.idx_profiles_organization_id;

-- =====================================================
-- 9. DROP AUDIT_LOGS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_audit_logs_organization_id;

-- =====================================================
-- 10. DROP PROPERTY_ASSIGNMENTS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.property_assignments CASCADE;
DROP INDEX IF EXISTS public.idx_property_assignments_organization_id;
DROP INDEX IF EXISTS public.idx_property_assignments_property_id;
DROP INDEX IF EXISTS public.idx_property_assignments_user_id;

-- =====================================================
-- 11. DROP INVITATIONS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.invitations CASCADE;
DROP INDEX IF EXISTS public.idx_invitations_expires_at;
DROP INDEX IF EXISTS public.idx_invitations_organization_id;
DROP INDEX IF EXISTS public.idx_invitations_status;
DROP INDEX IF EXISTS public.idx_invitations_token;
DROP INDEX IF EXISTS public.idx_invitations_email;

-- =====================================================
-- 12. DROP USER_ROLES TABLE
-- =====================================================

DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP INDEX IF EXISTS public.idx_user_roles_organization_id;
DROP INDEX IF EXISTS public.idx_user_roles_role_id;
DROP INDEX IF EXISTS public.idx_user_roles_user_id;

-- =====================================================
-- 13. DROP ROLES TABLE
-- =====================================================

DROP TABLE IF EXISTS public.roles CASCADE;

-- =====================================================
-- 14. DROP ORGANIZATIONS TABLE
-- =====================================================

DROP TABLE IF EXISTS public.organizations CASCADE;
DROP INDEX IF EXISTS public.idx_organizations_created_at;
DROP INDEX IF EXISTS public.idx_organizations_domain;

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================
-- All Settings Tab changes have been reverted.
-- Your database is back to its previous state.
-- Note: The existing profiles.role column remains unchanged.
-- =====================================================
