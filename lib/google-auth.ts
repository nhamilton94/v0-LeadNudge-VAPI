import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Initialize Supabase admin client for token operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface TokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token?: string
}

/**
 * Gets a valid Google access token for a user
 * Refreshes the token if it's expired
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    // Get the current tokens
    const { data: tokenData, error: fetchError } = await supabaseAdmin
      .schema("oauth2")
      .from("user_oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single()

    if (fetchError || !tokenData) {
      console.error("Error fetching token data:", fetchError)
      return null
    }

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    // If token is still valid, return it
    if (expiresAt > now) {
      return tokenData.access_token
    }

    // Token is expired, refresh it
    const refreshToken = tokenData.refresh_token
    if (!refreshToken) {
      console.error("No refresh token available")
      return null
    }

    // Make request to Google's token endpoint
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error refreshing token:", errorData)
      return null
    }

    const data: TokenResponse = await response.json()

    // Calculate new expiration time
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + data.expires_in)

    // Update the token in the database
    const { error: updateError } = await supabaseAdmin
      .schema("oauth2")
      .from("user_oauth_tokens")
      .update({
        access_token: data.access_token,
        // Only update refresh_token if a new one was provided
        ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "google")

    if (updateError) {
      console.error("Error updating token:", updateError)
      return null
    }

    return data.access_token
  } catch (error) {
    console.error("Unexpected error refreshing token:", error)
    return null
  }
}
