import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

interface AutomationToggleRequest {
  automation_enabled: boolean
  reason?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    console.log("=== Starting automation toggle request ===")
    const supabase = createServiceClient()
    const { contactId } = params
    const body: AutomationToggleRequest = await request.json()
    console.log("Request body:", body)

    if (!contactId) {
      return NextResponse.json(
        { error: "Missing required parameter: contactId" },
        { status: 400 }
      )
    }

    if (typeof body.automation_enabled !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid required field: automation_enabled (must be boolean)" },
        { status: 400 }
      )
    }

    // Get contact details to verify it exists
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      )
    }

    // Log the reason for debugging/audit purposes
    if (body.reason) {
      console.log(`Automation ${body.automation_enabled ? 'enabled' : 'disabled'} for contact ${contactId}: ${body.reason}`)
    }

    // Update or create qualification_status record
    const { data: qualificationStatus, error: qualError } = await supabase
      .from("qualification_status")
      .upsert({
        contact_id: contactId, // Keep as string for UUID compatibility
        automation_enabled: body.automation_enabled,
        updated_by: contact.created_by,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "contact_id"
      })
      .select()
      .single()

    if (qualError) {
      console.error("Error updating qualification status:", qualError)
      return NextResponse.json(
        { error: "Failed to update automation status" },
        { status: 500 }
      )
    }

    // If disabling automation, also pause any active conversations
    if (!body.automation_enabled) {
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id, conversation_status")
        .eq("contact_id", contact.id)
        .single()

      if (conversation && conversation.conversation_status === 'active') {
        await supabase
          .from("conversations")
          .update({
            conversation_status: 'paused',
            automation_pause_reason: 'automation_disabled'
          })
          .eq("id", conversation.id)
      }
    }

    console.log(`Successfully ${body.automation_enabled ? 'enabled' : 'disabled'} automation for contact ${contactId}`)

    return NextResponse.json({
      success: true,
      message: `Automation ${body.automation_enabled ? 'enabled' : 'disabled'} successfully`,
      contactId: contact.id,
      automation_enabled: body.automation_enabled,
      qualification_status: qualificationStatus
    })

  } catch (error) {
    console.error("Unexpected error in automation toggle endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Get current automation status
export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const supabase = createServiceClient()
    const { contactId } = params

    if (!contactId) {
      return NextResponse.json(
        { error: "Missing required parameter: contactId" },
        { status: 400 }
      )
    }

    // Get current automation status
    const { data: qualificationStatus, error: qualError } = await supabase
      .from("qualification_status")
      .select("*")
      .eq("contact_id", contactId)
      .single()

    if (qualError && qualError.code !== 'PGRST116') {
      console.error("Error fetching qualification status:", qualError)
      return NextResponse.json(
        { error: "Failed to fetch automation status" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      contactId,
      automation_enabled: qualificationStatus?.automation_enabled || false,
      qualification_status: qualificationStatus || null
    })

  } catch (error) {
    console.error("Unexpected error in automation status fetch:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}