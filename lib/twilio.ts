import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !fromPhoneNumber) {
  throw new Error('Missing required Twilio environment variables')
}

const client = twilio(accountSid, authToken)

export async function sendTwilioSMS(to: string, body: string) {
  try {
    const message = await client.messages.create({
      from: fromPhoneNumber,
      to: to,
      body: body,
    })
    
    return {
      success: true,
      messageSid: message.sid,
      status: message.status
    }
  } catch (error) {
    console.error('Twilio SMS error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}