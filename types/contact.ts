import { Database } from '@/lib/database.types'

// Base Contact type from database
export type Contact = Database['public']['Tables']['contacts']['Row']

// Qualification status type from database
export type QualificationStatus = Database['public']['Tables']['qualification_status']['Row']

// Qualification details type from database
export type QualificationDetails = Database['public']['Tables']['qualification_details']['Row']

// Extended Contact type that includes joined data from RPC functions
export interface ContactWithDetails extends Contact {
  qualification_status?: QualificationStatus | null
  qualification_details?: QualificationDetails | null
  conversations?: {
    id: string
    conversation_status: 'not_started' | 'active' | 'paused' | 'ended'
    botpress_conversation_id?: string
    botpress_user_id?: string
    last_outreach_attempt?: string
    automation_pause_reason?: string
    ended_at?: string
  }[]
  // Property details are stored as a separate field in the contact table
  interested_property_details?: {
    id: string
    address?: string
    city?: string
    state?: string
    zip?: string
    price?: number
    bedrooms?: number
    bathrooms?: number
  }
}

// User profile type
export type UserProfile = Database['public']['Tables']['profiles']['Row']