import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

/**
 * DELETE /api/settings/invitations/[invitationId]
 * Cancel a pending invitation
 * Requires: Admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { invitationId: string } }
) {
  try {
    const supabase = createServerSupabaseClient();
    const { invitationId } = params;

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

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('id, email, organization_id, status')
      .eq('id', invitationId)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify invitation belongs to user's organization
    if (invitation.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if invitation can be cancelled
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel ${invitation.status} invitation` },
        { status: 400 }
      );
    }

    // Update invitation status to cancelled
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error cancelling invitation:', updateError);
      return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: 'invitation_cancelled',
      entity_type: 'invitation',
      entity_id: invitationId,
      details: {
        email: invitation.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation cancelled',
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/settings/invitations/[invitationId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


