import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';
import { sendInvitationEmail } from '@/lib/services/email-service';

/**
 * GET /api/settings/invitations
 * Get all pending invitations for the organization
 * Requires: Admin role
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

    // Get all invitations for the organization
    // Fetch invitations (only pending ones for the "Pending Invitations" tab)
    const { data: invitations, error: invitationsError } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        status,
        created_at,
        expires_at,
        accepted_at,
        properties_to_assign,
        invited_by,
        roles (
          id,
          name,
          description
        )
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending') // Only fetch pending invitations
      .order('created_at', { ascending: false });

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    console.log(`[GET Invitations] Found ${invitations?.length || 0} pending invitations for organization ${profile.organization_id}`);

    // Get unique inviter IDs
    const inviterIds = [...new Set(invitations?.map(inv => inv.invited_by).filter(Boolean))];
    
    // Fetch inviter profiles
    let inviterProfiles: any = {};
    if (inviterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name')
        .in('id', inviterIds);
      
      if (profiles) {
        inviterProfiles = profiles.reduce((acc: any, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Format the response
    const formattedInvitations = invitations?.map((inv) => {
      const inviter = inviterProfiles[inv.invited_by];
      const inviterName = inviter?.full_name || 
                          `${inviter?.first_name || ''} ${inviter?.last_name || ''}`.trim() ||
                          inviter?.email || 
                          'Admin';
      
      return {
        id: inv.id,
        email: inv.email,
        role: inv.roles?.name || 'user',
        roleId: inv.roles?.id,
        status: inv.status,
        createdAt: inv.created_at,
        expiresAt: inv.expires_at,
        acceptedAt: inv.accepted_at,
        invitedBy: inviterName,
        propertiesToAssign: inv.properties_to_assign || [],
      };
    });

    return NextResponse.json({ invitations: formattedInvitations });
  } catch (error) {
    console.error('Unexpected error in GET /api/settings/invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/settings/invitations
 * Create new invitations
 * Requires: Admin role
 * Body: { emails: string[], roleId: string, propertyIds?: string[] }
 * Note: Email sending will be implemented separately
 */
export async function POST(request: NextRequest) {
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

    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        organization_id,
        full_name,
        first_name,
        last_name,
        email,
        organizations (
          name
        )
      `)
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

    // Get request body
    const body = await request.json();
    const { emails, roleId, propertyIds = [] } = body;

    // Validate input
    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'emails must be a non-empty array' }, { status: 400 });
    }

    if (!roleId) {
      return NextResponse.json({ error: 'roleId is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const invalidEmails = emails.filter((email) => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email format: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if any emails already have active accounts
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('email')
      .eq('organization_id', profile.organization_id)
      .in('email', emails);

    const existingEmails = existingProfiles?.map((p) => p.email) || [];
    
    if (existingEmails.length > 0) {
      return NextResponse.json(
        { error: `Users already exist: ${existingEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if any emails have pending invitations
    const { data: pendingInvitations } = await supabase
      .from('invitations')
      .select('email')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending')
      .in('email', emails);

    const pendingEmails = pendingInvitations?.map((i) => i.email) || [];
    
    if (pendingEmails.length > 0) {
      return NextResponse.json(
        { error: `Pending invitations already exist for: ${pendingEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Create invitations
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invitationsToCreate = emails.map((email) => ({
      organization_id: profile.organization_id,
      email: email.toLowerCase(),
      role_id: roleId,
      invited_by: user.id,
      token: randomBytes(32).toString('hex'),
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      properties_to_assign: propertyIds.length > 0 ? JSON.stringify(propertyIds) : '[]',
    }));

    const { data: createdInvitations, error: createError } = await supabase
      .from('invitations')
      .insert(invitationsToCreate)
      .select();

    if (createError) {
      console.error('Error creating invitations:', createError);
      return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert(
      emails.map((email) => ({
        organization_id: profile.organization_id,
        user_id: user.id,
        action: 'invitation_sent',
        entity_type: 'invitation',
        entity_id: null,
        details: {
          email,
          role_id: roleId,
          properties_count: propertyIds.length,
        },
      }))
    );

    // Get role name for email
    const { data: roleData } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single();

    const roleName = roleData?.name || 'User';

    // Send invitation emails
    const inviterName =
      profile.full_name ||
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
      'Admin';
    const organizationName = profile.organizations?.name || 'Default Organization';

    const emailResults = await Promise.allSettled(
      createdInvitations.map((invitation: any) =>
        sendInvitationEmail({
          to: invitation.email,
          invitedByName: inviterName,
          invitedByEmail: profile.email,
          organizationName,
          role: roleName,
          invitationToken: invitation.token,
          expiresAt: new Date(invitation.expires_at),
          propertiesCount: propertyIds.length,
        })
      )
    );

    // Log email results
    const successCount = emailResults.filter((r) => r.status === 'fulfilled').length;
    const failedCount = emailResults.filter((r) => r.status === 'rejected').length;
    
    // Log failed email details
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`[Invitation API] Email failed for ${emails[index]}:`, result.reason);
      }
    });

    console.log(`[Invitation API] Emails sent: ${successCount} succeeded, ${failedCount} failed`);

    let message = `${emails.length} invitation(s) created.`;
    if (successCount > 0) {
      message += ` ${successCount} email(s) sent.`;
    }
    if (failedCount > 0) {
      message += ` ${failedCount} email(s) failed to send. Check server logs for details.`;
    }

    return NextResponse.json({
      success: true,
      message,
      invitations: createdInvitations,
      emailStats: {
        sent: successCount,
        failed: failedCount,
      },
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/settings/invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

