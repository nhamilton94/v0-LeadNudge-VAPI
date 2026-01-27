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
    console.log("=== GOOGLE ACCESS TOKEN DEBUG ===")
    console.log("Requesting access token for user ID:", userId)

    // Get the current tokens
    const { data: tokenData, error: fetchError } = await supabaseAdmin
      .schema("oauth2")
      .from("user_oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single()

    console.log("Token fetch result:", {
      hasError: !!fetchError,
      errorDetails: fetchError,
      hasData: !!tokenData,
      dataKeys: tokenData ? Object.keys(tokenData) : []
    })

    if (fetchError || !tokenData) {
      console.error("=== TOKEN FETCH FAILED ===")
      console.error("Fetch error:", fetchError)
      console.error("Token data:", tokenData)
      
      // Also check if there are any tokens for this user with any provider
      const { data: anyTokens } = await supabaseAdmin
        .schema("oauth2")
        .from("user_oauth_tokens")
        .select("*")
        .eq("user_id", userId)
      
      console.error("Any tokens for user:", anyTokens)
      return null
    }

    console.log("Token data retrieved:", {
      user_id: tokenData.user_id,
      provider: tokenData.provider,
      access_token_length: tokenData.access_token?.length || 0,
      refresh_token_length: tokenData.refresh_token?.length || 0,
      expires_at: tokenData.expires_at,
      created_at: tokenData.created_at
    })

    // Check if token is expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    console.log("Token expiration check:", {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isExpired: expiresAt <= now,
      minutesUntilExpiry: Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60))
    })

    // If token is still valid, return it
    if (expiresAt > now) {
      console.log("=== TOKEN STILL VALID - RETURNING CACHED TOKEN ===")
      return tokenData.access_token
    }

    // Token is expired, refresh it
    const refreshToken = tokenData.refresh_token
    console.log("Token expired, attempting refresh with refresh token:", {
      hasRefreshToken: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0
    })

    if (!refreshToken) {
      console.error("=== NO REFRESH TOKEN AVAILABLE ===")
      return null
    }

    // Make request to Google's token endpoint
    console.log("=== REFRESHING TOKEN WITH GOOGLE ===")
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

    console.log("Google token refresh response:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("=== GOOGLE TOKEN REFRESH FAILED ===")
      console.error("Error refreshing token:", errorData)
      return null
    }

    const data: TokenResponse = await response.json()
    console.log("=== GOOGLE TOKEN REFRESH SUCCESS ===")
    console.log("New token data:", {
      access_token_length: data.access_token?.length || 0,
      expires_in: data.expires_in,
      token_type: data.token_type,
      scope: data.scope,
      has_new_refresh_token: !!data.refresh_token
    })

    // Calculate new expiration time
    const newExpiresAt = new Date()
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + data.expires_in)

    console.log("Updating database with new token, expires at:", newExpiresAt.toISOString())

    // Update the token in the database
    const updateData = {
      access_token: data.access_token,
      // Only update refresh_token if a new one was provided
      ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabaseAdmin
      .schema("oauth2")
      .from("user_oauth_tokens")
      .update(updateData)
      .eq("user_id", userId)
      .eq("provider", "google")

    if (updateError) {
      console.error("=== TOKEN UPDATE FAILED ===")
      console.error("Error updating token:", updateError)
      return null
    }

    console.log("=== TOKEN REFRESH COMPLETE - RETURNING NEW TOKEN ===")
    console.log("=== END GOOGLE ACCESS TOKEN DEBUG ===")
    return data.access_token
  } catch (error) {
    console.error("=== UNEXPECTED ERROR IN TOKEN REFRESH ===")
    console.error("Unexpected error refreshing token:", error)
    console.log("=== END GOOGLE ACCESS TOKEN DEBUG ===")
    return null
  }
}
