import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/auth/me
 * Get current authenticated user's profile and role
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get current user from auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, first_name, last_name, organization_id, created_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for user:', {
        userId: user.id,
        userEmail: user.email,
        error: profileError,
      });
      
      return NextResponse.json({ 
        error: 'Profile not found',
        details: 'User authenticated but profile record missing. Please contact support.',
        userId: user.id,
        userEmail: user.email,
      }, { status: 404 });
    }

    // Get user's role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('organization_id', profile.organization_id)
      .single();

    const roleName = userRoles?.roles?.name || 'user';

    // Return user data with role
    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        full_name: profile.full_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        organization_id: profile.organization_id,
        role: roleName,
        created_at: profile.created_at,
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
