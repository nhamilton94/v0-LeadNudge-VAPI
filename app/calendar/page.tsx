"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { useRouter } from "next/navigation"

export default function CalendarPage() {
  // All hooks must be called at the top level, before any conditional returns
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push("/auth?next=/calendar")
    }
  }, [user, isLoading, router, mounted])

  // Encode the user's email for the Google Calendar iframe URL
  const encodedEmail = user?.email ? encodeURIComponent(user.email) : ""

  // Determine what to render based on loading and authentication state
  const renderContent = () => {
    if (isLoading || !mounted) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      )
    }

    if (!user) {
      return null // Will redirect in the useEffect
    }

    return (
      <div className="flex-1 overflow-hidden p-4">
        {encodedEmail ? (
          <div className="h-full w-full">
            <iframe
              src={`https://calendar.google.com/calendar/embed?src=${encodedEmail}`}
              style={{ border: 0 }}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              title="Google Calendar"
              className="min-h-[600px] w-full rounded-md shadow-md"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Unable to load calendar. Email address not available.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Calendar</h1>
        </div>
      </div>
      {renderContent()}
    </div>
  )
}
