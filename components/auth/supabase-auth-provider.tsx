"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      setIsLoading(true)
      console.log("Manually refreshing session...")

      // Log cookies in browser
      console.log(
        "Browser cookies during refresh:",
        document.cookie.split(";").map((c) => c.trim()),
      )

      const { data, error } = await supabase.auth.getSession()

      console.log("Session refresh result:", {
        success: !error,
        hasSession: !!data?.session,
        error: error ? error.message : null,
      })

      if (error) {
        console.error("Error refreshing session:", error)
        return
      }
      setSession(data.session)
      setUser(data.session?.user ?? null)
    } catch (err) {
      console.error("Unexpected error refreshing session:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Function to sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        setIsLoading(true)
        console.log("Checking initial session...")

        // Log cookies in browser
        console.log(
          "Browser cookies during initialization:",
          document.cookie.split(";").map((c) => c.trim()),
        )

        const { data, error } = await supabase.auth.getSession()

        console.log("Initial session check result:", {
          success: !error,
          hasSession: !!data?.session,
          error: error ? error.message : null,
        })

        if (error) {
          console.error("Error getting initial session:", error)
          return
        }

        if (data.session) {
          setSession(data.session)
          setUser(data.session.user)
        }
      } catch (err) {
        console.error("Unexpected error in auth initialization:", err)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, "Session:", session ? "Present" : "Missing")
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
