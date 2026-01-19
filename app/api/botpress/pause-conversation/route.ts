import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

interface PauseConversationRequest {
  contactId: string
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Starting pause-conversation request ===")
    const supabase = createServiceClient()
    const body: PauseConversationRequest = await request.json()
    console.log("Request body:", body)

    if (!body.contactId) {
      return NextResponse.json(
        { error: "Missing required field: contactId" },
        { status: 400 }
      )
    }

    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", body.contactId)
      .single()

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      )
    }

    // Get the most recent conversation for this contact
    console.log(`Looking for conversations for contact ID: ${contact.id}`)
    
    // First, let's see how many conversations exist for debugging
    const { data: allConversations } = await supabase
      .from("conversations")
      .select("id, conversation_status, created_at")
      .eq("contact_id", contact.id)
    
    console.log(`Found ${allConversations?.length || 0} conversations for contact ${contact.id}:`, allConversations)
    
    // Now get the most recent conversation using defensive query pattern
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("contact_id", contact.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "No conversation found for this contact" },
        { status: 404 }
      )
    }

    // Check if conversation can be paused
    if (conversation.conversation_status === 'paused') {
      return NextResponse.json(
        { 
          success: true,
          message: "Conversation is already paused",
          conversationId: conversation.id,
          conversationStatus: conversation.conversation_status
        },
        { status: 200 }
      )
    }

    if (conversation.conversation_status === 'ended') {
      return NextResponse.json(
        { error: "Cannot pause an ended conversation" },
        { status: 400 }
      )
    }

    if (conversation.conversation_status === 'not_started') {
      return NextResponse.json(
        { error: "Cannot pause a conversation that hasn't started" },
        { status: 400 }
      )
    }

    // Pause the conversation
    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        conversation_status: 'paused',
        automation_pause_reason: body.reason || 'user_paused'
      })
      .eq("id", conversation.id)

    if (updateError) {
      console.error("Error pausing conversation:", updateError)
      return NextResponse.json(
        { error: "Failed to pause conversation" },
        { status: 500 }
      )
    }

    // Update qualification status to disable automation
    const { error: qualError } = await supabase
      .from("qualification_status")
      .update({ automation_enabled: false })
      .eq("contact_id", contact.id)

    if (qualError) {
      console.error("Error updating qualification status:", qualError)
      // Continue even if this fails - conversation is still paused
    }

    console.log(`Successfully paused conversation ${conversation.id} for contact ${contact.id}`)

    return NextResponse.json({
      success: true,
      message: "Conversation paused successfully",
      conversationId: conversation.id,
      conversationStatus: 'paused',
      reason: body.reason || 'user_paused'
    })

  } catch (error) {
    console.error("Unexpected error in pause-conversation endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}