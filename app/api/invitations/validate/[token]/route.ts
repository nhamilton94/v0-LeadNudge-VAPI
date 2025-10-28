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

    console.log('[Validate Invitation] Validating token:', token.substring(0, 10) + '...');

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

    console.log('[Validate Invitation] Invitation lookup result:', {
      found: !!invitation,
      email: invitation?.email,
      status: invitation?.status,
      error: error?.message
    });

    if (error || !invitation) {
      console.error('[Validate Invitation] Invitation not found:', error);
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

    // Check if email already has an account in this organization
    const { data: existingUser, error: profileError } = await supabase
      .from('profiles')
      .select('id, status, organization_id')
      .eq('email', invitation.email)
      .eq('organization_id', invitation.organization_id)
      .maybeSingle();

    console.log('[Validate Invitation] ===== EXISTING USER CHECK =====');
    console.log('[Validate Invitation] Email:', invitation.email);
    console.log('[Validate Invitation] Organization ID:', invitation.organization_id);
    console.log('[Validate Invitation] Profile found:', !!existingUser);
    console.log('[Validate Invitation] Profile status:', existingUser?.status);
    console.log('[Validate Invitation] Profile org matches:', existingUser?.organization_id === invitation.organization_id);
    console.log('[Validate Invitation] Query error:', profileError);
    console.log('[Validate Invitation] ===================================');

    // Handle different cases explicitly
    if (!existingUser) {
      // No profile exists - this is a completely new user
      console.log('[Validate Invitation] ✓ No existing profile - new user invitation');
    } else if (existingUser.status === 'inactive') {
      // Profile exists but is inactive - allow reactivation
      console.log('[Validate Invitation] ✓ User is INACTIVE - will be reactivated upon acceptance');
    } else if (existingUser.status === 'active') {
      // Profile exists and is active - reject
      console.log('[Validate Invitation] ✗ User is ACTIVE - rejecting invitation');
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    } else {
      // Unknown status - log and treat as inactive (allow invitation)
      console.log('[Validate Invitation] ⚠ Unknown status:', existingUser.status, '- allowing invitation');
    }

    // Return invitation details
    const inviterName = inviterProfile?.full_name || 
                        `${inviterProfile?.first_name || ''} ${inviterProfile?.last_name || ''}`.trim() ||
                        'Admin';
    
    // Parse properties_to_assign (stored as JSON string)
    let propertiesCount = 0;
    if (invitation.properties_to_assign) {
      try {
        const parsed = typeof invitation.properties_to_assign === 'string'
          ? JSON.parse(invitation.properties_to_assign)
          : invitation.properties_to_assign;
        propertiesCount = Array.isArray(parsed) ? parsed.length : 0;
      } catch (error) {
        console.error('Error parsing properties_to_assign:', error);
        propertiesCount = 0;
      }
    }
    
    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.roles?.name || 'user',
        organizationName: invitation.organizations?.name || 'Organization',
        invitedBy: inviterName,
        invitedByEmail: inviterProfile?.email || '',
        expiresAt: invitation.expires_at,
        propertiesCount,
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


