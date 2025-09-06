"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { CheckCircle } from "lucide-react"

export default function VerifySuccessPage() {
  const { refreshSession } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get("next") || "/dashboard"
  const [countdown, setCountdown] = useState(5)

  // Refresh the session when the page loads
  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Countdown and redirect
  useEffect(() => {
    if (countdown <= 0) {
      router.push(next)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router, next])

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verified!</CardTitle>
          <CardDescription>
            Your email has been successfully verified. You will be redirected in {countdown} seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => router.push(next)}>Continue to Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )
}
