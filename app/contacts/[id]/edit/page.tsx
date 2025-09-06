"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AvatarUpload } from "@/components/contacts/avatar-upload"
import { useToast } from "@/components/ui/use-toast"

// Make sure we're importing the named export
import { supabase } from "@/utils/supabase/client-browser"

// Updated to match database values exactly (lowercase)
const leadSources = [
  "referral",
  "website",
  "zillow",
  "trulia",
  "realtor",
  "facebook",
  "craigslist",
  "streeteasy",
  "other",
] as const

// Updated to match database values exactly (lowercase with spaces)
const leadStatuses = [
  "new lead",
  "contacted",
  "viewing scheduled",
  "viewing completed",
  "negotiating",
  "contract sent",
  "closed",
  "lost",
] as const

type FormValues = {
  name: string
  title: string
  email: string
  phone: string
  linkedin: string
  industry: string
  leadSource: (typeof leadSources)[number]
  leadStatus: (typeof leadStatuses)[number]
}

// Updated default values to match database format
const defaultContactValues: FormValues = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin: "https://linkedin.com/in/",
  industry: "",
  leadSource: "referral", // lowercase
  leadStatus: "new lead", // lowercase with space
}

export default function EditContactPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = typeof params.id === "string" ? params.id : ""
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasContactPhoto, setHasContactPhoto] = useState(false)
  const [contactPhotoUrl, setContactPhotoUrl] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  // Use React state instead of react-hook-form
  const [formValues, setFormValues] = useState<FormValues>(defaultContactValues)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({})

  // Fetch contact data when component mounts
  useEffect(() => {
    async function fetchContact() {
      if (!user || !contactId) return

      setIsLoading(true)
      try {
        // Check if contact image exists
        try {
          const { data: contactImage } = await supabase.storage.from("contact-profiles").list(`${contactId}`, {
            limit: 1,
            search: "avatar1.jpg",
          })

          if (contactImage && contactImage.length > 0) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("contact-profiles").getPublicUrl(`${contactId}/avatar1.jpg`)

            setContactPhotoUrl(publicUrl)
            setHasContactPhoto(true)
          }
        } catch (imageError) {
          console.error("Error checking contact image:", imageError)
          // Continue with form loading even if image check fails
        }

        const { data, error } = await supabase
          .from("contacts")
          .select("name, title, email, phone, linkedin, industry, lead_source, lead_status")
          .eq("id", contactId)
          .single()

        if (error) {
          console.error("Error fetching contact:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load contact information.",
          })
          return
        }

        if (data) {
          // Create a new object with the data
          const formData = {
            name: data.name || "",
            title: data.title || "",
            email: data.email || "",
            phone: data.phone || "",
            linkedin: data.linkedin || "https://linkedin.com/in/",
            industry: data.industry || "",
            leadSource: (data.lead_source as any) || "referral",
            leadStatus: (data.lead_status as any) || "new lead",
          }

          // Set form values
          setFormValues(formData)
        }
      } catch (error) {
        console.error("Exception:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred while loading contact information.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchContact()
  }, [user, contactId, toast])

  const handleImageUpload = async (file: File) => {
    if (!contactId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Contact ID is missing.",
      })
      return null
    }

    setIsUploading(true)
    try {
      const { error } = await supabase.storage.from("contact-profiles").upload(`${contactId}/avatar1.jpg`, file, {
        upsert: true,
        cacheControl: "3600",
      })

      if (error) {
        throw error
      }

      // Get the public URL after successful upload
      const {
        data: { publicUrl },
      } = supabase.storage.from("contact-profiles").getPublicUrl(`${contactId}/avatar1.jpg`)

      setContactPhotoUrl(publicUrl)
      setHasContactPhoto(true)

      toast({
        title: "Success",
        description: "Image uploaded successfully.",
      })

      return publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload image. Please try again.",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Handle input changes
  const handleChange = (field: keyof FormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Manual validation function
  function validateForm(values: FormValues) {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}

    if (!values.name || values.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters."
    }

    if (!values.title || values.title.length < 2) {
      newErrors.title = "Title must be at least 2 characters."
    }

    if (!values.email || !/^\S+@\S+\.\S+$/.test(values.email)) {
      newErrors.email = "Please enter a valid email address."
    }

    if (!values.phone || values.phone.length < 10) {
      newErrors.phone = "Please enter a valid phone number."
    }

    if (!values.linkedin || !/^https?:\/\/\S+$/.test(values.linkedin)) {
      newErrors.linkedin = "Please enter a valid LinkedIn URL."
    }

    if (!values.industry || values.industry.length < 2) {
      newErrors.industry = "Industry must be at least 2 characters."
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors = validateForm(formValues)
    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      // Display first error
      const firstError = Object.values(newErrors)[0]
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: firstError,
      })
      return
    }

    if (!contactId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Contact ID is missing.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          name: formValues.name,
          title: formValues.title,
          email: formValues.email,
          phone: formValues.phone,
          linkedin: formValues.linkedin,
          industry: formValues.industry,
          lead_source: formValues.leadSource,
          lead_status: formValues.leadStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId)

      if (error) {
        console.error("Error updating contact:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update contact. Please try again.",
        })
        return
      }

      toast({
        title: "Success",
        description: "Contact updated successfully.",
      })

      router.push("/contacts")
    } catch (error) {
      console.error("Error updating contact:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-0px)] flex-col">
        <div className="border-b bg-background p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Loading Contact...</h1>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Contact</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-center">
              <AvatarUpload
                currentImage={hasContactPhoto && contactPhotoUrl ? contactPhotoUrl : "/placeholder.svg"}
                onImageChange={handleImageUpload}
                isUploading={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter full name"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formValues.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter job title"
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formValues.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formValues.linkedin}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                placeholder="Enter LinkedIn profile URL"
              />
              <p className="text-sm text-muted-foreground">
                Full URL to the LinkedIn profile (e.g., https://linkedin.com/in/username)
              </p>
              {errors.linkedin && <p className="text-sm text-red-500">{errors.linkedin}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formValues.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
                placeholder="Enter industry"
              />
              {errors.industry && <p className="text-sm text-red-500">{errors.industry}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadSource">Lead Source</Label>
              <Select value={formValues.leadSource} onValueChange={(value) => handleChange("leadSource", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead source" />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source
                        .split(".")
                        .map((part) =>
                          part
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" "),
                        )
                        .join(".")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadStatus">Lead Status</Label>
              <Select value={formValues.leadStatus} onValueChange={(value) => handleChange("leadStatus", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead status" />
                </SelectTrigger>
                <SelectContent>
                  {leadStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isUploading}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
