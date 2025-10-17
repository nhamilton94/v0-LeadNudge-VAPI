import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/me
 * Get current authenticated user with their role
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user from auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        first_name,
        last_name,
        organization_id
      `)
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get user role separately
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name,
          description
        )
      `)
      .eq('user_id', authUser.id)
      .eq('organization_id', profile.organization_id)
      .limit(1)
      .single();

    if (roleError) {
      console.error('Error fetching user role:', roleError);
    }

    // Get the role from the separate query
    const role = userRoles?.roles || null;

    const user = {
      id: profile.id,
      email: profile.email,
      name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
      full_name: profile.full_name,
      role: role?.name || 'user',
      roleId: role?.id || null,
      organizationId: profile.organization_id,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Unexpected error in GET /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


