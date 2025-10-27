import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/settings/properties
 * Get all properties in the organization (for assignment dropdown)
 * Requires: Authenticated user
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

    // Get user's profile to get organization_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get all properties in the organization
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        city,
        state,
        zip,
        property_type,
        bedrooms,
        bathrooms,
        square_feet,
        price,
        status
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .order('address', { ascending: true });

    if (propertiesError) {
      console.error('Error fetching properties:', propertiesError);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    return NextResponse.json({ properties });
  } catch (error) {
    console.error('Unexpected error in GET /api/settings/properties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


