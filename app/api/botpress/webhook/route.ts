export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { sendTwilioSMS } from "@/lib/twilio"

interface BotpressWebhookPayload {
  conversationId: string
  text: string
  userId?: string
  metadata?: any
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    console.log("Received Botpress webhook payload:", JSON.stringify(body, null, 2))
    
    // Handle the payload format from Botpress integration
    if (!body.conversationId || !body.text) {
      return NextResponse.json(
        { error: "Missing required fields: conversationId and text", receivedPayload: body },
        { status: 400 }
      )
    }

    const { conversationId, text, userId, metadata } = body as BotpressWebhookPayload

    // Create Supabase client with service role for bypassing RLS
    const supabase = createServiceClient()

    // Find the conversation by database ID (conversationId is our database conversation.id)
    console.log(`Looking for conversation with ID: ${conversationId}`)
    
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single()

    console.log("Conversation query result:", { conversation, conversationError })

    if (conversationError || !conversation) {
      // Let's also check if any conversations exist at all
      const { data: allConversations } = await supabase
        .from("conversations")
        .select("id, created_at, botpress_conversation_id")
        .order("created_at", { ascending: false })
        .limit(5)
      
      console.log("Recent conversations:", allConversations)
      
      return NextResponse.json(
        { 
          error: "Conversation not found", 
          searchedId: conversationId,
          recentConversations: allConversations,
          dbError: conversationError 
        },
        { status: 404 }
      )
    }

    // Store the outbound message from Botpress
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        direction: "outbound",
        source: "botpress",
        message_type: "text",
        content: text,
        botpress_message_id: metadata?.messageId || null,
        delivery_status: "pending",
        metadata: metadata || {}
      })
      .select()
      .single()

    if (messageError) {
      console.error("Error storing message:", messageError)
      return NextResponse.json(
        { error: "Failed to store message" },
        { status: 500 }
      )
    }

    // Send SMS via Twilio
    const twilioResult = await sendTwilioSMS(conversation.phone_number, text)
    
    // Update message delivery status based on Twilio result
    const deliveryStatus = twilioResult.success ? "delivered" : "failed"
    await supabase
      .from("messages")
      .update({ 
        delivery_status: deliveryStatus,
        twilio_message_sid: twilioResult.messageSid || null,
        metadata: {
          ...metadata,
          twilio_error: twilioResult.error || null
        }
      })
      .eq("id", message.id)

    if (!twilioResult.success) {
      return NextResponse.json(
        { error: "Failed to send SMS", details: twilioResult.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId: message.id,
      conversationId: conversation.id 
    })

  } catch (error) {
    console.error("Botpress webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}