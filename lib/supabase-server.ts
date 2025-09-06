import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

// Get the environment variables with fallback values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trsqtghplddeerdafxja.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc3F0Z2hwbGRkZWVyZGFmeGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNjU1MTAsImV4cCI6MjA1Nzc0MTUxMH0.VkNt4YdVQMEPLS3Dhlq0RfLgevBke3B_vqyKRroyjm4"

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        cookieStore.set(name, value, options)
      },
      remove(name, options) {
        cookieStore.set(name, "", { ...options, maxAge: 0 })
      },
    },
  })
}
