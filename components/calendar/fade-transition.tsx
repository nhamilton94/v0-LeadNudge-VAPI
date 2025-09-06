"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface FadeTransitionProps {
  children: React.ReactNode
  show: boolean
  className?: string
}

export function FadeTransition({ children, show, className }: FadeTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show)

  useEffect(() => {
    if (show) setShouldRender(true)
    else {
      const timer = setTimeout(() => setShouldRender(false), 300) // Match duration
      return () => clearTimeout(timer)
    }
  }, [show])

  return (
    <div className={cn("transition-opacity duration-300", show ? "opacity-100" : "opacity-0", className)}>
      {shouldRender && children}
    </div>
  )
}
