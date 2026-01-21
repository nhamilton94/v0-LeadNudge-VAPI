export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import { validateTwilioWebhook } from "@/lib/twilio-validation"
import { normalizePhoneNumber, getPhoneSearchVariants } from "@/utils/phone-number"
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
    // Log all request headers
    console.log("=== Twilio Webhook Headers ===")
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`)
    })
    console.log("===============================")
    
    // Parse form data (Twilio sends form-encoded data)
    const formData = await request.formData()
    const payload: Partial<TwilioWebhookPayload> = {}
    
    formData.forEach((value, key) => {
      payload[key] = value.toString()
    })

    // Validate Twilio webhook signature
    const twilioSignature = request.headers.get('x-twilio-signature')
    if (twilioSignature) {
      // Construct the correct URL using the host header (important for ngrok)
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const correctUrl = `${protocol}://${host}/api/twilio/webhook`
      
      console.log("=== Twilio Signature Validation ===")
      console.log("Signature:", twilioSignature)
      console.log("Original URL:", request.url)
      console.log("Correct URL:", correctUrl)
      console.log("Payload:", payload)
      console.log("================================")
      
      const isValid = validateTwilioWebhook(twilioSignature, correctUrl, payload as Record<string, string>)
      
      console.log("Validation result:", isValid)
      
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

    // Normalize phone number to digits-only format for consistent matching
    const normalizedFrom = normalizePhoneNumber(From)

    const supabase = createServiceClient()
    console.log("Original From:", From);
    console.log("Normalized phone (digits-only):", normalizedFrom);

    // Find existing contact by normalized phone number
    let { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("phone", normalizedFrom)
      .limit(1)
      .single()

    console.log("contact query error:", contactError);
    console.log("contact found:", contact);

    // If no contact found, return an error
    if (!contact) {
        console.error("Error creating contact:", contactError)
        return NextResponse.json(
          { error: "Failed to create contact" },
          { status: 500 }
        )
    }

    // Find conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("phone_number", normalizedFrom)
      .eq("contact_id", contact.id)
      .single()
    // If no conversation found, return an error
    if (!conversation) {
        console.error("No conversation found for phone number and contact", normalizedFrom, contact.id)
        return NextResponse.json(
          { error: "No conversation found for phone number and contact" },
          { status: 500 }
        ) 
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

    // Forward to Botpress only if conversation is active
    if (conversation.botpress_conversation_id && conversation.conversation_status === 'active') {
      console.log(`Forwarding message to Botpress - conversation status: ${conversation.conversation_status}`)
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
    } else if (conversation.botpress_conversation_id && conversation.conversation_status !== 'active') {
      console.log(`Message not forwarded to Botpress - conversation status: ${conversation.conversation_status}`)
      console.log("Message will be stored but automation is paused/ended")
    } else {
      // If no Botpress conversation exists, create one by calling your integration
      console.error("No Botpress conversation exists for phone number and contact", normalizedFrom, contact.id)
      return NextResponse.json(
        { error: "No Botpress conversation exists for phone number and contact" },
        { status: 500 }
      )
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