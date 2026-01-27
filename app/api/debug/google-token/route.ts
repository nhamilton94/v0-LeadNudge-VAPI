import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getGoogleAccessToken } from "@/lib/google-auth"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "userId parameter required" }, { status: 400 })
  }

  console.log("=== DEBUG ENDPOINT START ===")
  console.log("Testing Google token for user:", userId)

  const supabase = createServerSupabaseClient()

  try {
    // 1. Check if user exists in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    console.log("Auth user check:", {
      exists: !!authUser?.user,
      email: authUser?.user?.email,
      error: authError?.message
    })

    // 2. Check oauth2 tokens table directly
    const { data: tokenData, error: tokenError } = await supabase
      .schema("oauth2")
      .from("user_oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single()

    console.log("Direct token query result:", {
      hasError: !!tokenError,
      error: tokenError,
      hasData: !!tokenData,
      tokenPreview: tokenData ? {
        user_id: tokenData.user_id,
        provider: tokenData.provider,
        access_token_length: tokenData.access_token?.length || 0,
        refresh_token_length: tokenData.refresh_token?.length || 0,
        expires_at: tokenData.expires_at,
        created_at: tokenData.created_at,
        updated_at: tokenData.updated_at
      } : null
    })

    // 3. Test getGoogleAccessToken function
    console.log("=== TESTING getGoogleAccessToken FUNCTION ===")
    const accessToken = await getGoogleAccessToken(userId)
    console.log("getGoogleAccessToken result:", {
      success: !!accessToken,
      tokenLength: accessToken?.length || 0
    })

    // 4. If we have a token, test Google Calendar API call
    let calendarTest = null
    if (accessToken) {
      console.log("=== TESTING GOOGLE CALENDAR API ===")
      try {
        const calendarResponse = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        )

        calendarTest = {
          status: calendarResponse.status,
          ok: calendarResponse.ok,
          statusText: calendarResponse.statusText
        }

        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json()
          calendarTest.calendarId = calendarData.id
          calendarTest.calendarSummary = calendarData.summary
        } else {
          const errorData = await calendarResponse.json()
          calendarTest.error = errorData
        }

        console.log("Google Calendar API test result:", calendarTest)
      } catch (error) {
        calendarTest = {
          error: "Failed to call Google Calendar API",
          details: error instanceof Error ? error.message : String(error)
        }
        console.error("Calendar API test error:", error)
      }
    }

    console.log("=== DEBUG ENDPOINT END ===")

    return NextResponse.json({
      success: true,
      debug: {
        authUser: {
          exists: !!authUser?.user,
          email: authUser?.user?.email,
          error: authError?.message || null
        },
        tokenData: {
          found: !!tokenData,
          error: tokenError?.message || null,
          preview: tokenData ? {
            user_id: tokenData.user_id,
            provider: tokenData.provider,
            access_token_length: tokenData.access_token?.length || 0,
            refresh_token_length: tokenData.refresh_token?.length || 0,
            expires_at: tokenData.expires_at,
            created_at: tokenData.created_at,
            updated_at: tokenData.updated_at,
            isExpired: tokenData.expires_at ? new Date(tokenData.expires_at) <= new Date() : null
          } : null
        },
        accessTokenFunction: {
          success: !!accessToken,
          tokenLength: accessToken?.length || 0
        },
        calendarApiTest: calendarTest
      }
    })

  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({
      error: "Debug endpoint failed",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}