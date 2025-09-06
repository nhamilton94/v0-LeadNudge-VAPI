import type { ReactNode } from "react"
import { Inter } from "next/font/google"

import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className={cn("min-h-screen bg-slate-50", inter.className)}>
      {children}
      <Toaster />
    </div>
  )
}
