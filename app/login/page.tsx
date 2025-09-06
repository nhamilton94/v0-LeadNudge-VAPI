"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GoogleSignIn from "@/components/auth/google-sign-in"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "access_denied":
          setError("You need to grant calendar access to use this feature. Please try again.")
          break
        case "server_error":
          setError("An error occurred during authentication. Please try again.")
          break
        case "missing_code":
          setError("Authentication code missing. Please try again.")
          break
        default:
          setError("An unknown error occurred. Please try again.")
      }
    }
  }, [searchParams])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in to access your dashboard and calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <GoogleSignIn />
        </CardContent>
      </Card>
    </div>
  )
}
