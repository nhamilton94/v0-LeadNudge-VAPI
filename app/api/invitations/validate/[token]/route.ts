import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch invitation details
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(
        `
        id,
        email,
        role_id,
        status,
        expires_at,
        organization_id,
        properties_to_assign,
        invited_by,
        roles (
          name
        ),
        organizations (
          name
        )
      `
      )
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Fetch inviter profile separately
    let inviterProfile = null;
    if (invitation.invited_by) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, email')
        .eq('id', invitation.invited_by)
        .single();
      
      inviterProfile = profile;
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    const isExpired = now > expiresAt;

    if (isExpired) {
      // Auto-update status to expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already accepted or cancelled
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error:
            invitation.status === 'accepted'
              ? 'This invitation has already been accepted'
              : 'This invitation has been cancelled',
        },
        { status: 410 }
      );
    }

    // Check if email already has an account
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Return invitation details
    const inviterName = inviterProfile?.full_name || 
                        `${inviterProfile?.first_name || ''} ${inviterProfile?.last_name || ''}`.trim() ||
                        'Admin';
    
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.roles?.name || 'user',
        organizationName: invitation.organizations?.name || 'Organization',
        invitedBy: inviterName,
        invitedByEmail: inviterProfile?.email || '',
        expiresAt: invitation.expires_at,
        propertiesCount: Array.isArray(invitation.properties_to_assign)
          ? invitation.properties_to_assign.length
          : 0,
      },
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}


