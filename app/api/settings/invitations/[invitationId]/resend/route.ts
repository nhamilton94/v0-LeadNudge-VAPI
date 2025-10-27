import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

/**
 * POST /api/settings/invitations/[invitationId]/resend
 * Resend an invitation (regenerates token and resets expiry)
 * Requires: Admin role
 */
export async function POST(
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

    // Only pending or expired invitations can be resent
    if (!['pending', 'expired'].includes(invitation.status)) {
      return NextResponse.json(
        { error: `Cannot resend ${invitation.status} invitation` },
        { status: 400 }
      );
    }

    // Generate new token and extend expiry
    const newToken = randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7); // 7 days from now

    // Update the invitation
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        token: newToken,
        expires_at: newExpiresAt.toISOString(),
        status: 'pending',
      })
      .eq('id', invitationId);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json({ error: 'Failed to resend invitation' }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      organization_id: profile.organization_id,
      user_id: user.id,
      action: 'invitation_resent',
      entity_type: 'invitation',
      entity_id: invitationId,
      details: {
        email: invitation.email,
        new_expires_at: newExpiresAt.toISOString(),
      },
    });

    // TODO: Send the new invitation email here
    // This will be implemented separately per user's request

    return NextResponse.json({
      success: true,
      message: 'Invitation resent',
      expiresAt: newExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/settings/invitations/[invitationId]/resend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


