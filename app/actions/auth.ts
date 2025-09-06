"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface LoginCredentials {
  email: string
  password: string
}

interface SignupCredentials {
  email: string
  password: string
}

export async function login(credentials: LoginCredentials) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function signup(credentials: SignupCredentials) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the site URL from environment variable with fallback
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const redirectUrl = `${siteUrl}/auth/callback`

    console.log("Email signup redirect URL:", redirectUrl)

    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Signup error:", error)
    return {
      error: "An unexpected error occurred. Please try again.",
    }
  }
}

export async function signOut() {
  const supabase = createServerSupabaseClient()
  await supabase.auth.signOut()

  // Redirect to auth with a special parameter
  redirect("/auth?signing-out=true")
}
