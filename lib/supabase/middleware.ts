import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Get environment variables with proper fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://trsqtghplddeerdafxja.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyc3F0Z2hwbGRkZWVyZGFmeGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNjU1MTAsImV4cCI6MjA1Nzc0MTUxMH0.VkNt4YdVQMEPLS3Dhlq0RfLgevBke3B_vqyKRroyjm4"

// Verify that we have valid values before creating the client
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Check your .env file or environment configuration.")
}

/**
 * Creates a Supabase client for middleware usage
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
  try {
    // Log request cookies
    console.log(
      "Middleware request cookies:",
      Object.fromEntries(request.cookies.getAll().map((c) => [c.name, "Present"])),
    )

    // Create a response object that we'll modify
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          try {
            const cookie = request.cookies.get(name)
            console.log(`Middleware cookie get: ${name} -> ${cookie ? "Present" : "Missing"}`)
            return cookie?.value
          } catch (error) {
            console.error(`Error getting middleware cookie ${name}:`, error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            console.log(`Middleware cookie set: ${name} with options:`, options)
            // Update both the request and response cookies
            request.cookies.set({
              name,
              value,
              ...options,
            })

            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })

            response.cookies.set({
              name,
              value,
              ...options,
            })
          } catch (error) {
            console.error(`Error setting middleware cookie ${name}:`, error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            console.log(`Middleware cookie remove: ${name}`)
            // Update both the request and response cookies
            request.cookies.set({
              name,
              value: "",
              ...options,
            })

            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })

            response.cookies.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            })
          } catch (error) {
            console.error(`Error removing middleware cookie ${name}:`, error)
          }
        },
      },
    })

    return { supabase, response }
  } catch (error) {
    console.error("Error creating middleware Supabase client:", error)
    // Return a default response and client to prevent breaking the middleware
    const response = NextResponse.next()
    // Create a minimal client that won't throw errors
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    })
    return { supabase, response }
  }
}
