"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { cn } from "@/lib/utils"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true)
    
    // Load sidebar collapsed state from localStorage
    const stored = localStorage.getItem("sidebarCollapsed")
    if (stored !== null) {
      setSidebarCollapsed(stored === "true")
    }

    // Listen for storage changes (when sidebar is toggled)
    const handleStorageChange = () => {
      const stored = localStorage.getItem("sidebarCollapsed")
      if (stored !== null) {
        setSidebarCollapsed(stored === "true")
      }
    }

    window.addEventListener("storage", handleStorageChange)
    
    // Also listen for custom event from same window
    const handleSidebarToggle = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.collapsed)
    }
    
    window.addEventListener("sidebarToggle" as any, handleSidebarToggle as any)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("sidebarToggle" as any, handleSidebarToggle as any)
    }
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
    <div className="relative min-h-screen">
      {showSidebar && <Sidebar />}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300",
          showSidebar && (sidebarCollapsed ? "ml-16" : "ml-64")
        )}
      >
        {children}
      </main>
      <Toaster />
    </div>
  )
}
