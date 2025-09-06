import { createBrowserClient } from "@supabase/ssr"

// Get the environment variables with fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trsqtghplddeerdafxja.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc3F0Z2hwbGRkZWVyZGFmeGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNjU1MTAsImV4cCI6MjA1Nzc0MTUxMH0.VkNt4YdVQMEPLS3Dhlq0RfLgevBke3B_vqyKRroyjm4"

// Create a singleton instance for the browser
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Also export a function to create a new client if needed
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Let's check if there are any hardcoded URLs in this file
// I'll look for any references to v0-real-estate-dashboard-six.vercel.app
