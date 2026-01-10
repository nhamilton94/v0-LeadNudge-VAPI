export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/settings/roles
 * Get all available roles (for role dropdown)
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

    // Get all roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name, description, permissions')
      .order('name', { ascending: true });

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Unexpected error in GET /api/settings/roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


