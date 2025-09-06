import { NextResponse } from "next/server"
import { authenticateApiRequest } from "@/lib/auth/api-middleware"

// Constants for VAPI configuration
const VAPI_KEY = process.env.VAPI_KEY
const VAPI_PHONE_NUMBER_ID = "430b878b-001b-4bc0-b691-77bbc5fdb5b6"//"6458f9d0-a831-4d85-9428-8e46993988e2"//"cbe04d9d-c490-43ff-825b-057e2ddbc2c5"
const VAPI_SQUAD_ID = "02574681-e733-4d69-954e-7b282d48bfb1"
const VAPI_ASSISTANT_ID = "992f6a59-5b7b-40f9-9ccb-12a28c8e5fa2"
const DEFAULT_TEST_PHONE_NUMBER = "+19089433888"//"+16307477672"// "+16099635631"//

interface VAPIErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export async function POST(req: Request) {
  // Authenticate the request
  /*const authResponse = authenticateApiRequest(req)
  if (authResponse) {
    return authResponse
  }*/

  if (!VAPI_KEY) {
    return NextResponse.json(
      {
        error: {
          code: "config_error",
          message: "VAPI key not configured",
        },
      } satisfies VAPIErrorResponse,
      { status: 500 },
    )
  }

  try {
    const body = await req.json()
    console.log("body: " + JSON.stringify(body))
    
    const { contactId, phoneNumber, host_email, firstName, address, useTestNumber, attendee_email } = body
        


    // Use test number or provided phone number
    const customerNumber = useTestNumber ? DEFAULT_TEST_PHONE_NUMBER : phoneNumber

    if (!customerNumber) {
      return NextResponse.json(
        {
          error: {
            code: "validation_error",
            message: "Phone number is required",
            details: { field: "phoneNumber" },
          },
        } satisfies VAPIErrorResponse,
        { status: 400 },
      )
    }

    // Initialize outbound call with VAPI
    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VAPI_KEY}`
         
      },
      body: JSON.stringify({
        //assistantId: VAPI_ASSISTANT_ID,
        //squadId: VAPI_SQUAD_ID,
        phoneNumberId: VAPI_PHONE_NUMBER_ID,
        customer: {
          number: customerNumber,
        },
        squadId: "02574681-e733-4d69-954e-7b282d48bfb1"
        /*squad: {
            members: [
                { assistantId: "7f595100-0c9c-4c6e-9d7f-0b057b696798"},
                { assistantId: "65b479bc-f465-4b5d-8b7a-6d25f0491507"},
                { assistantId: "2f71847d-1a07-404d-a945-c86a68616fbc"}
            ],
            membersOverrides: { 
            //assistantOverrides: {
                variableValues: {
                    first_name: firstName,
                    host_email: host_email,
                    address: address,
                    attendee_email: attendee_email
                }        
            }            
        },*/

      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Pass through VAPI error response
      return NextResponse.json(
        {
          error: {
            code: data.error?.code || "vapi_error",
            message: data.error?.message || "VAPI request failed",
            details: data.error?.details,
          },
        } satisfies VAPIErrorResponse,
        { status: response.status },
      )
    }

    return NextResponse.json({
      ...data,
      testMode: useTestNumber,
      phoneNumber: customerNumber,
    })
  } catch (error) {
    console.error("Outbound call error:", error)
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: "An unexpected error occurred while processing your request",
          details: { originalError: error instanceof Error ? error.message : String(error) },
        },
      } satisfies VAPIErrorResponse,
      { status: 500 },
    )
  }
}
