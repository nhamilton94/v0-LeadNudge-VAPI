"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import GoogleSignIn from "./google-sign-in"
import { supabase } from "@/lib/supabase/client"

export function OAuthButtons({
  mode = "login",
  redirectTo = "/dashboard",
}: {
  mode?: "login" | "signup"
  redirectTo?: string
}) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGithubSignIn = async () => {
    try {
      setIsLoading(true)

      // Get the site URL from environment variable with fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const redirectUrl = `${siteUrl}/auth/callback`

      console.log("GitHub OAuth redirect URL:", redirectUrl)

      await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
        },
      })
    } catch (error) {
      console.error("Error signing in with GitHub:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <GoogleSignIn />
      <Button variant="outline" type="button" disabled={isLoading} onClick={handleGithubSignIn} className="w-full">
        {isLoading ? "Loading..." : `Continue with GitHub`}
      </Button>
    </div>
  )
}
