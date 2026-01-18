import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/utils/supabase/service"
import axios from "axios"

interface ZillowContactRequest {
  phone: string
  email: string
  name: string
  lead_source?: string
  lead_status?: string
  listingContactEmail: string
  
  // Required property fields
  listingStreet: string
  listingPostalCode: string
  listingCity: string
  listingState: string
  
  // Optional Zillow fields
  listingUnit?: string
  numBedrooms?: string
  numBathrooms?: string
  numBedroomsSought?: string
  numBathroomsSought?: string
  moveInDate?: string
  movingDate?: string
  leaseLengthMonths?: string
  message?: string
  leadType?: string
  creditScoreRangeJson?: string
  incomeYearly?: string
  numOccupants?: string
  hasPets?: string
  petDetailsJson?: string
  listingId?: string
  globalListingId?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log("=== ZILLOW WEBHOOK ENDPOINT HIT ===")
    console.log("Request URL:", request.url)
    console.log("Request method:", request.method)
    console.log("Request headers:", Object.fromEntries(request.headers.entries()))
    
    const supabaseService = createServiceClient() // Service role bypasses RLS completely

    // Parse the request body
    const body: ZillowContactRequest = await request.json()

    // Validate required fields
    if (!body.phone || !body.email || !body.name || !body.listingContactEmail || 
        !body.listingStreet || !body.listingPostalCode || !body.listingCity || !body.listingState) {
      return NextResponse.json(
        {
          error: "Missing required fields: phone, email, name, listingContactEmail, listingStreet, listingPostalCode, listingCity, and listingState are required",
        },
        { status: 400 },
      )
    }

    // Set default values
    const lead_source = body.lead_source || "zillow"
    const lead_status = body.lead_status || "new lead"

    // Query the profiles table for the user that owns the contact
    const { data: profileData, error: profileError } = await supabaseService
      .from("profiles")
      .select("id, email, zillow_integration_status, organization_id")
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
      const { error: updateError } = await supabaseService
        .from("profiles")
        .update({
          zillow_integration_status: "active",
          updated_at: new Date().toISOString(),
          zillow_premier_email: body.listingContactEmail
        })
        .eq("id", profileData.id)

      if (updateError) {
        console.error("Error updating zillow_integration_status:", updateError)
        // Continue with the process even if this update fails
      }
    }

    // Find or create property
    let property = null
    try {
      // 1. Try exact match first
      const { data: existingProperty, error: propertyLookupError } = await supabaseService
        .from("properties")
        .select("*")
        .eq("address", body.listingStreet)
        .eq("zip", body.listingPostalCode)
        .eq("unit", body.listingUnit || null)
        .eq("organization_id", profileData.organization_id)
        .maybeSingle()

      if (propertyLookupError && propertyLookupError.code !== "PGRST116") {
        console.error("Error looking up property:", propertyLookupError)
      }

      property = existingProperty

      // 2. If not found, try fuzzy match on address
      if (!property) {
        const { data: fuzzyProperty, error: fuzzyError } = await supabaseService
          .from("properties")
          .select("*")
          .ilike("address", `%${body.listingStreet}%`)
          .eq("zip", body.listingPostalCode)
          .eq("organization_id", profileData.organization_id)
          .maybeSingle()

        if (fuzzyError && fuzzyError.code !== "PGRST116") {
          console.error("Error fuzzy matching property:", fuzzyError)
        }

        property = fuzzyProperty
      }

      // 3. If still not found, create new property
      if (!property) {
        const propertyData = {
          address: body.listingStreet,
          city: body.listingCity,
          state: body.listingState,
          zip: body.listingPostalCode,
          unit: body.listingUnit || null,
          organization_id: profileData.organization_id,
          created_by: profileData.id,
          property_type: "single_family" as const,
          status: "active" as const,
          zillow_listing_id: body.listingId || null,
          zillow_global_listing_id: body.globalListingId || null,
          lease_length_months: body.leaseLengthMonths ? parseInt(body.leaseLengthMonths) : null,
          available_date: body.moveInDate || null,
          bedrooms: body.numBedrooms ? parseInt(body.numBedrooms) : null,
        }

        const { data: newProperty, error: createPropertyError } = await supabaseService
          .from("properties")
          .insert(propertyData)
          .select()
          .single()

        if (createPropertyError) {
          console.error("Error creating property:", createPropertyError)
          // Continue without property - we'll still create the contact
        } else {
          property = newProperty

          // Create property assignment for the listing owner
          const { error: assignmentError } = await supabaseService
            .from("property_assignments")
            .insert({
              user_id: profileData.id,
              property_id: newProperty.id,
              organization_id: profileData.organization_id,
              assigned_by: profileData.id,
              assigned_at: new Date().toISOString(),
            })

          if (assignmentError) {
            console.error("Error creating property assignment:", assignmentError)
            // Continue - assignment failure is not critical
          }
        }
      }
    } catch (propertyError) {
      console.error("Unexpected error in property handling:", propertyError)
      // Continue without property - we'll still create the contact
    }

    // Split the name into first and last name
    const nameParts = body.name.trim().split(" ")
    const first_name = nameParts[0] || ""
    const last_name = nameParts.slice(1).join(" ") || ""

    // Parse credit score range
    let creditScoreMin = null, creditScoreMax = null
    if (body.creditScoreRangeJson) {
      try {
        const creditRange = JSON.parse(body.creditScoreRangeJson)
        creditScoreMin = creditRange.creditScoreMin || null
        creditScoreMax = creditRange.creditScoreMax || null
      } catch (e) {
        console.warn('Failed to parse credit score range:', e)
      }
    }

    // Parse pet details
    let petDetails = null, hasPets = null
    if (body.petDetailsJson) {
      try {
        petDetails = JSON.parse(body.petDetailsJson)
        hasPets = body.hasPets === 'yes' || (petDetails && petDetails[0]?.type !== 'none')
      } catch (e) {
        console.warn('Failed to parse pet details:', e)
      }
    } else {
      hasPets = body.hasPets === 'yes'
    }

    // Prepare contact data for upsert
    const contactData = {
      name: body.name,
      first_name,
      last_name,
      email: body.email,
      phone: body.phone,
      lead_status: lead_status,
      lead_source,
      organization_id: profileData.organization_id,
      created_by: profileData.id,
      assigned_to: profileData.id,
      interested_property: property?.id || null,
      
      // New Zillow-specific fields
      move_in_date: body.moveInDate || body.movingDate || null,
      lease_length_preference: body.leaseLengthMonths ? parseInt(body.leaseLengthMonths) : null,
      credit_score_min: creditScoreMin,
      credit_score_max: creditScoreMax,
      yearly_income: body.incomeYearly ? parseFloat(body.incomeYearly) * 1000 : null, // Convert from thousands to actual amount
      num_occupants: body.numOccupants ? parseInt(body.numOccupants) : null,
      has_pets: hasPets,
      pet_details: petDetails,
      bedrooms_sought: body.numBedroomsSought ? parseInt(body.numBedroomsSought) : null,
      bathrooms_sought: body.numBathroomsSought ? parseInt(body.numBathroomsSought) : null,
      zillow_lead_type: body.leadType || null,
      zillow_global_listing_id: body.globalListingId || null,
    }

    // Insert the contact into the contacts table
    // Each Zillow inquiry creates a separate contact record for better tracking
    const { data: contactResult, error: contactError } = await supabaseService
      .from("contacts")
      .insert(contactData)
      .select()

    if (contactError) {
      console.error("Error inserting contact:", contactError)
      return NextResponse.json(
        {
          error: "Failed to create contact",
          details: contactError.message,
        },
        { status: 500 },
      )
    }

    // Get the created contact
    const contact = contactResult[0]
    if (!contact) {
      return NextResponse.json(
        { error: "Failed to retrieve contact after creation" },
        { status: 500 }
      )
    }

    // Create qualification_status record with automation enabled by default
    const { error: qualError } = await supabaseService
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
        message: "Contact created successfully",
        data: {
          contact: contact,
          property: property ? {
            id: property.id,
            address: property.address,
            city: property.city,
            state: property.state,
            zip: property.zip,
            unit: property.unit,
          } : null,
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
