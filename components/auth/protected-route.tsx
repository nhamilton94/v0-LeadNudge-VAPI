"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/supabase-auth-provider"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      // Save the current path to redirect back after login
      const currentPath = window.location.pathname
      router.push(`/auth?next=${encodeURIComponent(currentPath)}`)
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return <>{children}</>
}
