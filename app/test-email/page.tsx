import { Resend } from "resend"
import { renderZillowAuthEmail } from "@/components/email-template"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Server Action: send a test Zillow-auth email.
 */
async function sendTestEmail(formData: FormData) {
  "use server"

  const email = (formData.get("email") as string) || "nbhamilton94@gmail.com"
  const firstName = (formData.get("firstName") as string) || "John"
  const lastName = (formData.get("lastName") as string) || "Smith"
  const webhookUrl = "https://hook.us2.make.com/5cvfqv8d4b7ghn14l6djl3ooh0skilft"

  try {
    const { data, error } = await resend.emails.send({
      from: "Lead Nudge <onboarding@summitlogisticsinc.us>",
      to: [email],
      subject: "Test Email from Lead Nudge",
      html: renderZillowAuthEmail({
        firstName,
        lastName,
        userEmail: email,
        webhookUrl,
      }),
    })

    if (error) {
      console.error("Resend send error:", error)
      throw new Error(error.message ?? "Unknown send error")
    }

    console.log("Email sent successfully:", data)
    return { success: true }
  } catch (err) {
    console.error("Server-action error:", err)
    throw err
  }
}

export default function TestEmailPage() {
  return (
    <div className="container mx-auto py-8 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Test Email Sending</CardTitle>
          <CardDescription>Send a test email with the Server Action to verify Resend integration.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={sendTestEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="test@example.com"
                defaultValue="nbhamilton94@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" type="text" placeholder="John" defaultValue="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" type="text" placeholder="Smith" defaultValue="Smith" />
            </div>
            <Button type="submit" className="w-full">
              Send Test Email
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
