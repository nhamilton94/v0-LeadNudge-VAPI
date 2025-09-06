export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // Your public schema tables
    }
    Views: {
      // Your public schema views
    }
    Functions: {
      // Your public schema functions
    }
    Enums: {
      // Your public schema enums
    }
  }
  oauth2: {
    Tables: {
      user_oauth_tokens: {
        Row: {
          id: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
