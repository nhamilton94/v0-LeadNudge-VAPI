import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { Client } from "@botpress/client"

interface InitiateOutreachRequest {
  contactId: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== Starting initiate-outreach request ===")
    const supabase = createServiceClient()
    const body: InitiateOutreachRequest = await request.json()
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

    // Check if automation is enabled for this contact
    const { data: qualificationStatus, error: qualError } = await supabase
      .from("qualification_status")
      .select("automation_enabled")
      .eq("contact_id", contact.id)
      .single()

    if (qualError || !qualificationStatus?.automation_enabled) {
      return NextResponse.json(
        { error: "Automation is not enabled for this contact" },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let { data: conversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("contact_id", contact.id)
      .single()

    // Create conversation if it doesn't exist
    if (convError || !conversation) {
      const { data: newConversation, error: createConvError } = await supabase
        .from("conversations")
        .insert({
          contact_id: contact.id,
          user_id: contact.created_by,
          phone_number: contact.phone,
          status: "active"
        })
        .select()
        .single()

      if (createConvError) {
        console.error("Error creating conversation:", createConvError)
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        )
      }

      conversation = newConversation
    }

    console.log("Using conversation with ID:", conversation.id)

    // Check if Botpress integration already exists
    if (conversation.botpress_conversation_id && conversation.botpress_user_id) {
      return NextResponse.json(
        { 
          success: true, 
          message: "Botpress conversation already exists",
          conversationId: conversation.id 
        },
        { status: 200 }
      )
    }

    try {
      console.log("Starting Botpress integration setup...")
      // Initialize Botpress client
      const botpressToken = process.env.BOTPRESS_TOKEN
      const botpressBotId = process.env.BOTPRESS_BOT_ID
      const botpressIntegrationId = process.env.BOTPRESS_INTEGRATION_ID
      
      console.log("Environment check:", { 
        hasToken: !!botpressToken, 
        hasBotId: !!botpressBotId, 
        hasIntegrationId: !!botpressIntegrationId 
      })
      
      if (!botpressToken || !botpressBotId) {
        throw new Error("BOTPRESS_TOKEN or BOTPRESS_BOT_ID not configured")
      }

      // Initialize Botpress client
      console.log("Creating Botpress client...")
      const client = new Client({ 
        token: botpressToken, 
        botId: botpressBotId,
        ...(botpressIntegrationId && { integrationId: botpressIntegrationId })
      })

      // 1. Create or get the user in Botpress
      console.log("Creating Botpress user...")
      const { user } = await client.getOrCreateUser({ 
        tags: {}
      })
      console.log("Created Botpress user:", user.id)

      // 2. Create a new conversation in Botpress
      console.log("Creating Botpress conversation with tag ID:", conversation.id.toString())
      const { conversation: botpressConversation } = await client.createConversation({ 
        channel: "webhook",
        tags: { id: conversation.id.toString() }
      })
      console.log("Created Botpress conversation:", botpressConversation.id)

      // 3. Add the user as a participant
      await client.addParticipant({ 
        id: botpressConversation.id, 
        userId: user.id 
      })

      // 4. Set conversation state with contact context
      await client.setState({
        type: "conversation",
        id: botpressConversation.id,
        name: "contactContext",
        payload: {
          firstName: contact.first_name,
          lastName: contact.last_name,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
          contactId: contact.id
        }
      })

      // 5. Send the first message as the bot
      const initialMessage = `Hi, is this ${contact.first_name || contact.name}? I'm Alex, a virtual assistant for 149 Pennsylvania Avenue. I saw you were interested in the property. Would you like to schedule a tour?`
      
      await client.createMessage({ 
        conversationId: botpressConversation.id, 
        userId: user.id, // The recipient user 
        type: "text", 
        payload: { text: initialMessage },
        tags: {}
      })

      // 6. Update conversation with actual Botpress IDs
      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          botpress_conversation_id: botpressConversation.id,
          botpress_user_id: user.id
        })
        .eq("id", conversation.id)

      if (updateError) {
        console.error("Error updating conversation with Botpress IDs:", updateError)
        throw new Error("Failed to update conversation with Botpress IDs")
      }

      return NextResponse.json({
        success: true,
        message: "Botpress outreach initiated successfully",
        conversationId: conversation.id,
        botpressConversationId: botpressConversation.id,
        botpressUserId: user.id
      })

    } catch (botpressError) {
      console.error("Botpress API error:", botpressError)
      
      // Disable automation for this contact if Botpress fails
      await supabase
        .from("qualification_status")
        .update({ automation_enabled: false })
        .eq("contact_id", contact.id)

      return NextResponse.json(
        {
          error: "Failed to initiate Botpress outreach",
          details: botpressError instanceof Error ? botpressError.message : "Unknown error"
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Unexpected error in initiate-outreach endpoint:", error)
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