/**
 * Bot Customization Types based on PRD
 * 
 * ROLE-BASED ACCESS CONTROL:
 * ===========================
 * 
 * Admin Role:
 * - Full access to Bot Customization tab in Settings
 * - Can view, edit, save drafts, and publish changes
 * - Can customize for all properties (global) or specific properties
 * - Can add/edit/delete qualification questions
 * - Can manage FAQ library
 * - Can customize greeting and scheduling messages
 * - Can reset to default settings
 * 
 * User Role:
 * - NO access to Bot Customization tab
 * - Tab is hidden from Settings for non-admin users
 * - If somehow accessed, all fields are read-only (disabled)
 * - Cannot save, publish, or modify any bot settings
 * 
 * ORGANIZATION ISOLATION:
 * ======================
 * - All bot customizations are scoped to organization_id
 * - Users can only see/edit settings for their own organization
 * - Properties list filtered by user's organization_id
 * - Backend APIs must verify organization_id from user session
 * - RLS policies enforce organization-level data isolation
 */

export type PropertyScope = 'all' | 'individual';

export type QuestionType = 'text' | 'numeric' | 'yes_no' | 'date' | 'multiple_choice';

export interface QualificationQuestion {
  id: string;
  question_text: string;
  answer_type: QuestionType;
  is_required: boolean;
  order_index: number;
  disqualifier_rule?: string | null;
  multiple_choice_options?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  property_id?: string | null; // null means global
  last_updated: string;
  created_at?: string;
}

export interface BotCustomization {
  id: string;
  property_id: string | null; // null means global settings
  organization_id: string;
  
  // Greeting
  greeting_message: string;
  
  // Qualification Questions (array of question IDs in order)
  qualification_questions: QualificationQuestion[];
  
  // FAQs
  faqs: FAQ[];
  
  // Scheduling Messages
  tour_confirmation_message: string;
  not_qualified_message: string;
  
  // Status
  status: 'draft' | 'published';
  published_at?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface BotCustomizationFormData {
  property_scope: PropertyScope;
  selected_property_id: string | null;
  greeting_message: string;
  qualification_questions: QualificationQuestion[];
  faqs: FAQ[];
  tour_confirmation_message: string;
  not_qualified_message: string;
}

// Default messages as per PRD
export const DEFAULT_GREETING = "Hi {prospect_name}! I'm {bot_name}, a virtual assistant for {property_name}. I saw you were interested in the property. Would you like to schedule a tour?";

export const DEFAULT_TOUR_CONFIRMATION = "Great! Your tour at {property_name} is confirmed for {tour_date} at {tour_time}. Looking forward to seeing you!";

export const DEFAULT_NOT_QUALIFIED = "Thank you for your interest in {property_name}. Unfortunately, based on the information provided, we're unable to move forward with your application at this time.";

// Default qualification questions
export const DEFAULT_QUALIFICATION_QUESTIONS: Omit<QualificationQuestion, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    question_text: "What's your expected move-in date?",
    answer_type: 'date',
    is_required: true,
    order_index: 1,
    disqualifier_rule: null,
  },
  {
    question_text: "Do you have pets?",
    answer_type: 'yes_no',
    is_required: true,
    order_index: 2,
    disqualifier_rule: null,
  },
  {
    question_text: "What's your monthly income?",
    answer_type: 'numeric',
    is_required: true,
    order_index: 3,
    disqualifier_rule: 'income < 3000',
  },
];

// Placeholder types for message templates
export type MessagePlaceholder = 
  | '{prospect_name}' 
  | '{property_name}' 
  | '{bot_name}' 
  | '{tour_date}' 
  | '{tour_time}';

export const AVAILABLE_PLACEHOLDERS: { value: MessagePlaceholder; label: string; description: string }[] = [
  { value: '{prospect_name}', label: 'Prospect Name', description: "The prospect's first name" },
  { value: '{property_name}', label: 'Property Name', description: 'Name of the property' },
  { value: '{bot_name}', label: 'Bot Name', description: 'Name of the AI assistant' },
  { value: '{tour_date}', label: 'Tour Date', description: 'Scheduled tour date' },
  { value: '{tour_time}', label: 'Tour Time', description: 'Scheduled tour time' },
];

