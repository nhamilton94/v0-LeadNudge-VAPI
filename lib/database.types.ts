export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ZillowIntegrationStatus = "inactive" | "pending" | "active" | "failed"

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          avatar_url: string | null
          email: string
          role: string
          zillow_integration_status: ZillowIntegrationStatus | null
          zillow_premier_email: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          email: string
          role?: string
          zillow_integration_status?: ZillowIntegrationStatus | null
          zillow_premier_email?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          avatar_url?: string | null
          email?: string
          role?: string
          zillow_integration_status?: ZillowIntegrationStatus | null
          zillow_premier_email?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          address: string
          city: string
          state: string
          zip: string
          price: number
          bedrooms: number
          bathrooms: number
          square_feet: number
          description: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          address: string
          city: string
          state: string
          zip: string
          price: number
          bedrooms: number
          bathrooms: number
          square_feet: number
          description: string
          status: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          address?: string
          city?: string
          state?: string
          zip?: string
          price?: number
          bedrooms?: number
          bathrooms?: number
          square_feet?: number
          description?: string
          status?: string
          user_id?: string
        }
      }
      contacts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          first_name: string | null
          last_name: string | null
          email: string
          phone: string
          status: string
          lead_source: string | null
          lead_status: string | null
          user_id: string
          created_by: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          first_name?: string | null
          last_name?: string | null
          email: string
          phone: string
          status: string
          lead_source?: string | null
          lead_status?: string | null
          user_id: string
          created_by?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          phone?: string
          status?: string
          lead_source?: string | null
          lead_status?: string | null
          user_id?: string
          created_by?: string | null
          assigned_to?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          contact_id: string | null
          user_id: string | null
          botpress_conversation_id: string | null
          twilio_conversation_sid: string | null
          phone_number: string
          status: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string | null
          user_id?: string | null
          botpress_conversation_id?: string | null
          twilio_conversation_sid?: string | null
          phone_number: string
          status?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          contact_id?: string | null
          user_id?: string | null
          botpress_conversation_id?: string | null
          twilio_conversation_sid?: string | null
          phone_number?: string
          status?: string
          metadata?: Json
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          conversation_id: string
          direction: string
          source: string
          message_type: string
          content: string
          twilio_message_sid: string | null
          botpress_message_id: string | null
          delivery_status: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          conversation_id: string
          direction: string
          source: string
          message_type?: string
          content: string
          twilio_message_sid?: string | null
          botpress_message_id?: string | null
          delivery_status?: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          conversation_id?: string
          direction?: string
          source?: string
          message_type?: string
          content?: string
          twilio_message_sid?: string | null
          botpress_message_id?: string | null
          delivery_status?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
