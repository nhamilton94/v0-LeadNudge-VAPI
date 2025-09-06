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
