"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/utils/supabase/client-browser"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createBrowserSupabaseClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          router.push("/dashboard")
        } else {
          router.push("/auth")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/auth")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  )
}
