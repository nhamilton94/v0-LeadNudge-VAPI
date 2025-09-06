"use client"

import type React from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
// Add the import for SupabaseAuthProvider
import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith("/auth")

  // Wrap the children with SupabaseAuthProvider
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background antialiased", inter.className)}>
        <SupabaseAuthProvider>
          <div className="relative flex min-h-screen">
            {!isAuthRoute && <Sidebar />}
            <main className="flex-1 transition-all duration-300">{children}</main>
            <Toaster />
          </div>
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
