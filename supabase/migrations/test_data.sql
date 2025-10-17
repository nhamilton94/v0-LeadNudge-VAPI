-- =====================================================
-- TEST DATA FOR SETTINGS TAB
-- =====================================================
-- Purpose: Create sample data to test migrations
-- Run this AFTER applying the UP migrations
-- DO NOT run in production!
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE TEST ORGANIZATION
-- =====================================================

INSERT INTO public.organizations (id, name, domain, max_users, max_properties)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'ABC Realty',
    'abcrealty.com',
    100,
    50
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE TEST USERS (assuming they exist in auth.users)
-- =====================================================

-- Note: These users should exist in auth.users
-- This just creates their profiles

-- Admin user
INSERT INTO public.profiles (id, email, full_name, organization_id, status)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'admin@abcrealty.com',
    'John Admin',
    '11111111-1111-1111-1111-111111111111',
    'active'
) ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id;

-- Regular users
INSERT INTO public.profiles (id, email, full_name, organization_id, invited_by, invited_at, status)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'jane@abcrealty.com',
    'Jane Smith',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '5 days',
    'active'
) ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id;

INSERT INTO public.profiles (id, email, full_name, organization_id, invited_by, invited_at, status)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'mike@abcrealty.com',
    'Mike Johnson',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '3 days',
    'active'
) ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id;

-- =====================================================
-- 3. ASSIGN ROLES
-- =====================================================

-- Get role IDs
DO $$
DECLARE
    admin_role_id UUID;
    user_role_id UUID;
BEGIN
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role_id, organization_id, assigned_by)
    VALUES (
        '22222222-2222-2222-2222-222222222222',
        admin_role_id,
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    ) ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
    
    -- Assign user roles
    INSERT INTO public.user_roles (user_id, role_id, organization_id, assigned_by)
    VALUES (
        '33333333-3333-3333-3333-333333333333',
        user_role_id,
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    ) ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role_id, organization_id, assigned_by)
    VALUES (
        '44444444-4444-4444-4444-444444444444',
        user_role_id,
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222'
    ) ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
END $$;

-- =====================================================
-- 4. CREATE TEST PROPERTIES
-- =====================================================

INSERT INTO public.properties (id, address, city, state, organization_id)
VALUES 
    ('55555555-5555-5555-5555-555555555555', '123 Main St', 'San Francisco', 'CA', '11111111-1111-1111-1111-111111111111'),
    ('66666666-6666-6666-6666-666666666666', '456 Oak Ave', 'San Francisco', 'CA', '11111111-1111-1111-1111-111111111111'),
    ('77777777-7777-7777-7777-777777777777', '789 Pine Rd', 'Oakland', 'CA', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id;

-- =====================================================
-- 5. CREATE PROPERTY ASSIGNMENTS
-- =====================================================

-- Assign properties to Jane
INSERT INTO public.property_assignments (user_id, property_id, organization_id, assigned_by)
VALUES 
    ('33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'),
    ('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id, property_id, organization_id) DO NOTHING;

-- Assign properties to Mike
INSERT INTO public.property_assignments (user_id, property_id, organization_id, assigned_by)
VALUES 
    ('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (user_id, property_id, organization_id) DO NOTHING;

-- =====================================================
-- 6. CREATE TEST INVITATIONS
-- =====================================================

DO $$
DECLARE
    user_role_id UUID;
BEGIN
    SELECT id INTO user_role_id FROM public.roles WHERE name = 'user';
    
    -- Pending invitation
    INSERT INTO public.invitations (
        organization_id, 
        email, 
        role_id, 
        invited_by, 
        token, 
        status, 
        expires_at,
        properties_to_assign
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'newuser@abcrealty.com',
        user_role_id,
        '22222222-2222-2222-2222-222222222222',
        'test-token-' || gen_random_uuid(),
        'pending',
        NOW() + INTERVAL '6 days',
        '["55555555-5555-5555-5555-555555555555"]'::jsonb
    ) ON CONFLICT (token) DO NOTHING;
    
    -- Expired invitation (for testing)
    INSERT INTO public.invitations (
        organization_id, 
        email, 
        role_id, 
        invited_by, 
        token, 
        status, 
        expires_at
    ) VALUES (
        '11111111-1111-1111-1111-111111111111',
        'expired@abcrealty.com',
        user_role_id,
        '22222222-2222-2222-2222-222222222222',
        'expired-token-' || gen_random_uuid(),
        'pending',
        NOW() - INTERVAL '1 day'
    ) ON CONFLICT (token) DO NOTHING;
END $$;

-- =====================================================
-- 7. CREATE AUDIT LOG ENTRIES
-- =====================================================

INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
) VALUES 
    (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'user_invited',
        'invitation',
        null,
        '{"email": "newuser@abcrealty.com", "role": "user"}'::jsonb
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'property_assigned',
        'property_assignment',
        '55555555-5555-5555-5555-555555555555',
        '{"user_id": "33333333-3333-3333-3333-333333333333", "property": "123 Main St"}'::jsonb
    );

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- View organizations
SELECT 'Organizations:' as info;
SELECT id, name, domain FROM public.organizations;

-- View users with roles
SELECT 'Users with Roles:' as info;
SELECT 
    p.email,
    p.full_name,
    r.name as role,
    o.name as organization
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id
JOIN public.roles r ON ur.role_id = r.id
JOIN public.organizations o ON p.organization_id = o.id;

-- View properties
SELECT 'Properties:' as info;
SELECT id, address, city, state FROM public.properties;

-- View property assignments
SELECT 'Property Assignments:' as info;
SELECT 
    p.email as user_email,
    prop.address,
    prop.city
FROM public.property_assignments pa
JOIN public.profiles p ON pa.user_id = p.id
JOIN public.properties prop ON pa.property_id = prop.id;

-- View invitations
SELECT 'Invitations:' as info;
SELECT 
    email,
    status,
    expires_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        ELSE 'VALID'
    END as validity
FROM public.invitations;

-- View audit logs
SELECT 'Recent Audit Logs:' as info;
SELECT 
    action,
    entity_type,
    details,
    created_at
FROM public.audit_logs
ORDER BY created_at DESC;

-- =====================================================
-- TEST QUERIES
-- =====================================================

-- Test: Get user role
SELECT 'Test: Get User Role' as test;
SELECT * FROM public.get_user_role(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111'
);

-- Test: Check if user is admin
SELECT 'Test: Is User Admin?' as test;
SELECT public.is_user_admin(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111'
) as is_admin;

-- Test: Get user properties
SELECT 'Test: Get User Properties' as test;
SELECT * FROM public.get_user_properties('33333333-3333-3333-3333-333333333333');

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- Uncomment to remove test data
/*
BEGIN;

DELETE FROM public.audit_logs WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.invitations WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.property_assignments WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.properties WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.user_roles WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.profiles WHERE organization_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.organizations WHERE id = '11111111-1111-1111-1111-111111111111';

COMMIT;
*/


