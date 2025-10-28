import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase/server';
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

    // Create Supabase Admin Client (uses service role key)
    const supabaseAdmin = createServerSupabaseAdminClient();
    
    let userId: string;
    let isNewUser = false;
    let isReactivation = false;

    // First check if there's an inactive profile with this email in this organization
    const { data: inactiveProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, status, organization_id')
      .eq('email', invitation.email)
      .eq('organization_id', invitation.organization_id)
      .maybeSingle();

    console.log('[Accept Invitation] Profile check:', {
      email: invitation.email,
      organizationId: invitation.organization_id,
      found: !!inactiveProfile,
      status: inactiveProfile?.status,
      organizationMatches: inactiveProfile?.organization_id === invitation.organization_id,
      error: profileCheckError
    });

    if (inactiveProfile && inactiveProfile.status === 'inactive') {
      console.log('[Accept Invitation] Found inactive profile, reactivating user:', invitation.email);
      
      userId = inactiveProfile.id;
      isReactivation = true;

      // Update password for the existing auth user
      const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (passwordError) {
        console.error('Error updating password for reactivated user:', passwordError);
        return NextResponse.json(
          { error: 'Failed to update account password' },
          { status: 500 }
        );
      }

      // Update user metadata
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        }
      );

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError);
        // Continue anyway, metadata is not critical
      }

      // Reactivate the profile
      const { error: reactivateError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
          status: 'active',
          organization_id: invitation.organization_id,
          invited_by: invitation.invited_by,
          invited_at: invitation.created_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (reactivateError) {
        console.error('Error reactivating profile:', reactivateError);
        return NextResponse.json(
          { error: 'Failed to reactivate account' },
          { status: 500 }
        );
      }

      console.log('Successfully reactivated user:', userId);
    } else {
      // No inactive profile found, proceed with normal user creation
      
      // Try to create auth user
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

      if (authError) {
        console.error('Error creating auth user:', authError);
        
        // Handle specific error: user already exists in auth
        if (authError.message?.includes('already been registered') || authError.code === 'email_exists') {
          console.log('Auth user already exists, checking for profile...');
          
          // Get existing user ID from auth
          const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
          const authUser = existingAuthUser?.users.find(u => u.email === invitation.email);
          
          if (!authUser) {
            return NextResponse.json(
              { error: 'User exists in auth but could not be retrieved. Please contact support.' },
              { status: 500 }
            );
          }
          
          userId = authUser.id;
          
          // Check if profile exists in this organization
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, status, organization_id')
            .eq('id', userId)
            .eq('organization_id', invitation.organization_id)
            .maybeSingle();

          if (existingProfile && existingProfile.status === 'active') {
            // Profile exists and is active in this organization - just redirect to login
            return NextResponse.json(
              { 
                error: 'An account with this email already exists. Please log in instead.',
                code: 'email_exists'
              },
              { status: 409 }
            );
          }
          
          // If profile exists but is inactive, we should reactivate it
          // This shouldn't normally happen as we check earlier, but handle it for safety
          if (existingProfile && existingProfile.status === 'inactive') {
            console.log('[Accept Invitation] Found inactive profile in fallback path, should reactivate');
            // Fall through to create profile logic which will fail, 
            // but this case should have been caught earlier
          }
          
          // Auth user exists but no profile - continue to create profile
          console.log('Profile missing for existing auth user, will create profile...');
        } else {
          // Some other auth error
          return NextResponse.json(
            { error: 'Failed to create account. Please try again.' },
            { status: 500 }
          );
        }
      } else {
        // New user created successfully
        if (!authData.user) {
          console.error('No user data returned from createUser');
          return NextResponse.json(
            { error: 'Failed to create account. Please try again.' },
            { status: 500 }
          );
        }
        
        userId = authData.user.id;
        isNewUser = true;
        console.log('New auth user created:', userId);
      }

      // Create profile with organization (using admin client to bypass RLS)
      const { error: profileError } = await supabaseAdmin
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
    }

    // Assign role from invitation (using admin client to bypass RLS)
    if (isReactivation) {
      // For reactivated users, update existing role or insert new one
      const { error: roleUpdateError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userId,
          role_id: invitation.role_id,
          organization_id: invitation.organization_id,
        }, {
          onConflict: 'user_id,organization_id'
        });

      if (roleUpdateError) {
        console.error('Error updating role for reactivated user:', roleUpdateError);
      }
    } else {
      // For new users, insert role
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: userId,
        role_id: invitation.role_id,
        organization_id: invitation.organization_id,
      });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Note: If role assignment fails, the trigger's default admin role will remain
      }
    }

    // Assign properties if specified (using admin client to bypass RLS)
    // Note: properties_to_assign is stored as JSON string in database
    let propertyIds: string[] = [];
    
    if (invitation.properties_to_assign) {
      try {
        // Parse JSON string to array
        if (typeof invitation.properties_to_assign === 'string') {
          propertyIds = JSON.parse(invitation.properties_to_assign);
        } else if (Array.isArray(invitation.properties_to_assign)) {
          propertyIds = invitation.properties_to_assign;
        }
      } catch (error) {
        console.error('Error parsing properties_to_assign:', error);
        propertyIds = [];
      }
    }

    console.log(`[Invitation Accept] Assigning ${propertyIds.length} properties to user ${userId}`);

    if (propertyIds.length > 0) {
      if (isReactivation) {
        // For reactivated users, first delete old property assignments
        const { error: deleteError } = await supabaseAdmin
          .from('property_assignments')
          .delete()
          .eq('user_id', userId)
          .eq('organization_id', invitation.organization_id);

        if (deleteError) {
          console.error('Error removing old property assignments:', deleteError);
        }
      }

      const propertyAssignments = propertyIds.map((propertyId: string) => ({
        user_id: userId,
        property_id: propertyId,
        organization_id: invitation.organization_id,
        assigned_by: invitation.invited_by,
      }));

      const { error: assignError } = await supabaseAdmin
        .from('property_assignments')
        .insert(propertyAssignments);

      if (assignError) {
        console.error('Error assigning properties:', assignError);
        // Don't fail the entire invitation, just log the error
      } else {
        console.log(`[Invitation Accept] Successfully assigned ${propertyIds.length} properties`);
      }
    }

    // Mark invitation as accepted (using admin client to bypass RLS)
    await supabaseAdmin
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // Log audit event (using admin client to bypass RLS)
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: invitation.organization_id,
      user_id: invitation.invited_by,
      action: isReactivation ? 'user_reactivated' : 'invitation_accepted',
      entity_type: 'invitation',
      entity_id: invitation.id,
      details: {
        email: invitation.email,
        user_id: userId,
        activated_user_email: invitation.email,
        is_reactivation: isReactivation,
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


