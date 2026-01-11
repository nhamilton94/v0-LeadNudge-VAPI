import twilio from 'twilio'

// Lazy initialization - client will be created on first use
let client: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  
  if (!accountSid || !authToken) {
    throw new Error('Missing required Twilio environment variables: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN')
  }
  
  if (!client) {
    client = twilio(accountSid, authToken)
  }
  
  return client
}

export async function sendTwilioSMS(to: string, body: string) {
  try {
    const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER
    
    if (!fromPhoneNumber) {
      throw new Error('Missing required Twilio environment variable: TWILIO_PHONE_NUMBER')
    }
    
    const twilioClient = getTwilioClient()
    
    const message = await twilioClient.messages.create({
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