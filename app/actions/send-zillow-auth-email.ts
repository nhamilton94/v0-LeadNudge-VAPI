"use server"

import { Resend } from "resend"
import { EmailTemplate } from "@/components/email-template"

interface Params {
  firstName: string
  lastName: string
  userPremierEmail: string
}

/**
 * Sends the Zillow Premier Agent lead-transfer request e-mail.
 * This runs **only on the server**.
 */
export async function sendZillowAuthEmail({ firstName, lastName, userPremierEmail }: Params) {
  const resend = new Resend(process.env.RESEND_API_KEY as string)

  // Zillow’s onboarding address & Make.com webhook URL
  const zillowEmail = "nbhamilton94@gmail.com"
  const webhookUrl = "https://hook.us2.make.com/5cvfqv8d4b7ghn14l6djl3ooh0skilft"

  const subject = `Lead Data Request: ${firstName} ${lastName}`

  const { data, error } = await resend.emails.send({
    from: "Lead Nudge <onboarding@summitlogisticsinc.us>",
    to: [zillowEmail],
    cc: [userPremierEmail],
    subject,
    react: EmailTemplate({ firstName, lastName, zillowEmail, webhookUrl }),
  })

  if (error) throw new Error(`Resend error: ${error.message}`)

  return data // returned to client if needed
}
