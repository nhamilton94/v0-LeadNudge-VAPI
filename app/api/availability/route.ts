export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getGoogleAccessToken } from "@/lib/google-auth"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { authenticateApiRequest } from "@/lib/auth/api-middleware"

export async function GET(request: Request) {
  try {
    // Authenticate the request using API key
    const authResponse = authenticateApiRequest(request)
    if (authResponse) {
      return authResponse
    }

    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const host_email = searchParams.get("host_email")
    const timeMin = searchParams.get("timeMin")
    const timeMax = searchParams.get("timeMax")
    const address = searchParams.get("address")
    const first_name = searchParams.get("first_name") || ""
    const last_name = searchParams.get("last_name") || ""
    const attendee_email = searchParams.get("attendee_email")

    // Validate required parameters
    if (!host_email || !timeMin || !timeMax) {
      return NextResponse.json({ error: "Missing required parameters: email, timeMin, timeMax" }, { status: 400 })
    }

    // Get a valid access token for the user associated with the email
    // First, find the user ID for the provided email
    const supabase = createServerSupabaseClient()
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", host_email)
      .single()

    console.log("user email:" + host_email)
    if (userError || !userData) {
      return NextResponse.json({ error: "User not found for the provided email" }, { status: 404 })
    }

    // Get a valid access token for the user
    const accessToken = await getGoogleAccessToken(userData.id)

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get Google access token. Please reconnect your Google account." },
        { status: 401 },
      )
    }

    // Check calendar availability
    const availabilityResponse = await checkAvailability(accessToken, host_email, timeMin, timeMax)

    // If there are no busy times, create an event
    if (
      !availabilityResponse.calendars ||
      !availabilityResponse.calendars[host_email] ||
      !availabilityResponse.calendars[host_email].busy ||
      availabilityResponse.calendars[host_email].busy.length === 0
    ) {
      // Create calendar event
      const eventResponse = await createCalendarEvent(
        accessToken,
        host_email,
        address || "",
        first_name,
        last_name,
        timeMin,
        timeMax,
        attendee_email,
      )

      return NextResponse.json({
        success: true,
        message: "Event created successfully",
        event: eventResponse,
      })
    } else {
      // Return busy times
      return NextResponse.json({
        success: false,
        message: "Time slot is not available",
        busy: availabilityResponse.calendars[host_email].busy,
      })
    }
  } catch (error: any) {
    console.error("Error processing availability request:", error)
    return NextResponse.json({ error: `Error processing availability request: ${error.message}` }, { status: 500 })
  }
}

async function checkAvailability(accessToken: string, host_email: string, timeMin: string, timeMax: string) {
  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        items: [{ id: host_email }],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Google Calendar API error: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}

async function createCalendarEvent(
  accessToken: string,
  host_email: string,
  address: string,
  first_name: string,
  last_name: string,
  timeMin: string,
  timeMax: string,
  attendeeEmail: string,
) {
  try {
    // Encode email for use in URL
    const encodedEmail = encodeURIComponent(host_email)

    const eventData: any = {
      summary: `Tour with ${first_name} ${last_name} at ${address}`,
      start: {
        dateTime: timeMin,
      },
      end: {
        dateTime: timeMax,
      },
      reminders: {
        useDefault: true,
      },
    }

    if (address) {
      eventData.location = address
    }

    if (attendeeEmail && attendeeEmail !== host_email) {
      eventData.attendees = [{ email: attendeeEmail }]
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodedEmail}/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create event: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    throw error
  }
}
