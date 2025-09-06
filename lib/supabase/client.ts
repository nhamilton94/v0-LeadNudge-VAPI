import { createBrowserClient } from "@supabase/ssr"

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trsqtghplddeerdafxja.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc3F0Z2hwbGRkZWVyZGFmeGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNjU1MTAsImV4cCI6MjA1Nzc0MTUxMH0.VkNt4YdVQMEPLS3Dhlq0RfLgevBke3B_vqyKRroyjm4"

// Verify that we have valid values before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file or environment configuration.")
}

// Create a singleton instance for browser usage
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

// Create and export the supabase client with error handling
export const supabase =
  typeof window !== "undefined"
    ? supabaseInstance || (supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey))
    : createBrowserClient(supabaseUrl, supabaseAnonKey)

// Export a function to create a new client if needed (for special cases)
export function createBrowserSupabaseClient() {
  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Error creating browser Supabase client:", error)
    throw error
  }
}
