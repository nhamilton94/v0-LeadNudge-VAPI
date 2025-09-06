/**
 * Utility functions for API authentication
 */

/**
 * Validates the VAPI_KEY from request headers against the environment variable
 * @param headers - Request headers
 * @returns Object containing validation result and error message if applicable
 */
export function validateApiKey(headers: Headers): { isValid: boolean; error?: string } {
  // Get the API key from the request headers
  const apiKey = headers.get("VAPI_KEY") || headers.get("vapi_key")

  // Get the expected API key from environment variables
  const expectedApiKey = process.env.VAPI_KEY

  // Check if API key is provided
  if (!apiKey) {
    return {
      isValid: false,
      error: "API key is required",
    }
  }

  // Check if environment variable is configured
  if (!expectedApiKey) {
    return {
      isValid: false,
      error: "API key configuration error",
    }
  }

  // Validate the API key
  if (apiKey !== expectedApiKey) {
    return {
      isValid: false,
      error: "Invalid API key",
    }
  }

  // API key is valid
  return { isValid: true }
}
