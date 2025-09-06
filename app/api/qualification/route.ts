import { NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/auth/api-middleware"

const VAPI_KEY = process.env.VAPI_KEY

export async function POST(req: Request) {
  // Authenticate the request
  const authResponse = authenticateApiRequest(req)
  if (authResponse) {
    return authResponse
  }

  if (!VAPI_KEY) {
    return NextResponse.json({ error: "VAPI key not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { contactId, action } = body

    // Initialize VAPI client
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VAPI_KEY}`,
    }

    let endpoint: string
    let payload: any

    switch (action) {
      case "start":
        endpoint = "https://api.vapi.ai/conversations"
        payload = {
          contactId,
          qualificationType: "REAL_ESTATE",
          mode: "qualification",
        }
        break
      case "stop":
        endpoint = `https://api.vapi.ai/conversations/${contactId}/stop`
        payload = {}
        break
      case "reset":
        endpoint = `https://api.vapi.ai/conversations/${contactId}/reset`
        payload = {}
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`VAPI request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Qualification API error:", error)
    return NextResponse.json({ error: "Failed to process qualification request" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  // Authenticate the request
  const authResponse = authenticateApiRequest(req)
  if (authResponse) {
    return authResponse
  }

  if (!VAPI_KEY) {
    return NextResponse.json({ error: "VAPI key not configured" }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const contactId = searchParams.get("contactId")

    if (!contactId) {
      return NextResponse.json({ error: "Contact ID is required" }, { status: 400 })
    }

    // Get qualification status from VAPI
    const response = await fetch(`https://api.vapi.ai/conversations/${contactId}/status`, {
      headers: {
        Authorization: `Bearer ${VAPI_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`VAPI request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Qualification API error:", error)
    return NextResponse.json({ error: "Failed to fetch qualification status" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  // Authenticate the request
  const authResponse = authenticateApiRequest(req)
  if (authResponse) {
    return authResponse
  }

  if (!VAPI_KEY) {
    return NextResponse.json({ error: "VAPI key not configured" }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { contactId, automationEnabled } = body

    // Update automation settings in VAPI
    const response = await fetch(`https://api.vapi.ai/conversations/${contactId}/automation`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VAPI_KEY}`,
      },
      body: JSON.stringify({ enabled: automationEnabled }),
    })

    if (!response.ok) {
      throw new Error(`VAPI request failed: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Qualification API error:", error)
    return NextResponse.json({ error: "Failed to update automation settings" }, { status: 500 })
  }
}
