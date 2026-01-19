import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"

export async function GET(
  request: Request,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params

    if (!contactId) {
      return NextResponse.json(
        { error: "Missing contact ID" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get the most recent conversation for this contact
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, conversation_status, botpress_conversation_id, botpress_user_id, last_outreach_attempt, automation_pause_reason, ended_at")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (conversationError && conversationError.code !== 'PGRST116') {
      console.error("Error fetching conversation status:", conversationError)
      return NextResponse.json(
        { error: "Failed to fetch conversation status" },
        { status: 500 }
      )
    }

    // If no conversation exists, return not_started status
    if (!conversation) {
      return NextResponse.json({
        contactId,
        conversation_status: "not_started",
        conversation: null
      })
    }

    return NextResponse.json({
      contactId,
      conversation_status: conversation.conversation_status,
      conversation: {
        id: conversation.id,
        conversation_status: conversation.conversation_status,
        botpress_conversation_id: conversation.botpress_conversation_id,
        botpress_user_id: conversation.botpress_user_id,
        last_outreach_attempt: conversation.last_outreach_attempt,
        automation_pause_reason: conversation.automation_pause_reason,
        ended_at: conversation.ended_at
      }
    })

  } catch (error) {
    console.error("Unexpected error in conversation status endpoint:", error)
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
export async function POST() {
  return NextResponse.json({ error: "Method not allowed. Use GET." }, { status: 405 })
}