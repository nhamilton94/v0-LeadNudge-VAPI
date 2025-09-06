"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Info, Mail, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react"
import { createBrowserSupabaseClient } from "@/utils/supabase/client-browser"
import { updateZillowPremierEmail, updateZillowIntegrationStatus } from "@/lib/services/profile-service"
import type { ZillowIntegrationStatus } from "@/lib/database.types"
import { sendZillowAuthEmail } from "@/app/actions/send-zillow-auth-email"

export default function IntegrationsPage() {
  const [zillowStatus, setZillowStatus] = useState<ZillowIntegrationStatus>("inactive")
  const [zillowEmail, setZillowEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  // Load user profile data
  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("zillow_integration_status, zillow_premier_email, first_name, last_name")
            .eq("id", user.id)
            .single()

          if (profile) {
            setZillowStatus(profile.zillow_integration_status || "inactive")
            setZillowEmail(profile.zillow_premier_email || "")
            setFirstName(profile.first_name || "")
            setLastName(profile.last_name || "")
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [supabase])

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setEmailError("Email address is required")
      return false
    }
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address")
      return false
    }
    setEmailError("")
    return true
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    setZillowEmail(email)
    if (email) {
      validateEmail(email)
    } else {
      setEmailError("")
    }
  }

  const handleSaveEmail = async () => {
    if (!validateEmail(zillowEmail)) {
      return
    }

    setIsSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await updateZillowPremierEmail(user.id, zillowEmail)
        toast({
          title: "Success",
          description: "Zillow Premier Agent email address saved successfully",
        })
      }
    } catch (error) {
      console.error("Error saving email:", error)
      toast({
        title: "Error",
        description: "Failed to save email address. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleIntegrationAction = async () => {
    if (!zillowEmail || emailError) {
      toast({
        title: "Error",
        description: "Please enter a valid Zillow Premier Agent email address first.",
        variant: "destructive",
      })
      return
    }

    setIsActivating(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        if (zillowStatus === "active") {
          // Deactivate integration
          await updateZillowIntegrationStatus(user.id, "inactive")
          setZillowStatus("inactive")
          toast({
            title: "Integration Deactivated",
            description: "Zillow integration has been deactivated.",
          })
        } else {
          // Activate integration (set to pending)
          await updateZillowIntegrationStatus(user.id, "pending")
          setZillowStatus("pending")
          // trigger resend and send email to zillow
          await sendZillowAuthEmail({
            firstName,
            lastName,
            userPremierEmail: zillowEmail,
          })
          toast({
            title: "Integration Request Sent",
            description: "We've sent an authorization request to Zillow. You'll receive leads once approved.",
          })
        }
      }
    } catch (error) {
      console.error("Error updating integration status:", error)
      toast({
        title: "Error",
        description: "Failed to update integration status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsActivating(false)
    }
  }

  const getStatusBadge = (status: ZillowIntegrationStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )
    }
  }

  const getStatusMessage = (status: ZillowIntegrationStatus) => {
    switch (status) {
      case "active":
        return "Your Zillow integration is active and receiving leads."
      case "pending":
        return "We've sent an authorization request to Zillow. You'll start receiving leads once they approve the connection."
      case "failed":
        return "The integration setup failed. Please try again or contact support."
      default:
        return "Integration is not yet set up."
    }
  }

  const getButtonText = (status: ZillowIntegrationStatus) => {
    switch (status) {
      case "active":
        return "Deactivate Integration"
      case "pending":
        return "Pending Activation"
      default:
        return "Activate Integration"
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">Connect your favorite tools and services to streamline your workflow</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Zillow Integration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Z</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Zillow Integration
                    {getStatusBadge(zillowStatus)}
                  </CardTitle>
                  <CardDescription>Automatically sync your Zillow leads directly into LeadNudge</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Message */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{getStatusMessage(zillowStatus)}</p>
            </div>

            {/* Zillow Premier Email Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zillow-email" className="text-sm font-medium">
                  Zillow Premier Agent Email Address
                </Label>
                <p className="text-sm text-muted-foreground">
                  To connect your Zillow Premier Agent account and start receiving leads in your dashboard, we need your
                  Zillow Premier Agent email address. This is the email you use to log in at Zillow Premier Agent.
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="zillow-email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={zillowEmail}
                      onChange={handleEmailChange}
                      className={`pl-10 ${emailError ? "border-red-500" : ""}`}
                      disabled={zillowStatus === "pending"}
                    />
                  </div>
                  {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                </div>
                <Button
                  onClick={handleSaveEmail}
                  disabled={!zillowEmail || !!emailError || isSaving || zillowStatus === "pending"}
                  variant="outline"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    In order to activate the Zillow integration, we'll need you to do the following:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Enter your Zillow Premier Agent email address above and press "Save".</li>
                    <li>
                      Press "Activate Integration", and we'll send Zillow an authorization request on your behalf.
                    </li>
                    <li>Once Zillow authorizes the connection, you'll automatically start receiving leads!</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-4 pt-2">
              <Button
                variant={zillowStatus === "active" ? "destructive" : "default"}
                size="sm"
                onClick={handleIntegrationAction}
                disabled={!zillowEmail || !!emailError || isActivating || zillowStatus === "pending"}
              >
                {isActivating ? "Processing..." : getButtonText(zillowStatus)}
              </Button>
              {zillowStatus === "failed" && (
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>
                <strong>Features:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Automatic lead import from Zillow Premier Agent</li>
                <li>Real-time lead notifications</li>
                <li>Lead qualification and scoring</li>
                <li>Automated follow-up sequences</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future integrations */}
        <Card className="opacity-60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    More Integrations Coming Soon
                    <Badge variant="outline">Coming Soon</Badge>
                  </CardTitle>
                  <CardDescription>
                    We're working on adding more integrations to help you manage your leads
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Stay tuned for integrations with Realtor.com, MLS systems, and more lead generation platforms.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
