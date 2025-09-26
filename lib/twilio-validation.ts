import { validateRequest } from 'twilio'

export function validateTwilioWebhook(
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!authToken) {
    console.warn('TWILIO_AUTH_TOKEN not set - skipping webhook validation')
    return true // Allow in development
  }

  try {
    return validateRequest(authToken, twilioSignature, url, params)
  } catch (error) {
    console.error('Twilio webhook validation error:', error)
    return false
  }
}