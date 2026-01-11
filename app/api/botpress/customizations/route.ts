export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/botpress/customizations
 * Returns bot customizations in a format Botpress can use
 * Called by Botpress at the start of each conversation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get organization_id from query params (Botpress will send this)
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const propertyId = searchParams.get('property_id');

    console.log('[Botpress Customizations API] Request:', { organizationId, propertyId });

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization_id parameter' },
        { status: 400 }
      );
    }

    // Fetch customizations from database
    let query = supabase
      .from('bot_customizations')
      .select(`
        *,
        qualification_questions (*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'published');

    if (propertyId) {
      query = query.eq('property_id', propertyId);
    } else {
      query = query.is('property_id', null);
    }

    const { data: customization } = await query
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch FAQs
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

    // Default values if no customization found
    const defaultCustomization = {
      greeting_message: "Hi {prospect_name}! I'm {bot_name}, a virtual assistant. How can I help you today?",
      qualification_questions: [],
      faqs: [],
      tour_confirmation_message: "Perfect! Your tour is confirmed. We look forward to seeing you!",
      not_qualified_message: "Thank you for your interest. We'll keep your information on file for future opportunities.",
    };

    const result = customization || defaultCustomization;

    // Format for Botpress (as conversation variables)
    const botpressFormat = {
      // Greeting
      customGreeting: result.greeting_message,
      
      // Qualification Questions (formatted as array)
      qualificationQuestions: (result.qualification_questions || [])
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          question: q.question_text,
          type: q.answer_type,
          required: q.is_required,
          disqualifier: q.disqualifier_rule,
          options: q.multiple_choice_options,
        })),
      
      // FAQs (formatted as object for easy lookup)
      faqs: (faqs || []).reduce((acc: any, faq: any) => {
        acc[faq.question.toLowerCase()] = faq.answer;
        return acc;
      }, {}),
      
      // Scheduling Messages
      tourConfirmationMessage: result.tour_confirmation_message,
      notQualifiedMessage: result.not_qualified_message,
      
      // Metadata
      hasCustomization: !!customization,
      organizationId: organizationId,
      propertyId: propertyId || null,
    };

    console.log('[Botpress Customizations API] Success:', {
      hasCustomization: botpressFormat.hasCustomization,
      questionsCount: botpressFormat.qualificationQuestions.length,
      faqsCount: Object.keys(botpressFormat.faqs).length,
    });

    return NextResponse.json(botpressFormat);

  } catch (error) {
    console.error('[Botpress Customizations API] Error:', error);
    
    // Return defaults on error (so bot doesn't break)
    return NextResponse.json({
      customGreeting: "Hi! I'm a virtual assistant. How can I help you today?",
      qualificationQuestions: [],
      faqs: {},
      tourConfirmationMessage: "Your tour is confirmed!",
      notQualifiedMessage: "Thank you for your interest.",
      hasCustomization: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * POST /api/botpress/customizations
 * Alternative endpoint if Botpress sends POST requests
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { organizationId, propertyId } = body;

  // Forward to GET handler
  const url = new URL(request.url);
  url.searchParams.set('organization_id', organizationId);
  if (propertyId) {
    url.searchParams.set('property_id', propertyId);
  }

  const getRequest = new NextRequest(url);
  return GET(getRequest);
}

