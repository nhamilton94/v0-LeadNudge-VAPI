import { NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/auth/api-middleware"
import { getGoogleAccessToken } from "@/lib/google-auth"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(req: Request) {
  // Authenticate the request
  const authResponse = authenticateApiRequest(req)
  if (authResponse) {
    return authResponse
  }

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const timeMin = searchParams.get("timeMin") // ISO date string
    const timeMax = searchParams.get("timeMax") // ISO date string

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!timeMin || !timeMax) {
      return NextResponse.json({ error: "Time range is required" }, { status: 400 })
    }

    // Get user's email from Supabase
    const supabase = createServerSupabaseClient()
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get Google access token for the user
    const accessToken = await getGoogleAccessToken(userId)
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Failed to get Google access token. User may need to reconnect their Google account.",
        },
        { status: 401 },
      )
    }

    // Fetch calendar events
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(userData.email)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json()
      return NextResponse.json(
        {
          error: "Failed to fetch calendar events",
          details: errorData,
        },
        { status: calendarResponse.status },
      )
    }

    const calendarData = await calendarResponse.json()

    // Return sanitized calendar data (remove sensitive information)
    const sanitizedEvents = calendarData.items.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      start: event.start,
      end: event.end,
      status: event.status,
      location: event.location,
    }))

    return NextResponse.json({
      success: true,
      events: sanitizedEvents,
    })
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process calendar request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
