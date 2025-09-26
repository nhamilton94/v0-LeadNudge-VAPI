import { createClient } from "@supabase/supabase-js"

// Get the environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trsqtghplddeerdafxja.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not found. Service operations may fail.")
}

// Create a service role client that bypasses RLS
export function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for service operations")
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}