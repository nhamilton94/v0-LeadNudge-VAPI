export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { validateTwilioWebhook } from "@/lib/twilio-validation"
import axios from "axios"

interface TwilioWebhookPayload {
  MessageSid: string
  From: string
  To: string
  Body: string
  NumSegments: string
  MessageStatus: string
  AccountSid: string
  [key: string]: string
}

export async function POST(request: Request) {
  try {
    // Parse form data (Twilio sends form-encoded data)
    const formData = await request.formData()
    const payload: Partial<TwilioWebhookPayload> = {}
    
    formData.forEach((value, key) => {
      payload[key] = value.toString()
    })

    // Validate Twilio webhook signature
    const twilioSignature = request.headers.get('x-twilio-signature')
    if (twilioSignature) {
      const url = request.url
      const isValid = validateTwilioWebhook(twilioSignature, url, payload as Record<string, string>)
      
      if (!isValid) {
        console.log ("Invalid Twilio signature");
        return NextResponse.json(
          { error: "Invalid Twilio signature" },
          { status: 401 }
        )
      }
    }

    const { MessageSid, From, To, Body, MessageStatus } = payload

    if (!MessageSid || !From || !Body) {
      return NextResponse.json(
        { error: "Missing required Twilio fields" },
        { status: 400 }
      )
    }

    // Clean phone numbers (remove +1, spaces, etc.)
    const cleanFrom = From.replace(/^\+?1?/, '').replace(/\D/g, '')

    const supabase = createServiceClient()

    // Try to find existing contact by phone number
    let { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .or(`phone.eq.${cleanFrom},phone.eq.${From}`)
      .single()

    console.log("contact", contact);

    // If no contact found, create one
    if (!contact) {
      console.log("No contact found, creating one");
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          name: `Contact ${cleanFrom}`,
          first_name: null,
          last_name: null,
          email: `${cleanFrom}@unknown.com`, // Placeholder email
          phone: From,
          status: "new",
          lead_source: "sms",
          lead_status: "new",
          user_id: "00000000-0000-0000-0000-000000000000" // Default user ID - update this
        })
        .select()
        .single()

      if (contactError) {
        console.error("Error creating contact:", contactError)
        return NextResponse.json(
          { error: "Failed to create contact" },
          { status: 500 }
        )
      }
      
      contact = newContact
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone_number", From)
      .eq("contact_id", contact.id)
      .single()

    if (!conversation) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          contact_id: contact.id,
          user_id: contact.user_id,
          phone_number: From,
          status: "active"
        })
        .select()
        .single()

      if (convError) {
        console.error("Error creating conversation:", convError)
        return NextResponse.json(
          { error: "Failed to create conversation" },
          { status: 500 }
        )
      }

      conversation = newConversation
    }

    // Store the inbound message
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        direction: "inbound",
        source: "twilio",
        message_type: "text",
        content: Body,
        twilio_message_sid: MessageSid,
        delivery_status: MessageStatus?.toLowerCase() || "delivered",
        metadata: {
          from: From,
          to: To,
          numSegments: payload.NumSegments
        }
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

    // Forward to Botpress if conversation has botpress_conversation_id
    if (conversation.botpress_conversation_id) {
      try {
        await axios.post(`${process.env.BOTPRESS_WEBHOOK_URL}`, {
          userId: contact.id,
          conversationId: conversation.botpress_conversation_id,
          text: Body
        })
      } catch (botpressError) {
        console.error("Error forwarding to Botpress:", botpressError)
        // Don't fail the webhook if Botpress forwarding fails
      }
    } else {
      // If no Botpress conversation exists, create one by calling your integration
      try {
        console.log("Creating Botpress conversation");
        const botpressIntegrationUrl = process.env.BOTPRESS_INTEGRATION_URL
        if (botpressIntegrationUrl) {
          const response = await axios.post(botpressIntegrationUrl, {
            userId: contact.id,
            conversationId: conversation.id,
            text: Body
          })
          
          // The integration response contains the message object with Botpress conversation details
          if (response.status === 200) {
            // Update the conversation with Botpress conversation ID
            // Note: You'd need to extract the actual Botpress conversation ID from the response
            console.log("Botpress conversation created");
            const botpressResponse = response.data
            console.log("Botpress conversation response", botpressResponse);
            await supabase
              .from("conversations")
              .update({
                botpress_conversation_id: `bp_conv_${conversation.id}`, // This would be from botpressResponse
                botpress_user_id: `bp_user_${contact.id}` // This would be from botpressResponse
              })
              .eq("id", conversation.id)
          }
        }
      } catch (error) {
        console.error("Error setting up Botpress conversation:", error)
      }
    }

    // Return TwiML response (empty response means no auto-reply)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: {
        'Content-Type': 'application/xml'
      }
    })

  } catch (error) {
    console.error("Twilio webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}