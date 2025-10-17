import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/settings/users
 * Get all users in the organization
 * Requires: Authenticated user
 * Returns: List of users with their roles and assigned properties
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile to get organization_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all users in the organization
    // Note: Only selecting columns that exist in current schema
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        created_at
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get user roles separately
    const userIds = users?.map((u) => u.id) || [];
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role_id,
        roles (
          id,
          name,
          description
        )
      `)
      .in('user_id', userIds)
      .eq('organization_id', profile.organization_id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    // Create a map of user roles
    const userRolesMap: Record<string, any[]> = {};
    userRoles?.forEach((ur) => {
      if (!userRolesMap[ur.user_id]) {
        userRolesMap[ur.user_id] = [];
      }
      userRolesMap[ur.user_id].push(ur);
    });

    // Get property assignments for all users
    const { data: assignments, error: assignmentsError } = await supabase
      .from('property_assignments')
      .select(`
        user_id,
        properties (
          id,
          address,
          city,
          state
        )
      `)
      .in('user_id', userIds);

    if (assignmentsError) {
      console.error('Error fetching property assignments:', assignmentsError);
    }

    // Format the response
    const formattedUsers = users?.map((user) => {
      const userAssignments = assignments?.filter((a) => a.user_id === user.id) || [];
      const properties = userAssignments.map((a) => a.properties);
      
      // Get the first role from the roles map (since we support multiple roles, but UI shows one for now)
      const userRolesList = userRolesMap[user.id] || [];
      const role = userRolesList.length > 0 ? userRolesList[0]?.roles : null;

      return {
        id: user.id,
        email: user.email,
        name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: role?.name || 'user',
        roleId: role?.id || null,
        status: 'active', // Default to active (column doesn't exist yet)
        properties,
        createdAt: user.created_at,
        // Optional fields that may be added later:
        // invitedBy: user.invited_by,
        // invitedAt: user.invited_at,
        // lastLoginAt: user.last_login_at,
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Unexpected error in GET /api/settings/users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


