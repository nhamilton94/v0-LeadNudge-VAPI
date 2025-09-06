import { NextResponse } from "next/server"
import { validateApiKey } from "./api-auth"

/**
 * Middleware to authenticate API requests using VAPI_KEY
 * @param request - The incoming request
 * @returns Response object or null if authentication passes
 */
export function authenticateApiRequest(request: Request): Response | null {
  const { isValid, error } = validateApiKey(request.headers)

  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        error: error || "Authentication failed",
      },
      { status: 401 },
    )
  }

  // Authentication passed
  return null
}
