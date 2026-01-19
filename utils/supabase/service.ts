import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function createServiceClient() {
  // Debug logging
  console.log("Creating service client with:")
  console.log("URL:", supabaseUrl)
  console.log("Service key starts with:", supabaseServiceKey?.substring(0, 10) + "...")
  console.log("Service key length:", supabaseServiceKey?.length)
  
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
  }
  
  if (supabaseServiceKey.includes("anon")) {
    throw new Error("Using anon key instead of service role key!")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}