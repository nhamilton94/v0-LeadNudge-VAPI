import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * PATCH /api/settings/users/[userId]/role
 * Update user's role in the organization
 * Requires: Admin role
 * Body: { roleId: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { userId } = params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_user_admin', {
      p_user_id: user.id,
      p_organization_id: profile.organization_id,
    });

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Prevent users from changing their own role
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Get the new role ID from request body
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'roleId is required' }, { status: 400 });
    }

    // Verify the role exists
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('id, name')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if target user is in same organization
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (targetError || targetProfile?.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
    }

    // Get current user_role record
    const { data: currentUserRole } = await supabase
      .from('user_roles')
      .select('id, role_id')
      .eq('user_id', userId)
      .eq('organization_id', profile.organization_id)
      .single();

    if (!currentUserRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 404 });
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('user_roles')
      .update({
        role_id: roleId,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', currentUserRole.id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Log the action in audit logs
    await supabase.from('audit_logs').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: 'user_role_changed',
      entity_type: 'user_role',
      entity_id: userId,
      details: {
        target_user_id: userId,
        old_role_id: currentUserRole.role_id,
        new_role_id: roleId,
        new_role_name: role.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role.name}`,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/settings/users/[userId]/role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


