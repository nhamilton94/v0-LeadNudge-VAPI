export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_GREETING, DEFAULT_TOUR_CONFIRMATION, DEFAULT_NOT_QUALIFIED, DEFAULT_QUALIFICATION_QUESTIONS } from '@/types/bot-customization';

/**
 * GET /api/bot-customization
 * Get bot customization settings for the user's organization
 * Optionally filtered by property_id
 * Returns: Bot customization data with questions and FAQs
 */
export async function GET(request: NextRequest) {
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

    // Get user's profile to get organization_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 404 }
      );
    }

    const organizationId = profile.organization_id;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    // Get bot customization (property-specific or global)
    let query = supabase
      .from('bot_customizations')
      .select('*')
      .eq('organization_id', organizationId);

    if (propertyId && propertyId !== 'null') {
      query = query.eq('property_id', propertyId);
    } else {
      query = query.is('property_id', null);
    }

    const { data: customization, error: customizationError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If no customization exists, return defaults
    if (customizationError || !customization) {
      return NextResponse.json({
        exists: false,
        data: {
          property_scope: 'all',
          selected_property_id: null,
          greeting_message: DEFAULT_GREETING,
          qualification_questions: DEFAULT_QUALIFICATION_QUESTIONS.map((q, idx) => ({
            ...q,
            id: `default-${idx}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          faqs: [],
          tour_confirmation_message: DEFAULT_TOUR_CONFIRMATION,
          not_qualified_message: DEFAULT_NOT_QUALIFIED,
        }
      });
    }

    // Get qualification questions for this customization
    const { data: questions, error: questionsError } = await supabase
      .from('qualification_questions')
      .select('*')
      .eq('bot_customization_id', customization.id)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching qualification questions:', questionsError);
    }

    // Get FAQs for this organization (and optionally property)
    let faqQuery = supabase
      .from('faq_library')
      .select('*')
      .eq('organization_id', organizationId);

    if (propertyId && propertyId !== 'null') {
      faqQuery = faqQuery.or(`property_id.eq.${propertyId},property_id.is.null`);
    } else {
      faqQuery = faqQuery.is('property_id', null);
    }

    const { data: faqs, error: faqsError } = await faqQuery
      .order('created_at', { ascending: false });

    if (faqsError) {
      console.error('Error fetching FAQs:', faqsError);
    }

    return NextResponse.json({
      exists: true,
      data: {
        id: customization.id,
        property_scope: customization.property_id ? 'individual' : 'all',
        selected_property_id: customization.property_id,
        greeting_message: customization.greeting_message,
        qualification_questions: questions || [],
        faqs: faqs || [],
        tour_confirmation_message: customization.tour_confirmation_message,
        not_qualified_message: customization.not_qualified_message,
        status: customization.status,
        published_at: customization.published_at,
        updated_at: customization.updated_at,
      }
    });

  } catch (error) {
    console.error('Error fetching bot customization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot-customization
 * Create or update bot customization (Save Draft)
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
    const {
      property_scope,
      selected_property_id,
      greeting_message,
      qualification_questions,
      faqs,
      tour_confirmation_message,
      not_qualified_message,
    } = body;

    // Determine property_id (null for 'all')
    const propertyId = property_scope === 'individual' ? selected_property_id : null;

    // Check if customization already exists
    let query = supabase
      .from('bot_customizations')
      .select('id')
      .eq('organization_id', organizationId);

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    } else {
      query = query.is('property_id', null);
    }

    const { data: existing } = await query.single();

    let customizationId: string;

    if (existing) {
      // Update existing customization
      const { data: updated, error: updateError } = await supabase
        .from('bot_customizations')
        .update({
          greeting_message,
          tour_confirmation_message,
          not_qualified_message,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating customization:', updateError);
        return NextResponse.json(
          { error: 'Failed to update customization' },
          { status: 500 }
        );
      }

      customizationId = updated.id;

      // Delete existing questions
      await supabase
        .from('qualification_questions')
        .delete()
        .eq('bot_customization_id', customizationId);

    } else {
      // Create new customization
      const { data: created, error: createError } = await supabase
        .from('bot_customizations')
        .insert({
          organization_id: organizationId,
          property_id: propertyId,
          greeting_message,
          tour_confirmation_message,
          not_qualified_message,
          status: 'draft',
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating customization:', createError);
        return NextResponse.json(
          { error: 'Failed to create customization' },
          { status: 500 }
        );
      }

      customizationId = created.id;
    }

    // Insert qualification questions
    if (qualification_questions && qualification_questions.length > 0) {
      const questionsToInsert = qualification_questions.map((q: any) => ({
        bot_customization_id: customizationId,
        question_text: q.question_text,
        answer_type: q.answer_type,
        is_required: q.is_required,
        order_index: q.order_index,
        disqualifier_rule: q.disqualifier_rule || null,
        multiple_choice_options: q.multiple_choice_options || null,
      }));

      const { error: questionsError } = await supabase
        .from('qualification_questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error inserting questions:', questionsError);
        return NextResponse.json(
          { error: 'Failed to save qualification questions' },
          { status: 500 }
        );
      }
    }

    // Handle FAQs - delete existing and insert new ones
    if (faqs) {
      // Delete existing FAQs for this org/property
      let deleteQuery = supabase
        .from('faq_library')
        .delete()
        .eq('organization_id', organizationId);

      if (propertyId) {
        deleteQuery = deleteQuery.eq('property_id', propertyId);
      } else {
        deleteQuery = deleteQuery.is('property_id', null);
      }

      await deleteQuery;

      // Insert new FAQs
      if (faqs.length > 0) {
        const faqsToInsert = faqs.map((faq: any) => ({
          organization_id: organizationId,
          property_id: propertyId,
          question: faq.question,
          answer: faq.answer,
        }));

        const { error: faqsError } = await supabase
          .from('faq_library')
          .insert(faqsToInsert);

        if (faqsError) {
          console.error('Error inserting FAQs:', faqsError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bot customization saved as draft',
      customization_id: customizationId,
    });

  } catch (error) {
    console.error('Error saving bot customization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

