import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import axios from "axios"

interface ZillowContactRequest {
  phone: string
  email: string
  name: string
  lead_source?: string
  lead_status?: string
  listingContactEmail: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Parse the request body
    const body: ZillowContactRequest = await request.json()

    // Validate required fields
    if (!body.phone || !body.email || !body.name || !body.listingContactEmail) {
      return NextResponse.json(
        {
          error: "Missing required fields: phone, email, name, and listingContactEmail are required",
        },
        { status: 400 },
      )
    }

    // Set default values
    const lead_source = body.lead_source || "zillow"
    const lead_status = body.lead_status || "new lead"

    // Query the profiles table for the user that owns the contact
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, zillow_integration_status")
      .eq("email", body.listingContactEmail)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        {
          error: `No user found for contact with listingContactEmail: ${body.listingContactEmail}`,
        },
        { status: 404 },
      )
    }

    // Update integration status to 'active' if it's not already active
    // This indicates we're successfully receiving leads from Zillow
    if (profileData.zillow_integration_status !== "active") {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          zillow_integration_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileData.id)

      if (updateError) {
        console.error("Error updating zillow_integration_status:", updateError)
        // Continue with the process even if this update fails
      }
    }

    // Split the name into first and last name
    const nameParts = body.name.trim().split(" ")
    const first_name = nameParts[0] || ""
    const last_name = nameParts.slice(1).join(" ") || ""

    // Prepare contact data for upsert
    const contactData = {
      name: body.name,
      first_name,
      last_name,
      email: body.email,
      phone: body.phone,
      status: lead_status,
      lead_source,
      lead_status,
      user_id: profileData.id,
      created_by: profileData.id,
      assigned_to: profileData.id,
    }

    // Upsert the contact into the contacts table
    // Using email as the conflict resolution key
    const { data: contactResult, error: contactError } = await supabase
      .from("contacts")
      .upsert(contactData, {
        onConflict: "email,user_id",
        ignoreDuplicates: false,
      })
      .select()

    if (contactError) {
      console.error("Error upserting contact:", contactError)
      return NextResponse.json(
        {
          error: "Failed to create/update contact",
          details: contactError.message,
        },
        { status: 500 },
      )
    }

    // Get the created/updated contact
    const contact = contactResult[0]
    if (!contact) {
      return NextResponse.json(
        { error: "Failed to retrieve contact after upsert" },
        { status: 500 }
      )
    }

    // Create qualification_status record with automation enabled by default
    const { error: qualError } = await supabase
      .from("qualification_status")
      .upsert({
        contact_id: contact.id,
        qualification_status: "not_started",
        qualification_progress: 0,
        automation_enabled: true,
        updated_by: profileData.id
      }, {
        onConflict: "contact_id"
      })

    if (qualError) {
      console.error("Error creating qualification_status:", qualError)
      // Continue even if this fails - we still want to return the contact
    }

    // If automation is enabled, initiate Botpress outreach
    try {
      const initiateResponse = await axios.post(
        `${request.nextUrl.protocol}//${request.nextUrl.host}/api/botpress/initiate-outreach`,
        { contactId: contact.id },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000 // 10 second timeout
        }
      )

      if (initiateResponse.status !== 200) {
        console.error("Botpress outreach initiation failed:", initiateResponse.data)
      }
    } catch (botpressError) {
      console.error("Error initiating Botpress outreach:", botpressError)
      // Don't fail the webhook if Botpress fails - we still created the contact successfully
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Contact created/updated successfully",
        data: {
          contact: contact,
          profile: {
            id: profileData.id,
            email: profileData.email,
            zillow_integration_status: "active",
          },
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Unexpected error in zillowcontact endpoint:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}
