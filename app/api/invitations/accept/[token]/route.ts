import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { firstName, lastName, password } = body;

    // Validate inputs
    if (!firstName || !lastName || !password) {
      return NextResponse.json(
        { error: 'First name, last name, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch and validate invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 404 }
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already used
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation is no longer valid' },
        { status: 410 }
      );
    }

    // Check if email already exists
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

    // Create Supabase Auth user with Admin Client
    const supabaseAdmin = createServerSupabaseClient();
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        },
      });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Create profile with organization
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: invitation.email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        organization_id: invitation.organization_id,
        status: 'active',
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    // Assign role from invitation (this will override the default admin role)
    const { error: roleError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role_id: invitation.role_id,
      organization_id: invitation.organization_id,
    });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Note: If role assignment fails, the trigger's default admin role will remain
    }

    // Assign properties if specified
    if (
      invitation.properties_to_assign &&
      Array.isArray(invitation.properties_to_assign) &&
      invitation.properties_to_assign.length > 0
    ) {
      const propertyAssignments = invitation.properties_to_assign.map(
        (propertyId: string) => ({
          user_id: userId,
          property_id: propertyId,
          assigned_by: invitation.invited_by,
        })
      );

      await supabase.from('property_assignments').insert(propertyAssignments);
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // Log audit event
    await supabase.from('audit_logs').insert({
      user_id: invitation.invited_by,
      action: 'invitation_accepted',
      resource_type: 'invitation',
      resource_id: invitation.id,
      metadata: {
        email: invitation.email,
        new_user_id: userId,
      },
    });

    // Sign in the user automatically
    const { data: sessionData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: password,
      });

    if (signInError || !sessionData.session) {
      console.error('Error signing in user:', signInError);
      // User created successfully but couldn't sign in automatically
      return NextResponse.json({
        success: true,
        message:
          'Account created successfully! Please sign in with your credentials.',
        redirectTo: '/login',
      });
    }

    // Return success with session
    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      session: sessionData.session,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}


