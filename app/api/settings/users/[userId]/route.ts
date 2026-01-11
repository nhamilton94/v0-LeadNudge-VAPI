import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * DELETE /api/settings/users/[userId]
 * Deactivate user from organization
 * Requires: Admin role
 * Note: This deactivates the user (sets status to 'inactive') to preserve historical data
 *       as per PRD requirements. The user cannot login but all historical data is preserved.
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

    // Prevent users from removing themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot remove your own account' }, { status: 400 });
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

    // Check if target user is in same organization and get their current status
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id, email, full_name, first_name, last_name, status')
      .eq('id', userId)
      .single();

    if (targetError || targetProfile?.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
    }

    // Check if user is already inactive
    if (targetProfile.status === 'inactive') {
      return NextResponse.json(
        { error: 'User is already deactivated' },
        { status: 400 }
      );
    }

    // Check if target user is the last admin
    const { data: adminCount } = await supabase
      .from('user_roles')
      .select('id, roles!inner(name)')
      .eq('organization_id', profile.organization_id)
      .eq('roles.name', 'admin');

    // If target user is admin and is the last one, prevent removal
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

    // Deactivate the user (preserves historical data as per PRD)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error deactivating user:', updateError);
      return NextResponse.json({ error: 'Failed to deactivate user' }, { status: 500 });
    }

    // Log the action (as per PRD audit requirements)
    await supabase.from('audit_logs').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: 'user_deactivated',
      entity_type: 'profile',
      entity_id: userId,
      details: {
        target_user_id: userId,
        target_user_email: targetProfile.email,
        target_user_name: targetProfile.full_name || `${targetProfile.first_name} ${targetProfile.last_name}`.trim(),
        previous_status: targetProfile.status,
        new_status: 'inactive',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully. Historical data has been preserved.',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/settings/users/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


