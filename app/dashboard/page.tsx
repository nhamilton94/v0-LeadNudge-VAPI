"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { QualificationMetrics } from "@/components/dashboard/qualification-metrics"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push("/auth?next=/dashboard")
    }
  }, [user, isLoading, router, mounted])

  // Show loading state
  if (isLoading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    )
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b bg-background px-6 py-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">245</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">+4% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">+7% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">36.3%</div>
                <p className="text-xs text-muted-foreground">+2.5% from last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Qualification Overview</CardTitle>
                <CardDescription>Monthly qualification metrics and trends</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <Overview />
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Qualification Metrics</CardTitle>
                <CardDescription>Current qualification distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <QualificationMetrics />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest qualification updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <RecentActivity />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
