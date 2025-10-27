import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * DELETE /api/settings/users/[userId]
 * Remove user from organization
 * Requires: Admin role
 * Note: This deletes the user's profile (cascade deletes will handle related records)
 */
export async function DELETE(
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

    // Prevent users from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
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

    // Check if target user is in same organization
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id, email, full_name')
      .eq('id', userId)
      .single();

    if (targetError || targetProfile?.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
    }

    // Check if target user is the last admin
    const { data: adminCount } = await supabase
      .from('user_roles')
      .select('id, roles!inner(name)')
      .eq('organization_id', profile.organization_id)
      .eq('roles.name', 'admin');

    // If target user is admin and is the last one, prevent deletion
    const { data: targetUserRoles } = await supabase
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', userId)
      .eq('organization_id', profile.organization_id);

    const isTargetAdmin = targetUserRoles?.some((ur: any) => ur.roles.name === 'admin');

    if (isTargetAdmin && adminCount && adminCount.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin from organization' },
        { status: 400 }
      );
    }

    // Delete the user profile (cascade will handle user_roles, property_assignments, etc.)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: 'user_removed',
      entity_type: 'profile',
      entity_id: userId,
      details: {
        target_user_id: userId,
        target_user_email: targetProfile.email,
        target_user_name: targetProfile.full_name,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User removed from organization',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/settings/users/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


