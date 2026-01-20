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
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/contacts/avatar-upload"
import { useToast } from "@/components/ui/use-toast"

// Make sure we're importing the named export
import { supabase } from "@/utils/supabase/client-browser"
import { parseLegacyName, combineNames } from "@/utils/contact-name"

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

// Lease length options (in months)
const leaseLengthOptions = [
  { value: 3, label: "3 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
  { value: 24, label: "24 months" },
  { value: 0, label: "Month-to-month" },
] as const

type FormValues = {
  firstName: string
  lastName: string
  title: string
  email: string
  phone: string
  linkedin: string
  industry: string
  leadSource: (typeof leadSources)[number]
  leadStatus: (typeof leadStatuses)[number]
  // Rental preference fields
  moveInDate?: string
  leaseLengthPreference?: number
  bedroomsSought?: number
  bathroomsSought?: number
  numOccupants?: number
  // Financial fields
  creditScoreMin?: number
  creditScoreMax?: number
  yearlyIncome?: number
  // Pet fields
  hasPets?: boolean
  petDetails?: string
}

// Updated default values to match database format
const defaultContactValues: FormValues = {
  firstName: "",
  lastName: "",
  title: "",
  email: "",
  phone: "",
  linkedin: "https://linkedin.com/in/",
  industry: "",
  leadSource: "referral", // lowercase
  leadStatus: "new lead", // lowercase with space
  // Rental preferences
  moveInDate: undefined,
  leaseLengthPreference: undefined,
  bedroomsSought: undefined,
  bathroomsSought: undefined,
  numOccupants: undefined,
  // Financial information
  creditScoreMin: undefined,
  creditScoreMax: undefined,
  yearlyIncome: undefined,
  // Pet information
  hasPets: false,
  petDetails: undefined,
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
          .select(`
            name, first_name, last_name, title, email, phone, linkedin, industry, lead_source, lead_status,
            move_in_date, lease_length_preference, bedrooms_sought, bathrooms_sought, num_occupants,
            credit_score_min, credit_score_max, yearly_income, has_pets, pet_details
          `)
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
          // Migration logic: Use first_name/last_name if available, else parse legacy name
          let firstName = data.first_name || ""
          let lastName = data.last_name || ""
          
          // If no first/last names but we have a legacy name, parse it
          if (!firstName && !lastName && data.name) {
            const parsed = parseLegacyName(data.name)
            firstName = parsed.firstName
            lastName = parsed.lastName
          }

          // Create a new object with the data
          const formData = {
            firstName,
            lastName,
            title: data.title || "",
            email: data.email || "",
            phone: data.phone || "",
            linkedin: data.linkedin || "https://linkedin.com/in/",
            industry: data.industry || "",
            leadSource: (data.lead_source as any) || "referral",
            leadStatus: (data.lead_status as any) || "new lead",
            // Rental preferences
            moveInDate: data.move_in_date || undefined,
            leaseLengthPreference: data.lease_length_preference || undefined,
            bedroomsSought: data.bedrooms_sought || undefined,
            bathroomsSought: data.bathrooms_sought || undefined,
            numOccupants: data.num_occupants || undefined,
            // Financial information
            creditScoreMin: data.credit_score_min || undefined,
            creditScoreMax: data.credit_score_max || undefined,
            yearlyIncome: data.yearly_income || undefined,
            // Pet information
            hasPets: data.has_pets || false,
            petDetails: data.pet_details || undefined,
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
  const handleChange = (field: keyof FormValues, value: string | number | boolean | undefined) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Manual validation function
  function validateForm(values: FormValues) {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}

    if (!values.firstName || values.firstName.length < 1) {
      newErrors.firstName = "First name is required."
    }

    if (!values.lastName || values.lastName.length < 1) {
      newErrors.lastName = "Last name is required."
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

    // Validate credit score range
    if (values.creditScoreMin !== undefined && (values.creditScoreMin < 300 || values.creditScoreMin > 850)) {
      newErrors.creditScoreMin = "Credit score must be between 300 and 850."
    }

    if (values.creditScoreMax !== undefined && (values.creditScoreMax < 300 || values.creditScoreMax > 850)) {
      newErrors.creditScoreMax = "Credit score must be between 300 and 850."
    }

    if (values.creditScoreMin !== undefined && values.creditScoreMax !== undefined && values.creditScoreMin > values.creditScoreMax) {
      newErrors.creditScoreMax = "Credit score maximum must be greater than or equal to minimum."
    }

    // Validate numeric fields
    if (values.yearlyIncome !== undefined && values.yearlyIncome < 0) {
      newErrors.yearlyIncome = "Annual income must be a positive number."
    }

    if (values.numOccupants !== undefined && values.numOccupants < 1) {
      newErrors.numOccupants = "Number of occupants must be at least 1."
    }

    if (values.bedroomsSought !== undefined && values.bedroomsSought < 0) {
      newErrors.bedroomsSought = "Bedrooms sought must be 0 or more."
    }

    if (values.bathroomsSought !== undefined && values.bathroomsSought < 0) {
      newErrors.bathroomsSought = "Bathrooms sought must be 0 or more."
    }

    // Validate pet details required when has pets
    if (values.hasPets && (!values.petDetails || !values.petDetails.trim())) {
      newErrors.petDetails = "Pet details are required when pets are present."
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
          first_name: formValues.firstName,
          last_name: formValues.lastName,
          name: combineNames(formValues.firstName, formValues.lastName),
          title: formValues.title,
          email: formValues.email,
          phone: formValues.phone,
          linkedin: formValues.linkedin,
          industry: formValues.industry,
          lead_source: formValues.leadSource,
          lead_status: formValues.leadStatus,
          // Rental preferences
          move_in_date: formValues.moveInDate || null,
          lease_length_preference: formValues.leaseLengthPreference || null,
          bedrooms_sought: formValues.bedroomsSought || null,
          bathrooms_sought: formValues.bathroomsSought || null,
          num_occupants: formValues.numOccupants || null,
          // Financial information
          credit_score_min: formValues.creditScoreMin || null,
          credit_score_max: formValues.creditScoreMax || null,
          yearly_income: formValues.yearlyIncome || null,
          // Pet information
          has_pets: formValues.hasPets || false,
          pet_details: formValues.petDetails || null,
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formValues.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Enter first name"
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formValues.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Enter last name"
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
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

            {/* Rental Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>Rental Preferences</CardTitle>
                <CardDescription>Information about rental requirements and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moveInDate">Move-in Date</Label>
                    <Input
                      id="moveInDate"
                      type="date"
                      value={formValues.moveInDate || ""}
                      onChange={(e) => handleChange("moveInDate", e.target.value || undefined)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaseLengthPreference">Lease Length Preference</Label>
                    <Select 
                      value={formValues.leaseLengthPreference?.toString() || ""} 
                      onValueChange={(value) => handleChange("leaseLengthPreference", value ? Number(value) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lease length" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaseLengthOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedroomsSought">Bedrooms Sought</Label>
                    <Input
                      id="bedroomsSought"
                      type="number"
                      min="0"
                      value={formValues.bedroomsSought?.toString() || ""}
                      onChange={(e) => handleChange("bedroomsSought", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                    />
                    {errors.bedroomsSought && <p className="text-sm text-red-500">{errors.bedroomsSought}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathroomsSought">Bathrooms Sought</Label>
                    <Input
                      id="bathroomsSought"
                      type="number"
                      min="0"
                      step="0.5"
                      value={formValues.bathroomsSought?.toString() || ""}
                      onChange={(e) => handleChange("bathroomsSought", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="0"
                    />
                    {errors.bathroomsSought && <p className="text-sm text-red-500">{errors.bathroomsSought}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numOccupants">Number of Occupants</Label>
                    <Input
                      id="numOccupants"
                      type="number"
                      min="1"
                      value={formValues.numOccupants?.toString() || ""}
                      onChange={(e) => handleChange("numOccupants", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="1"
                    />
                    {errors.numOccupants && <p className="text-sm text-red-500">{errors.numOccupants}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Credit and income information for qualification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditScoreMin">Credit Score (Min)</Label>
                    <Input
                      id="creditScoreMin"
                      type="number"
                      min="300"
                      max="850"
                      value={formValues.creditScoreMin?.toString() || ""}
                      onChange={(e) => handleChange("creditScoreMin", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="300"
                    />
                    <p className="text-xs text-muted-foreground">Range: 300-850</p>
                    {errors.creditScoreMin && <p className="text-sm text-red-500">{errors.creditScoreMin}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creditScoreMax">Credit Score (Max)</Label>
                    <Input
                      id="creditScoreMax"
                      type="number"
                      min="300"
                      max="850"
                      value={formValues.creditScoreMax?.toString() || ""}
                      onChange={(e) => handleChange("creditScoreMax", e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="850"
                    />
                    <p className="text-xs text-muted-foreground">Range: 300-850</p>
                    {errors.creditScoreMax && <p className="text-sm text-red-500">{errors.creditScoreMax}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearlyIncome">Annual Income</Label>
                  <Input
                    id="yearlyIncome"
                    type="number"
                    min="0"
                    value={formValues.yearlyIncome?.toString() || ""}
                    onChange={(e) => handleChange("yearlyIncome", e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">Annual gross income in USD</p>
                  {errors.yearlyIncome && <p className="text-sm text-red-500">{errors.yearlyIncome}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Pet Information Section */}
            <Card>
              <CardHeader>
                <CardTitle>Pet Information</CardTitle>
                <CardDescription>Details about pets if applicable</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasPets"
                    checked={formValues.hasPets || false}
                    onCheckedChange={(checked) => handleChange("hasPets", checked as boolean)}
                  />
                  <Label htmlFor="hasPets">Has Pets</Label>
                </div>

                {formValues.hasPets && (
                  <div className="space-y-2">
                    <Label htmlFor="petDetails">Pet Details</Label>
                    <Textarea
                      id="petDetails"
                      value={formValues.petDetails || ""}
                      onChange={(e) => handleChange("petDetails", e.target.value || undefined)}
                      placeholder="Describe pets (type, breed, size, etc.)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include type of pets, breeds, sizes, and any relevant information
                    </p>
                    {errors.petDetails && <p className="text-sm text-red-500">{errors.petDetails}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

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
