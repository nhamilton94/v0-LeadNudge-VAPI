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
    let { data: invitations, error: invitationsError } = await supabase
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

    // Check for expired invitations and update them (as per PRD audit requirements)
    const now = new Date();
    const expiredInvitations = invitations?.filter(inv => {
      const expiresAt = new Date(inv.expires_at);
      return inv.status === 'pending' && expiresAt < now;
    }) || [];

    // Update expired invitations and create audit logs
    if (expiredInvitations.length > 0) {
      const expiredIds = expiredInvitations.map(inv => inv.id);
      
      // Update status to expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .in('id', expiredIds);

      // Create audit logs for each expired invitation (PRD requirement)
      await supabase.from('audit_logs').insert(
        expiredInvitations.map(inv => ({
          organization_id: profile.organization_id,
          user_id: inv.invited_by,
          action: 'invitation_expired',
          entity_type: 'invitation',
          entity_id: inv.id,
          details: {
            email: inv.email,
            expires_at: inv.expires_at,
            expired_at: now.toISOString(),
          },
        }))
      );

      console.log(`[GET Invitations] Marked ${expiredInvitations.length} invitations as expired`);
      
      // Remove expired invitations from the list (they're no longer pending)
      invitations = invitations?.filter(inv => !expiredIds.includes(inv.id)) || [];
    }

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
      
      // Parse properties_to_assign (stored as JSON string)
      let propertiesToAssign: string[] = [];
      if (inv.properties_to_assign) {
        try {
          const parsed = typeof inv.properties_to_assign === 'string'
            ? JSON.parse(inv.properties_to_assign)
            : inv.properties_to_assign;
          propertiesToAssign = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.error('Error parsing properties_to_assign:', error);
          propertiesToAssign = [];
        }
      }
      
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
        propertiesToAssign,
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
    const { emails, roleId, propertyIds = [], reactivateDeactivated = false } = body;

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

    // Check if any emails already have accounts (active or inactive)
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('email, status, full_name, first_name, last_name')
      .eq('organization_id', profile.organization_id)
      .in('email', emails);

    // Separate active and inactive users
    const activeUsers = existingProfiles?.filter(p => p.status === 'active') || [];
    const deactivatedUsers = existingProfiles?.filter(p => p.status === 'inactive') || [];
    
    const activeEmails = activeUsers.map(p => p.email);
    
    // Block invitations to active users
    if (activeEmails.length > 0) {
      return NextResponse.json(
        { error: `Users already exist: ${activeEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // If deactivated users found and not confirmed for reactivation, prompt user
    if (deactivatedUsers.length > 0 && !reactivateDeactivated) {
      return NextResponse.json(
        { 
          requiresConfirmation: true,
          deactivatedUsers: deactivatedUsers.map(u => ({
            email: u.email,
            name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
          })),
          message: 'Some users were previously removed. Do you want to reactivate them?'
        },
        { status: 200 }
      );
    }

    // Reactivate deactivated users if confirmed
    const deactivatedEmails = deactivatedUsers.map(u => u.email);
    if (reactivateDeactivated && deactivatedEmails.length > 0) {
      console.log(`[Invite Users] Reactivating ${deactivatedEmails.length} deactivated users`);
      
      // Reactivate users by setting status to 'active'
      const { error: reactivateError } = await supabase
        .from('profiles')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('organization_id', profile.organization_id)
        .in('email', deactivatedEmails);

      if (reactivateError) {
        console.error('Error reactivating users:', reactivateError);
        return NextResponse.json({ error: 'Failed to reactivate users' }, { status: 500 });
      }

      // Log reactivation for each user
      await supabase.from('audit_logs').insert(
        deactivatedUsers.map(u => ({
          organization_id: profile.organization_id,
          user_id: user.id,
          action: 'user_reactivated',
          entity_type: 'profile',
          entity_id: null,
          details: {
            email: u.email,
            name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            reactivated_via: 'invitation',
          },
        }))
      );

      console.log(`[Invite Users] Successfully reactivated users: ${deactivatedEmails.join(', ')}`);
    }

    // Filter emails: exclude deactivated users if not reactivating
    const emailsToInvite = reactivateDeactivated 
      ? emails 
      : emails.filter(email => !deactivatedEmails.includes(email));

    // If all emails were deactivated and user chose not to reactivate, return success with message
    if (emailsToInvite.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No invitations sent. All users were deactivated.',
        skipped: deactivatedEmails,
      });
    }

    // Check if any emails have pending invitations
    const { data: pendingInvitations } = await supabase
      .from('invitations')
      .select('email')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'pending')
      .in('email', emailsToInvite);

    const pendingEmails = pendingInvitations?.map((i) => i.email) || [];
    
    if (pendingEmails.length > 0) {
      return NextResponse.json(
        { error: `Pending invitations already exist for: ${pendingEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Create invitations (for non-deactivated or reactivated users)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const invitationsToCreate = emailsToInvite.map((email) => ({
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
      emailsToInvite.map((email) => ({
        organization_id: profile.organization_id,
        user_id: user.id,
        action: 'invitation_sent',
        entity_type: 'invitation',
        entity_id: null,
        details: {
          email,
          role_id: roleId,
          properties_count: propertyIds.length,
          reactivated: deactivatedEmails.includes(email),
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
        console.error(`[Invitation API] Email failed for ${emailsToInvite[index]}:`, result.reason);
      }
    });

    console.log(`[Invitation API] Emails sent: ${successCount} succeeded, ${failedCount} failed`);

    // Build success message
    let message = `${emailsToInvite.length} invitation(s) created.`;
    if (successCount > 0) {
      message += ` ${successCount} email(s) sent.`;
    }
    if (failedCount > 0) {
      message += ` ${failedCount} email(s) failed to send. Check server logs for details.`;
    }

    // Add info about reactivated/skipped users
    const skippedCount = emails.length - emailsToInvite.length;
    if (reactivateDeactivated && deactivatedEmails.length > 0) {
      message += ` ${deactivatedEmails.length} user(s) reactivated.`;
    }
    if (skippedCount > 0 && !reactivateDeactivated) {
      message += ` ${skippedCount} deactivated user(s) skipped.`;
    }

    return NextResponse.json({
      success: true,
      message,
      invitations: createdInvitations,
      reactivated: reactivateDeactivated ? deactivatedEmails : [],
      skipped: !reactivateDeactivated ? deactivatedEmails : [],
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

