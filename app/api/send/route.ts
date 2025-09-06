export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { Resend } from "resend"
import { EmailTemplate } from "@/components/email-template"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    console.log("POST handler invoked")
    const body = await request.json().catch(() => ({}))

    const to = body.to || "nbhamilton94@gmail.com"
    const firstName = body.firstName || "John"

    const { data, error } = await resend.emails.send({
      from: "Lead Nudge <onboarding@summitlogisticsinc.us>",
      to: [to],
      subject: "Hello world",
      react: EmailTemplate({ firstName }),
    })

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
