-- =====================================================
-- MIGRATION TRACKING
-- =====================================================
-- This file records our migrations in Supabase's migration history
-- Run this AFTER executing the main migrations
-- =====================================================

-- Insert migration records into supabase_migrations table
-- This ensures Supabase tracks these migrations properly

INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES 
  ('20250115000000', '20250115000000_settings_tab_schema_up', ARRAY['Schema changes for Settings Tab']),
  ('20250115000002', '20250115000002_add_auto_assignment_triggers', ARRAY['Auto-assignment triggers']),
  ('20250115000003', '20250115000003_simplified_rls', ARRAY['Row Level Security policies'])
ON CONFLICT (version) DO NOTHING;

-- Verify tracking
SELECT version, name
FROM supabase_migrations.schema_migrations 
WHERE version LIKE '202501150000%'
ORDER BY version;

