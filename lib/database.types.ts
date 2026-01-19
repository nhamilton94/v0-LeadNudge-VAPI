export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          organization_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          organization_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_customizations: {
        Row: {
          created_at: string
          created_by: string
          greeting_message: string
          id: string
          not_qualified_message: string
          organization_id: string
          property_id: string | null
          published_at: string | null
          status: string
          tour_confirmation_message: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          greeting_message: string
          id?: string
          not_qualified_message: string
          organization_id: string
          property_id?: string | null
          published_at?: string | null
          status?: string
          tour_confirmation_message: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          greeting_message?: string
          id?: string
          not_qualified_message?: string
          organization_id?: string
          property_id?: string | null
          published_at?: string | null
          status?: string
          tour_confirmation_message?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_customizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_customizations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          contact_id: string
          description: string | null
          id: string
          metadata: Json | null
          timestamp: string
          title: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          contact_id: string
          description?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
          title: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          contact_id?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          timestamp?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_preferred_locations: {
        Row: {
          contact_id: string
          location: string
          priority: number
        }
        Insert: {
          contact_id: string
          location: string
          priority?: number
        }
        Update: {
          contact_id?: string
          location?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_preferred_locations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_properties: {
        Row: {
          contact_id: string
          interest_level: Database["public"]["Enums"]["interest_level"]
          notes: string | null
          property_id: string
        }
        Insert: {
          contact_id: string
          interest_level?: Database["public"]["Enums"]["interest_level"]
          notes?: string | null
          property_id: string
        }
        Update: {
          contact_id?: string
          interest_level?: Database["public"]["Enums"]["interest_level"]
          notes?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_properties_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          email: string | null
          first_name: string | null
          id: string
          image_url: string | null
          industry: string | null
          interested_property: string | null
          last_name: string | null
          lead_source: Database["public"]["Enums"]["lead_source"] | null
          lead_status: Database["public"]["Enums"]["lead_status"]
          linkedin: string | null
          name: string
          organization_id: string | null
          phone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          interested_property?: string | null
          last_name?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          lead_status?: Database["public"]["Enums"]["lead_status"]
          linkedin?: string | null
          name: string
          organization_id?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          industry?: string | null
          interested_property?: string | null
          last_name?: string | null
          lead_source?: Database["public"]["Enums"]["lead_source"] | null
          lead_status?: Database["public"]["Enums"]["lead_status"]
          linkedin?: string | null
          name?: string
          organization_id?: string | null
          phone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_interested_property_fkey"
            columns: ["interested_property"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          automation_pause_reason: string | null
          botpress_conversation_id: string | null
          botpress_user_id: string | null
          contact_id: string | null
          conversation_status: Database["public"]["Enums"]["conversation_status"] | null
          created_at: string
          ended_at: string | null
          id: string
          last_outreach_attempt: string | null
          metadata: Json | null
          organization_id: string | null
          phone_number: string
          status: string
          twilio_conversation_sid: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          automation_pause_reason?: string | null
          botpress_conversation_id?: string | null
          botpress_user_id?: string | null
          contact_id?: string | null
          conversation_status?: Database["public"]["Enums"]["conversation_status"] | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_outreach_attempt?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number: string
          status?: string
          twilio_conversation_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          automation_pause_reason?: string | null
          botpress_conversation_id?: string | null
          botpress_user_id?: string | null
          contact_id?: string | null
          conversation_status?: Database["public"]["Enums"]["conversation_status"] | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_outreach_attempt?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number?: string
          status?: string
          twilio_conversation_sid?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          attendee_id: string | null
          attendee_reference_id: string
          attendee_type: Database["public"]["Enums"]["attendee_type"]
          event_id: string
          external_email: string | null
          external_name: string | null
          response_status: Database["public"]["Enums"]["response_status"]
          role: Database["public"]["Enums"]["attendee_role"]
        }
        Insert: {
          attendee_id?: string | null
          attendee_reference_id?: string
          attendee_type: Database["public"]["Enums"]["attendee_type"]
          event_id: string
          external_email?: string | null
          external_name?: string | null
          response_status?: Database["public"]["Enums"]["response_status"]
          role?: Database["public"]["Enums"]["attendee_role"]
        }
        Update: {
          attendee_id?: string | null
          attendee_reference_id?: string
          attendee_type?: Database["public"]["Enums"]["attendee_type"]
          event_id?: string
          external_email?: string | null
          external_name?: string | null
          response_status?: Database["public"]["Enums"]["response_status"]
          role?: Database["public"]["Enums"]["attendee_role"]
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_properties: {
        Row: {
          event_id: string
          property_id: string
        }
        Insert: {
          event_id: string
          property_id: string
        }
        Update: {
          event_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_properties_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      event_recurrence: {
        Row: {
          end_date: string | null
          event_id: string
          interval: number
          occurrences: number | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
        }
        Insert: {
          end_date?: string | null
          event_id: string
          interval?: number
          occurrences?: number | null
          recurrence_type: Database["public"]["Enums"]["recurrence_type"]
        }
        Update: {
          end_date?: string | null
          event_id?: string
          interval?: number
          occurrences?: number | null
          recurrence_type?: Database["public"]["Enums"]["recurrence_type"]
        }
        Relationships: [
          {
            foreignKeyName: "event_recurrence_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reminders: {
        Row: {
          event_id: string
          id: string
          reminder_time: unknown
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          sent: boolean
          sent_at: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          reminder_time: unknown
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          sent?: boolean
          sent_at?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          reminder_time?: unknown
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          sent?: boolean
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reminders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          all_day: boolean
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string | null
          location_type: Database["public"]["Enums"]["location_type"] | null
          organization_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          organization_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string | null
          location_type?: Database["public"]["Enums"]["location_type"] | null
          organization_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_library: {
        Row: {
          answer: string
          created_at: string
          id: string
          last_updated: string
          organization_id: string
          property_id: string | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          last_updated?: string
          organization_id: string
          property_id?: string | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          last_updated?: string
          organization_id?: string
          property_id?: string | null
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_library_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faq_library_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          properties_to_assign: Json | null
          role_id: string
          status: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          properties_to_assign?: Json | null
          role_id: string
          status?: string | null
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          properties_to_assign?: Json | null
          role_id?: string
          status?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          botpress_message_id: string | null
          content: string
          conversation_id: string
          created_at: string
          delivery_status: string
          direction: string
          id: string
          is_read: boolean | null
          message_type: string
          metadata: Json | null
          source: string
          twilio_message_sid: string | null
        }
        Insert: {
          botpress_message_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          delivery_status?: string
          direction: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          source: string
          twilio_message_sid?: string | null
        }
        Update: {
          botpress_message_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          delivery_status?: string
          direction?: string
          id?: string
          is_read?: boolean | null
          message_type?: string
          metadata?: Json | null
          source?: string
          twilio_message_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          max_properties: number | null
          max_users: number | null
          name: string
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          max_properties?: number | null
          max_users?: number | null
          name: string
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          max_properties?: number | null
          max_users?: number | null
          name?: string
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string
          id: string
          invited_at: string | null
          invited_by: string | null
          last_login_at: string | null
          last_name: string | null
          license_number: string | null
          license_state: string | null
          onboarding_completed: boolean
          organization_id: string | null
          phone_number: string | null
          profile_picture_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
          zillow_integration_status: Database["public"]["Enums"]["zillow_integration_status"]
          zillow_premier_email: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name: string
          id: string
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          last_name?: string | null
          license_number?: string | null
          license_state?: string | null
          onboarding_completed?: boolean
          organization_id?: string | null
          phone_number?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          zillow_integration_status?: Database["public"]["Enums"]["zillow_integration_status"]
          zillow_premier_email?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          last_login_at?: string | null
          last_name?: string | null
          license_number?: string | null
          license_state?: string | null
          onboarding_completed?: boolean
          organization_id?: string | null
          phone_number?: string | null
          profile_picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          zillow_integration_status?: Database["public"]["Enums"]["zillow_integration_status"]
          zillow_premier_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string
          created_by: string
          id: string
          organization_id: string | null
          price: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet: number | null
          state: string
          status: Database["public"]["Enums"]["property_status"]
          updated_at: string
          zip: string
        }
        Insert: {
          address: string
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string
          created_by: string
          id?: string
          organization_id?: string | null
          price?: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state: string
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          zip: string
        }
        Update: {
          address?: string
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string | null
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          square_feet?: number | null
          state?: string
          status?: Database["public"]["Enums"]["property_status"]
          updated_at?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          organization_id: string
          property_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id: string
          property_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_details: {
        Row: {
          contact_id: string
          credit_score: string | null
          desired_price: string | null
          income: number | null
          move_in_timeline: string | null
          verification_date: string | null
          verified: boolean
          verified_by: string | null
        }
        Insert: {
          contact_id: string
          credit_score?: string | null
          desired_price?: string | null
          income?: number | null
          move_in_timeline?: string | null
          verification_date?: string | null
          verified?: boolean
          verified_by?: string | null
        }
        Update: {
          contact_id?: string
          credit_score?: string | null
          desired_price?: string | null
          income?: number | null
          move_in_timeline?: string | null
          verification_date?: string | null
          verified?: boolean
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_details_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_details_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_questions: {
        Row: {
          answer_type: string
          bot_customization_id: string
          created_at: string
          disqualifier_rule: string | null
          id: string
          is_required: boolean
          multiple_choice_options: Json | null
          order_index: number
          question_text: string
          updated_at: string
        }
        Insert: {
          answer_type: string
          bot_customization_id: string
          created_at?: string
          disqualifier_rule?: string | null
          id?: string
          is_required?: boolean
          multiple_choice_options?: Json | null
          order_index: number
          question_text: string
          updated_at?: string
        }
        Update: {
          answer_type?: string
          bot_customization_id?: string
          created_at?: string
          disqualifier_rule?: string | null
          id?: string
          is_required?: boolean
          multiple_choice_options?: Json | null
          order_index?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualification_questions_bot_customization_id_fkey"
            columns: ["bot_customization_id"]
            isOneToOne: false
            referencedRelation: "bot_customizations"
            referencedColumns: ["id"]
          },
        ]
      }
      qualification_status: {
        Row: {
          automation_enabled: boolean
          contact_id: string
          qualification_date: string | null
          qualification_progress: number
          qualification_status: Database["public"]["Enums"]["qualification_status_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          automation_enabled?: boolean
          contact_id: string
          qualification_date?: string | null
          qualification_progress?: number
          qualification_status?: Database["public"]["Enums"]["qualification_status_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          automation_enabled?: boolean
          contact_id?: string
          qualification_date?: string | null
          qualification_progress?: number
          qualification_status?: Database["public"]["Enums"]["qualification_status_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_status_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualification_status_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          joined_at: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          manager_id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          organization_id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversation_summaries: {
        Row: {
          assigned_agent: string | null
          botpress_conversation_id: string | null
          contact_email: string | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          id: string | null
          last_message_at: string | null
          last_message_content: string | null
          message_count: number | null
          metadata: Json | null
          phone_number: string | null
          status: string | null
          twilio_conversation_sid: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      expire_old_invitations: { Args: never; Returns: undefined }
      get_contacts_with_details: { Args: { user_id: string }; Returns: Json }
      get_user_organization: { Args: { p_user_id: string }; Returns: string }
      get_user_properties: {
        Args: { p_user_id: string }
        Returns: {
          address: string
          city: string
          organization_id: string
          property_id: string
          state: string
        }[]
      }
      get_user_role: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: {
          role_id: string
          role_name: string
        }[]
      }
      is_user_admin: {
        Args: { p_organization_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "email"
        | "call"
        | "meeting"
        | "note"
        | "document"
        | "viewing"
        | "status"
      attendee_role: "organizer" | "required" | "optional"
      attendee_type: "user" | "contact" | "external"
      conversation_status: "not_started" | "active" | "paused" | "ended"
      event_status: "scheduled" | "cancelled" | "completed"
      event_type: "tour" | "meeting" | "call" | "showing" | "appointment"
      interest_level: "high" | "medium" | "low"
      lead_source:
        | "referral"
        | "website"
        | "zillow"
        | "trulia"
        | "realtor"
        | "facebook"
        | "craigslist"
        | "streeteasy"
        | "apartments.com"
        | "other"
      lead_status:
        | "new lead"
        | "contacted"
        | "viewing scheduled"
        | "viewing completed"
        | "negotiating"
        | "contract sent"
        | "closed"
        | "lost"
      location_type: "physical" | "virtual" | "phone"
      property_status: "active" | "pending" | "sold" | "off_market"
      property_type:
        | "single_family"
        | "condo"
        | "apartment"
        | "townhouse"
        | "multi_family"
        | "land"
        | "commercial"
      qualification_status_type:
        | "qualified"
        | "in_progress"
        | "not_started"
        | "not_qualified"
      recurrence_type: "daily" | "weekly" | "monthly" | "custom"
      reminder_type: "email" | "notification" | "sms"
      response_status: "accepted" | "declined" | "tentative" | "no_response"
      team_member_role: "manager" | "agent" | "support"
      user_role: "admin" | "agent" | "manager" | "support"
      zillow_integration_status: "inactive" | "active" | "pending" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Export commonly used types
export type ConversationSummary = Database['public']['Views']['conversation_summaries']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type ZillowIntegrationStatus = Database['public']['Enums']['zillow_integration_status']

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "email",
        "call",
        "meeting",
        "note",
        "document",
        "viewing",
        "status",
      ],
      attendee_role: ["organizer", "required", "optional"],
      attendee_type: ["user", "contact", "external"],
      event_status: ["scheduled", "cancelled", "completed"],
      event_type: ["tour", "meeting", "call", "showing", "appointment"],
      interest_level: ["high", "medium", "low"],
      lead_source: [
        "referral",
        "website",
        "zillow",
        "trulia",
        "realtor",
        "facebook",
        "craigslist",
        "streeteasy",
        "apartments.com",
        "other",
      ],
      lead_status: [
        "new lead",
        "contacted",
        "viewing scheduled",
        "viewing completed",
        "negotiating",
        "contract sent",
        "closed",
        "lost",
      ],
      location_type: ["physical", "virtual", "phone"],
      property_status: ["active", "pending", "sold", "off_market"],
      property_type: [
        "single_family",
        "condo",
        "apartment",
        "townhouse",
        "multi_family",
        "land",
        "commercial",
      ],
      qualification_status_type: [
        "qualified",
        "in_progress",
        "not_started",
        "not_qualified",
      ],
      recurrence_type: ["daily", "weekly", "monthly", "custom"],
      reminder_type: ["email", "notification", "sms"],
      response_status: ["accepted", "declined", "tentative", "no_response"],
      team_member_role: ["manager", "agent", "support"],
      user_role: ["admin", "agent", "manager", "support"],
      zillow_integration_status: ["inactive", "active", "pending", "failed"],
    },
  },
} as const
