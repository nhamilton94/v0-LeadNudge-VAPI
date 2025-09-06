"use client"

import { useState } from "react"
import { Bot, Phone, Play, PowerOff, RotateCcw, AlertTriangle } from "lucide-react"
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

interface Contact {
  id: number
  name: string
  phone: string
  first_name: string
  last_name: string
  email: string
  qualification_status?: {
    qualification_status: string
    automation_enabled: boolean
  }
  interested_property?: {
    id: string
    address?: string
    city?: string// Include other property fields you need
    state?: string
    zip?: string
    price?: number
    bedrooms?: number
    bathrooms?: number
    // ... add more properties as needed
  }
}

interface QualificationControlsProps {
  contact: Contact
  userEmail: String
}

interface APIErrorResponse {
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
}

// Default test phone number for reference
const DEFAULT_TEST_PHONE_NUMBER = "+19089433888"//"+16307477672"//"+16099635631"

export function QualificationControls({ contact, userEmail }: QualificationControlsProps) {
  const [isAutomated, setIsAutomated] = useState(contact.qualification_status?.automation_enabled || false)
  const [isLoading, setIsLoading] = useState(false)
  const [useTestNumber, setUseTestNumber] = useState(false)
  const { toast } = useToast()

  const handleAutomationToggle = async () => {
    try {
      // Here you would make an API call to update the automation status
      setIsAutomated(!isAutomated)
      console.log(`Toggled automation for contact ${contact.id} to ${!isAutomated}`)
    } catch (error) {
      console.error("Failed to toggle automation:", error)
    }
  }

  const handleResetQualification = async () => {
    try {
      // Here you would make an API call to reset the qualification
      console.log(`Reset qualification for contact ${contact.id}`)
    } catch (error) {
      console.error("Failed to reset qualification:", error)
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
          useTestNumber: useTestNumber,
          firstName: contact.name,
          host_email: userEmail,
          address: contact.interested_property.address,
          attendee_email: contact.email
        }),

      })

      const data = await response.json()

      if (!response.ok) {
        const errorResponse = data as APIErrorResponse
        throw new Error(getErrorMessage(errorResponse))
      }
  
      toast({
        title: useTestNumber ? "Test Qualification Started" : "Qualification Started",
        description: `Initiating call to ${useTestNumber ? "test number" : contact.name} at ${useTestNumber ? DEFAULT_TEST_PHONE_NUMBER : contact.phone}`,
      })

      console.log("Call initiated:", data)

    /* FOR DEBUGGING
    const body = JSON.stringify({
          contactId: contact.id,
          phoneNumber: contact.phone,
          useTestNumber: useTestNumber,
          firstName: contact.first_name,
          host_email: userEmail,
          address: contact.interested_property.address,
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
              <span className="font-medium">AI Qualification</span>
            </div>
            <p className="text-sm text-muted-foreground">Enable or disable automated qualification process</p>
          </div>
          <Switch checked={isAutomated} onCheckedChange={handleAutomationToggle} />
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="font-medium">Test Mode</span>
              {useTestNumber && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
                  Testing
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">Use default test phone number instead of contact's number</p>
            {useTestNumber && (
              <div className="flex items-center mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Using test number: {DEFAULT_TEST_PHONE_NUMBER}
              </div>
            )}
          </div>
          <Switch checked={useTestNumber} onCheckedChange={setUseTestNumber} />
        </div>
      </CardContent>
      <CardFooter className="justify-between space-x-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Qualification
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reset all qualification progress and start the process over. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetQualification}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {contact.qualification_status?.qualification_status === "not_started" && (
          <Button onClick={handleStartQualification} disabled={isLoading}>
            {isLoading ? (
              <>
                <Phone className="mr-2 h-4 w-4 animate-pulse" />
                Initiating Call...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {useTestNumber ? "Start Test Qualification" : "Start Qualification"}
              </>
            )}
          </Button>
        )}
        {contact.qualification_status?.qualification_status === "in_progress" && (
          <Button variant="secondary" onClick={handleStartQualification} disabled={isLoading}>
            <PowerOff className="mr-2 h-4 w-4" />
            Stop Qualification
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
