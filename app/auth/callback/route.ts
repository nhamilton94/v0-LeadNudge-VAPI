import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  console.log("Auth callback received with code:", code ? "Present" : "Missing")
  console.log("Auth callback URL:", request.url)

  // Log cookies from request
  const cookieHeader = request.headers.get("cookie")
  console.log("Auth callback cookies:", cookieHeader || "No cookies")

  // Parse and log specific PKCE-related cookies
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim())
    const pkceCookies = cookies.filter((c) => c.includes("sb-"))
    console.log("PKCE-related cookies:", pkceCookies)
  }

  // Handle case where user denied permissions
  const error = requestUrl.searchParams.get("error")
  if (error) {
    console.error("Auth callback error:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=${error}`)
  }

  if (!code) {
    console.error("Auth callback error: No code provided")
    return NextResponse.redirect(new URL("/auth?error=missing_code", request.url))
  }

  try {
    // Create a response that we'll modify with cookies
    const response = NextResponse.redirect(new URL(next, requestUrl.origin))

    // Use the createServerSupabaseClient function
    const supabase = createServerSupabaseClient()

    // Exchange code for session
    console.log("Exchanging code for session...")
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    console.log("Code exchange result:", {
      success: !exchangeError,
      hasSession: !!data?.session,
      error: exchangeError ? exchangeError.message : null,
    })

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(exchangeError.message)}`)
    }

    console.log("Session created successfully:", data.session ? "Yes" : "No")

    // Extract provider tokens immediately after authentication
    if (data?.session) {
      const { provider_token, provider_refresh_token } = data.session

      console.log("Provider token available:", provider_token ? "Yes" : "No")

      if (provider_token) {
        // Get user ID from session
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          console.log("=== ENHANCED OAUTH TOKEN DEBUG ===")
          console.log("User ID:", user.id)
          console.log("Provider token length:", provider_token?.length || 0)
          console.log("Provider refresh token available:", !!provider_refresh_token)
          console.log("Provider refresh token length:", provider_refresh_token?.length || 0)
          
          // Calculate token expiration (Google access tokens typically expire in 1 hour)
          const expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + 1)
          
          console.log("Token expires at:", expiresAt.toISOString())

          // Store tokens in database
          const tokenData = {
            user_id: user.id,
            provider: "google",
            access_token: provider_token,
            refresh_token: provider_refresh_token || "",
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          
          console.log("Attempting to store token data:", {
            user_id: tokenData.user_id,
            provider: tokenData.provider,
            access_token_length: tokenData.access_token?.length || 0,
            refresh_token_length: tokenData.refresh_token?.length || 0,
            expires_at: tokenData.expires_at
          })

          const { error: insertError, data: insertResult } = await supabase.schema("oauth2").from("user_oauth_tokens").upsert(
            tokenData,
            {
              onConflict: "user_id, provider",
            },
          ).select()

          if (insertError) {
            console.error("=== TOKEN STORAGE ERROR ===")
            console.error("Full error object:", insertError)
            console.error("Error message:", insertError.message)
            console.error("Error details:", insertError.details)
            console.error("Error hint:", insertError.hint)
            console.error("Error code:", insertError.code)
            // Continue anyway since the user is authenticated
          } else {
            console.log("=== TOKEN STORAGE SUCCESS ===")
            console.log("Insert result:", insertResult)
            console.log("OAuth tokens stored successfully")
          }
          console.log("=== END OAUTH TOKEN DEBUG ===")
        } else {
          console.error("No user found in session after OAuth")
        }
      } else {
        console.error("No provider_token available from OAuth session")
      }
    } else {
      console.error("No session created after code exchange")
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_session_created`)
    }

    // Return the response with cookies set
    console.log("Redirecting to:", next)
    return response
  } catch (error) {
    console.error("Error in auth callback:", error)
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=unexpected_error`)
  }
}
