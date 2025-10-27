import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/settings/users/[userId]/properties
 * Get properties assigned to a user
 */
export async function GET(
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

    // Get user's assigned properties
    const { data: assignments, error } = await supabase
      .from('property_assignments')
      .select(`
        id,
        property_id,
        assigned_at,
        properties (
          id,
          address,
          city,
          state,
          zip,
          property_type,
          bedrooms,
          bathrooms,
          price,
          status
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching property assignments:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    const properties = assignments?.map((a) => ({
      ...a.properties,
      assignedAt: a.assigned_at,
    }));

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Unexpected error in GET /api/settings/users/[userId]/properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/settings/users/[userId]/properties
 * Update property assignments for a user
 * Requires: Admin role
 * Body: { propertyIds: string[] }
 */
export async function PATCH(
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

    // Get property IDs from request body
    const body = await request.json();
    const { propertyIds } = body;

    if (!Array.isArray(propertyIds)) {
      return NextResponse.json({ error: 'propertyIds must be an array' }, { status: 400 });
    }

    // Check if target user is in same organization
    const { data: targetProfile, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (targetError || targetProfile?.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'User not found in your organization' }, { status: 404 });
    }

    // Get current assignments
    const { data: currentAssignments } = await supabase
      .from('property_assignments')
      .select('property_id')
      .eq('user_id', userId)
      .eq('organization_id', profile.organization_id);

    const currentPropertyIds = currentAssignments?.map((a) => a.property_id) || [];

    // Determine which to add and which to remove
    const toAdd = propertyIds.filter((id) => !currentPropertyIds.includes(id));
    const toRemove = currentPropertyIds.filter((id) => !propertyIds.includes(id));

    // Remove old assignments
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('property_assignments')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', profile.organization_id)
        .in('property_id', toRemove);

      if (deleteError) {
        console.error('Error removing property assignments:', deleteError);
        return NextResponse.json({ error: 'Failed to remove property assignments' }, { status: 500 });
      }

      // Log removals
      await supabase.from('audit_logs').insert(
        toRemove.map((propertyId) => ({
          organization_id: profile.organization_id,
          user_id: user.id,
          action: 'property_unassigned',
          entity_type: 'property_assignment',
          entity_id: userId,
          details: {
            target_user_id: userId,
            property_id: propertyId,
          },
        }))
      );
    }

    // Add new assignments
    if (toAdd.length > 0) {
      const { error: insertError } = await supabase.from('property_assignments').insert(
        toAdd.map((propertyId) => ({
          user_id: userId,
          property_id: propertyId,
          organization_id: profile.organization_id,
          assigned_by: user.id,
        }))
      );

      if (insertError) {
        console.error('Error adding property assignments:', insertError);
        return NextResponse.json({ error: 'Failed to add property assignments' }, { status: 500 });
      }

      // Log additions
      await supabase.from('audit_logs').insert(
        toAdd.map((propertyId) => ({
          organization_id: profile.organization_id,
          user_id: user.id,
          action: 'property_assigned',
          entity_type: 'property_assignment',
          entity_id: userId,
          details: {
            target_user_id: userId,
            property_id: propertyId,
          },
        }))
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Property assignments updated',
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/settings/users/[userId]/properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


