export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/utils/supabase/service';

/**
 * GET /api/properties/[propertyId]
 * Get individual property details by ID
 * Requires: Authenticated user with access to the property
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get current user from the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this property through property_assignments
    const { data: assignment, error: assignmentError } = await supabase
      .from('property_assignments')
      .select('property_id')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') {
      console.error('Error checking property assignment:', assignmentError);
      return NextResponse.json({ error: 'Failed to verify property access' }, { status: 500 });
    }

    if (!assignment) {
      return NextResponse.json({ error: 'Property not found or access denied' }, { status: 404 });
    }

    // Fetch property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        address,
        city,
        state,
        zip,
        property_type,
        status,
        price,
        bedrooms,
        bathrooms,
        square_feet,
        organization_id,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Property not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('Unexpected error in GET /api/properties/[propertyId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Alternative GET method that uses client-side authentication
 * This version works with client-side requests from authenticated pages
 */
export async function getPropertyById(propertyId: string, userId: string) {
  const supabase = createServiceClient();

  // Check if user has access to this property
  const { data: assignment, error: assignmentError } = await supabase
    .from('property_assignments')
    .select('property_id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .single();

  if (assignmentError || !assignment) {
    throw new Error('Property not found or access denied');
  }

  // Fetch property details
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select(`
      id,
      address,
      city,
      state,
      zip,
      property_type,
      status,
      price,
      bedrooms,
      bathrooms,
      square_feet,
      organization_id,
      created_by,
      created_at,
      updated_at
    `)
    .eq('id', propertyId)
    .single();

  if (propertyError) {
    throw new Error('Failed to fetch property details');
  }

  return property;
}