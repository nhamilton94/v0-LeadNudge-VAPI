import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
          <CardDescription>We've sent you a verification link to complete your registration</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="rounded-full bg-primary/10 p-6">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Please check your email inbox and click on the verification link to complete your registration. If you don't
            see the email, check your spam folder.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth">Return to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
