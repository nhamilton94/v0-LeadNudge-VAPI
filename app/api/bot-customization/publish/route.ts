export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { syncBotCustomizationToBotpress } from '@/lib/botpress/sync';

/**
 * POST /api/bot-customization/publish
 * Publish bot customization changes and sync with Botpress
 * Requires: Admin role
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('roles(name)')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.roles as any)?.name !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    // Get user's profile to get organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 404 }
      );
    }

    const organizationId = profile.organization_id;
    const body = await request.json();
    const { property_scope, selected_property_id } = body;

    // Determine property_id (null for 'all')
    const propertyId = property_scope === 'individual' ? selected_property_id : null;

    // Get the customization to publish
    let query = supabase
      .from('bot_customizations')
      .select(`
        *,
        qualification_questions (*)
      `)
      .eq('organization_id', organizationId);

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    } else {
      query = query.is('property_id', null);
    }

    const { data: customization, error: customizationError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (customizationError || !customization) {
      return NextResponse.json(
        { error: 'No customization found to publish' },
        { status: 404 }
      );
    }

    // Get FAQs
    let faqQuery = supabase
      .from('faq_library')
      .select('*')
      .eq('organization_id', organizationId);

    if (propertyId) {
      faqQuery = faqQuery.or(`property_id.eq.${propertyId},property_id.is.null`);
    } else {
      faqQuery = faqQuery.is('property_id', null);
    }

    const { data: faqs } = await faqQuery;

    // Sync with Botpress
    const syncResult = await syncBotCustomizationToBotpress({
      greeting_message: customization.greeting_message,
      qualification_questions: customization.qualification_questions || [],
      faqs: faqs || [],
      tour_confirmation_message: customization.tour_confirmation_message,
      not_qualified_message: customization.not_qualified_message,
      organization_id: organizationId,
      property_id: propertyId,
    });

    if (!syncResult.success) {
      console.error('Botpress sync failed:', syncResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to sync with Botpress',
          details: syncResult.error 
        },
        { status: 500 }
      );
    }

    // Update customization status to published
    const { error: updateError } = await supabase
      .from('bot_customizations')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customization.id);

    if (updateError) {
      console.error('Error updating customization status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update publish status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bot customization published successfully',
      botpress_sync: syncResult,
    });

  } catch (error) {
    console.error('Error publishing bot customization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

