import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import "@/styles/theme-override.css" // Add this line to import the override

import { SupabaseAuthProvider } from "@/components/auth/supabase-auth-provider"
import ClientLayout from "@/components/layout/client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Real Estate Dashboard",
  description: "Manage your real estate contacts, properties, and communications",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen bg-background antialiased ${inter.className}`}>
        <SupabaseAuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
