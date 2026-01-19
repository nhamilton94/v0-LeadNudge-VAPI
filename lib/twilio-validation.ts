import { validateRequest } from 'twilio'

export function validateTwilioWebhook(
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  // Skip validation in development or when using ngrok
  if (!authToken || process.env.NODE_ENV === 'development' || url.includes('ngrok')) {
    console.warn('Skipping Twilio webhook validation (development mode)')
    return true
  }

  try {
    console.log("twilioSignature", twilioSignature)
    console.log("url", url)
    console.log("params", params)
    return validateRequest(authToken, twilioSignature, url, params)
  } catch (error) {
    console.log(error)
    console.error('Twilio webhook validation error:', error)
    return false
  }
}