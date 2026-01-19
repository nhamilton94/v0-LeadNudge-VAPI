"use client"

import { useState, useEffect } from "react"
import { Bot, Phone, Play, Pause, PowerOff, RotateCcw, AlertTriangle, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ContactWithDetails } from "@/types/contact"

interface QualificationControlsProps {
  contact: ContactWithDetails
  userEmail: string
}

interface APIErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

export function QualificationControls({ contact, userEmail }: QualificationControlsProps) {
  const [isAutomated, setIsAutomated] = useState(contact.qualification_status?.automation_enabled || false)
  const [isLoading, setIsLoading] = useState(false)
  const [conversationStatus, setConversationStatus] = useState<'not_started' | 'active' | 'paused' | 'ended'>(
    contact.conversations?.[0]?.conversation_status || 'not_started'
  )
  const { toast } = useToast()

  // Fetch current automation status on component mount to ensure UI reflects database state
  useEffect(() => {
    const fetchCurrentAutomationStatus = async () => {
      try {
        console.log(`Fetching current automation status for contact ${contact.id}`)
        const response = await fetch(`/api/contacts/${contact.id}/automation`)
        const data = await response.json()
        
        if (response.ok && data.automation_enabled !== undefined) {
          console.log(`Current automation status for contact ${contact.id}:`, data.automation_enabled)
          setIsAutomated(data.automation_enabled)
        } else {
          console.log(`Could not fetch automation status for contact ${contact.id}:`, data.error)
          // Keep the initial state from props if API call fails
        }
      } catch (error) {
        console.error("Failed to fetch automation status:", error)
        // Keep the initial state from props if API call fails
      }
    }
    
    // Only fetch if we have a contact ID
    if (contact?.id) {
      fetchCurrentAutomationStatus()
    }
  }, [contact.id])

  // Fetch current conversation status on component mount to ensure UI reflects database state
  useEffect(() => {
    const fetchCurrentConversationStatus = async () => {
      try {
        console.log(`Fetching current conversation status for contact ${contact.id}`)
        const response = await fetch(`/api/contacts/${contact.id}/conversation-status`)
        const data = await response.json()
        
        if (response.ok && data.conversation_status !== undefined) {
          console.log(`Current conversation status for contact ${contact.id}:`, data.conversation_status)
          setConversationStatus(data.conversation_status)
        } else {
          console.log(`Could not fetch conversation status for contact ${contact.id}:`, data.error)
          // Keep the initial state from props if API call fails
        }
      } catch (error) {
        console.error("Failed to fetch conversation status:", error)
        // Keep the initial state from props if API call fails
      }
    }
    
    // Only fetch if we have a contact ID
    if (contact?.id) {
      fetchCurrentConversationStatus()
    }
  }, [contact.id])

  // Helper function to get current conversation
  const getCurrentConversation = () => contact.conversations?.[0] || null

  // Helper function to get conversation status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">🟢 Active</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">🟡 Paused</Badge>
      case 'not_started':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">⚪ Not Started</Badge>
      case 'ended':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">🔴 Ended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Handle automation toggle (enable/disable automation permission)
  const handleAutomationToggle = async () => {
    setIsLoading(true)
    try {
      const newAutomationState = !isAutomated
      
      const response = await fetch(`/api/contacts/${contact.id}/automation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          automation_enabled: newAutomationState,
          reason: newAutomationState ? "user_enabled" : "user_disabled"
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to toggle automation")

      setIsAutomated(newAutomationState)
      
      // If disabling automation, check if conversation should be paused
      if (!newAutomationState && conversationStatus === 'active') {
        setConversationStatus('paused')
      }

      toast({
        title: newAutomationState ? "Automation Enabled" : "Automation Disabled",
        description: newAutomationState 
          ? `Automation enabled for ${contact.name}. You can now start AI qualification.`
          : `Automation disabled for ${contact.name}. Active conversations have been paused.`,
      })

    } catch (error) {
      console.error("Failed to toggle automation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to toggle automation status",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // New smart automation handler based on conversation state
  const handleAutomationAction = async () => {
    setIsLoading(true)
    try {
      const currentStatus = conversationStatus

      if (currentStatus === 'not_started') {
        // Start new conversation
        const response = await fetch("/api/botpress/initiate-outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact.id.toString() }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to initiate outreach")

        setConversationStatus(data.conversationStatus || 'active')
        setIsAutomated(true)
        toast({
          title: "AI Qualification Started",
          description: `Started automated conversation with ${contact.name}`,
        })

      } else if (currentStatus === 'active') {
        // Pause conversation
        const response = await fetch("/api/botpress/pause-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            contactId: contact.id.toString(),
            reason: "user_paused"
          }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to pause conversation")

        setConversationStatus(data.conversationStatus || 'paused')
        setIsAutomated(false)
        toast({
          title: "AI Qualification Paused",
          description: `Paused automated conversation with ${contact.name}`,
        })

      } else if (currentStatus === 'paused') {
        // Resume conversation
        const response = await fetch("/api/botpress/resume-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: contact.id.toString() }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Failed to resume conversation")

        setConversationStatus(data.conversationStatus || 'active')
        setIsAutomated(true)
        toast({
          title: "AI Qualification Resumed",
          description: `Resumed automated conversation with ${contact.name}`,
        })

      } else if (currentStatus === 'ended') {
        // Show message that conversation has ended
        toast({
          variant: "destructive",
          title: "Cannot Resume",
          description: "This conversation has ended.",
        })
        return
      }

    } catch (error) {
      console.error("Failed to handle automation action:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update automation status",
      })
    } finally {
      setIsLoading(false)
    }
  }



  const getErrorMessage = (error: APIErrorResponse) => {
    switch (error.error.code) {
      case "config_error":
        return "System configuration error. Please contact support."
      case "validation_error":
        return `Invalid request: ${error.error.message}`
      case "vapi_error":
        return `VAPI error: ${error.error.message}`
      default:
        return error.error.message || "An unexpected error occurred"
    }
  }

  const handleStartQualification = async () => {
    setIsLoading(true)
    try {
      
      console.log("user email" + userEmail);
      const response = await fetch("/api/qualification/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: contact.id,
          phoneNumber: contact.phone,
          firstName: contact.name,
          host_email: userEmail,
          address: contact.interested_property_details?.address,
          attendee_email: contact.email
        }),

      })

      const data = await response.json()

      if (!response.ok) {
        const errorResponse = data as APIErrorResponse
        throw new Error(getErrorMessage(errorResponse))
      }
  
      toast({
        title: "Qualification Started",
        description: `Initiating call to ${contact.name} at ${contact.phone}`,
      })

      console.log("Call initiated:", data)

    /* FOR DEBUGGING
    const body = JSON.stringify({
          contactId: contact.id,
          phoneNumber: contact.phone,
          useTestNumber: useTestNumber,
          firstName: contact.first_name,
          host_email: userEmail,
          address: contact.interested_property_details?.address,
          attendee_email: contact.email
        })

    console.log(body)  */    
    } catch (error) {
      console.error("Failed to start qualification:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to initiate qualification call. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualification Controls</CardTitle>
        <CardDescription>Manage the qualification process for this contact</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="font-medium">Enable Automation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Enable or disable automated qualification process for this contact
            </p>
          </div>
          <Switch 
            checked={isAutomated} 
            onCheckedChange={handleAutomationToggle}
            disabled={isLoading}
          />
        </div>

        {/* Show conversation status section only when automation is enabled */}
        {isAutomated && (
          <>
            <Separator className="my-4" />
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span className="font-medium">AI Qualification Status</span>
                  {getStatusBadge(conversationStatus)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {conversationStatus === 'not_started' && "Ready to start automated qualification process"}
                  {conversationStatus === 'active' && "Automated qualification is currently running"}
                  {conversationStatus === 'paused' && "Automated qualification is temporarily paused"}
                  {conversationStatus === 'ended' && "Qualification process has been completed"}
                </p>
                {conversationStatus === 'paused' && getCurrentConversation()?.automation_pause_reason && (
                  <p className="text-xs text-yellow-600">
                    Reason: {getCurrentConversation()?.automation_pause_reason}
                  </p>
                )}
              </div>
            </div>
          </>
        )}


      </CardContent>
      <CardFooter className="justify-between space-x-2">


        {/* Smart state-based buttons - only show when automation is enabled */}
        {isAutomated && conversationStatus === 'not_started' && (
          <Button onClick={handleAutomationAction} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Start AI Qualification
              </>
            )}
          </Button>
        )}

        {isAutomated && conversationStatus === 'active' && (
          <Button onClick={handleAutomationAction} disabled={isLoading} variant="secondary">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Pausing...
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause AI Qualification
              </>
            )}
          </Button>
        )}

        {isAutomated && conversationStatus === 'paused' && (
          <Button onClick={handleAutomationAction} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume AI Qualification
              </>
            )}
          </Button>
        )}

        {isAutomated && conversationStatus === 'ended' && (
          <Button onClick={handleAutomationAction} disabled variant="outline">
            <PowerOff className="mr-2 h-4 w-4" />
            Conversation Ended
          </Button>
        )}

        {/* Show helpful message when automation is disabled */}
        {!isAutomated && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Enable automation above to start AI qualification for this contact
            </p>
          </div>
        )}

        {/* Keep the original VAPI qualification button for non-Botpress qualification */}
        {contact.qualification_status?.qualification_status === "not_started" && (
          <Button onClick={handleStartQualification} disabled={isLoading} variant="outline">
            {isLoading ? (
              <>
                <Phone className="mr-2 h-4 w-4 animate-pulse" />
                Initiating Call...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Start Phone Call
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
