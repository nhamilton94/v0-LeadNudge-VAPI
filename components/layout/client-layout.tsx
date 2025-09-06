"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/components/auth/supabase-auth-provider"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we're on an auth route
  const isAuthRoute = pathname?.startsWith("/auth")

  // Don't render sidebar until we know the auth state
  const showSidebar = mounted && !isAuthRoute && user

  // Add a class to the body when loading to prevent flashes
  useEffect(() => {
    if (isLoading) {
      document.body.classList.add("auth-loading")
    } else {
      document.body.classList.remove("auth-loading")
    }
  }, [isLoading])

  return (
    <div className="relative flex min-h-screen">
      {showSidebar && <Sidebar />}
      <main className="flex-1 transition-all duration-300">{children}</main>
      <Toaster />
    </div>
  )
}
