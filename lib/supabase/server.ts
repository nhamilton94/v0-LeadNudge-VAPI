import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// Add the serializeCookieHeader function at the top of the file
export function serializeCookieHeader(name: string, value: string, options: CookieOptions): string {
  const cookieParts = [`${name}=${encodeURIComponent(value)}`]

  if (options.domain) cookieParts.push(`Domain=${options.domain}`)
  if (options.path) cookieParts.push(`Path=${options.path}`)
  if (options.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`)
  if (options.expires) cookieParts.push(`Expires=${options.expires.toUTCString()}`)
  if (options.httpOnly) cookieParts.push("HttpOnly")
  if (options.secure) cookieParts.push("Secure")
  if (options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`)

  return cookieParts.join("; ")
}

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trsqtghplddeerdafxja.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc3F0Z2hwbGRkZWVyZGFmeGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNjU1MTAsImV4cCI6MjA1Nzc0MTUxMH0.VkNt4YdVQMEPLS3Dhlq0RfLgevBke3B_vqyKRroyjm4"
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Verify that we have valid values before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file or environment configuration.")
}

/**
 * Creates a Supabase client for server-side usage
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  const headers = new Headers()

  // Log available cookies
  console.log(
    "Server cookies available:",
    cookieStore.getAll().map((c) => c.name),
  )

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name)
        console.log(`Cookie get: ${name} -> ${cookie ? "Present" : "Missing"}`)
        return cookie?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          console.log(`Cookie set: ${name} with options:`, options)
          cookieStore.set({ name, value, ...options })
          headers.append("Set-Cookie", serializeCookieHeader(name, value, options))
        } catch (error) {
          console.error(`Error setting cookie ${name}:`, error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          console.log(`Cookie remove: ${name}`)
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        } catch (error) {
          console.error(`Error removing cookie ${name}:`, error)
        }
      },
    },
  })
}

/**
 * Creates a Supabase admin client with service role key for administrative operations
 * WARNING: This bypasses RLS policies. Use only in secure server-side contexts.
 */
export function createServerSupabaseAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
  }

  const cookieStore = cookies()
  
  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name)
        return cookie?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Cookie setting might fail in some contexts, which is okay for admin operations
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 })
        } catch (error) {
          // Cookie removal might fail in some contexts, which is okay for admin operations
        }
      },
    },
  })
}
