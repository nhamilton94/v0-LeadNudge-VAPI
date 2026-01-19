"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  Users,
  LogOut,
  Settings,
  Puzzle,
  Building2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { useToast } from "@/components/ui/use-toast"

const sidebarItems = [
  {
    title: "Dashboard",
    icon: Activity,
    href: "/dashboard",
  },
  {
    title: "Messages",
    icon: MessageSquare,
    href: "/messages",
  },
  // {
  //   title: "Tasks",
  //   icon: FileText,
  //   href: "/tasks",
  // },
  {
    title: "Properties",
    icon: Building2,
    href: "/properties",
  },
  {
    title: "Contacts",
    icon: Users,
    href: "/contacts",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
  },
  {
    title: "Integrations",
    icon: Puzzle,
    href: "/integrations",
  },
  // {
  //   title: "Reports",
  //   icon: LayoutDashboard,
  //   href: "/reports",
  // },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed")
    if (stored !== null) {
      setIsCollapsed(stored === "true")
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))

    // Dispatch custom event for same-window communication
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { collapsed: newState } }))
  }

  // Add a function to handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)

      // First, clear any local storage items that might be causing issues
      localStorage.removeItem("supabase.auth.token")

      // Use the client-side supabase directly for sign out
      const { supabase } = await import("@/utils/supabase/client-browser")
      await supabase.auth.signOut()

      // Set a flag in localStorage to indicate we're signing out
      // This will help prevent redirection loops
      localStorage.setItem("signing_out", "true")

      // Navigate directly to auth page
      router.push("/auth")

      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      })
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
      })
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-white transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex items-center p-6 transition-all duration-300",
            isCollapsed ? "justify-center p-4" : "justify-start",
          )}
        >
          <h1 className={cn("text-xl font-semibold transition-all duration-300", isCollapsed ? "hidden" : "block")}>
            LeadNudgeAI
          </h1>
          {isCollapsed && <LayoutDashboard className="h-6 w-6" />}
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            const NavItem = (
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2 transition-all duration-300",
                  isActive && "bg-primary/5 text-primary",
                  isCollapsed && "justify-center px-2",
                )}
              >
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.title}</span>}
              </Button>
            )

            return (
              <Link key={item.href} href={item.href}>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                ) : (
                  NavItem
                )}
              </Link>
            )
          })}
        </nav>

        {user && (
          <div className="mt-auto px-4 py-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 transition-all duration-300",
                isCollapsed && "justify-center px-2",
              )}
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>}
            </Button>
          </div>
        )}

        <div className="p-4">
          <Button
            variant="ghost"
            size="icon"
            className="w-full justify-center"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
