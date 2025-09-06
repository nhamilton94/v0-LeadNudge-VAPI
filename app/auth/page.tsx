"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoginForm } from "@/components/auth/login-form"
import { SignupForm } from "@/components/auth/signup-form"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const { user, isLoading, refreshSession } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams?.get("next") || "/dashboard"
  const error = searchParams?.get("error")
  const [redirecting, setRedirecting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [activeTab, setActiveTab] = useState("login")

  // Log cookies for debugging
  useEffect(() => {
    console.log(
      "Auth page cookies:",
      document.cookie.split(";").map((c) => c.trim()),
    )
  }, [])

  // Clear any sign-out flags when arriving at the auth page
  useEffect(() => {
    localStorage.removeItem("signing_out")
  }, [])

  // Handle error messages
  useEffect(() => {
    if (error) {
      console.log("Auth error detected:", error)
      const errorMessages: Record<string, string> = {
        missing_code: "Authentication code is missing. Please try again.",
        no_session_created: "Failed to create a session. Please try again.",
        auth_callback_error: "Authentication failed. Please try again.",
        unexpected_error: "An unexpected error occurred. Please try again.",
      }

      setErrorMessage(errorMessages[error] || `Authentication error: ${error}`)
    }
  }, [error])

  // Set a timeout for loading to prevent infinite spinner
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
      }, 10000) // 10 seconds timeout

      return () => clearTimeout(timer)
    }
  }, [isLoading])

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !redirecting) {
      console.log("User authenticated, redirecting to:", next)
      console.log(
        "Current cookies:",
        document.cookie.split(";").map((c) => c.trim()),
      )
      setRedirecting(true)

      // Check if next is a valid path and not an auth route
      const redirectPath =
        next && !next.startsWith("/auth") && !next.includes("://") && !next.startsWith("//") ? next : "/dashboard"

      // Add a small delay to ensure the session is properly set
      const timer = setTimeout(() => {
        router.replace(redirectPath)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [user, router, next, redirecting])

  // Handle manual refresh if loading takes too long
  const handleManualRefresh = async () => {
    setLoadingTimeout(false)
    await refreshSession()
  }

  if (loadingTimeout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Alert className="max-w-md">
          <AlertDescription>It's taking longer than expected to verify your authentication status.</AlertDescription>
        </Alert>
        <Button onClick={handleManualRefresh}>Retry</Button>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Redirecting to {next}...</p>
      </div>
    )
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>
            {activeTab === "login" ? "Sign in to your account to continue" : "Create an account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm redirectTo={next} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm redirectTo={next} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
