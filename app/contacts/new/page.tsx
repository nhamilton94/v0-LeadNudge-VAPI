"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { ArrowLeft } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvatarUpload } from "@/components/contacts/avatar-upload"
import { useToast } from "@/components/ui/use-toast"

// Make sure we're importing the named export
import { supabase } from "@/utils/supabase/client"
import { combineNames } from "@/utils/contact-name"

// Match database values exactly (lowercase)
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

// Match database values exactly (lowercase with spaces)
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

const formSchema = z.object({
  firstName: z.string().min(1, {
    message: "First name is required.",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required.",
  }),
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  linkedin: z.string().url({
    message: "Please enter a valid LinkedIn URL.",
  }),
  industry: z.string().min(2, {
    message: "Industry must be at least 2 characters.",
  }),
  leadSource: z.enum(leadSources),
  leadStatus: z.enum(leadStatuses),
  // Rental preference fields
  moveInDate: z.string().optional(),
  leaseLengthPreference: z.number().optional(),
  bedroomsSought: z.number().min(0).optional(),
  bathroomsSought: z.number().min(0).optional(),
  numOccupants: z.number().min(1).optional(),
  // Financial fields
  creditScoreMin: z.number().min(300).max(850).optional(),
  creditScoreMax: z.number().min(300).max(850).optional(),
  yearlyIncome: z.number().min(0).optional(),
  // Pet fields
  hasPets: z.boolean().optional(),
  petDetails: z.string().optional(),
}).refine((data) => {
  // Validate credit score range
  if (data.creditScoreMin && data.creditScoreMax) {
    return data.creditScoreMin <= data.creditScoreMax
  }
  return true
}, {
  message: "Credit score minimum must be less than or equal to maximum",
  path: ["creditScoreMax"]
}).refine((data) => {
  // Validate pet details required when has pets
  if (data.hasPets && !data.petDetails?.trim()) {
    return false
  }
  return true
}, {
  message: "Pet details are required when pets are present",
  path: ["petDetails"]
})

// Default values for the form
const defaultContactValues = {
  firstName: "",
  lastName: "",
  title: "",
  email: "",
  phone: "",
  linkedin: "https://linkedin.com/in/",
  industry: "",
  leadSource: "referral" as const, // lowercase
  leadStatus: "new lead" as const, // lowercase with space
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

export default function NewContactPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultContactValues,
  })

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // Here you would typically upload the file to your storage service
      // For example, using Supabase Storage:
      // const { data, error } = await supabase.storage
      //   .from('avatars')
      //   .upload(`${Date.now()}-${file.name}`, file)

      // For now, we'll simulate an upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Return the image URL
      console.log("Image uploaded successfully")
      return "/placeholder.svg" // Replace with actual image URL
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add a contact.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Insert the new contact into the database
      console.log("user: " + user.id)
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          first_name: values.firstName,
          last_name: values.lastName,
          name: combineNames(values.firstName, values.lastName),
          title: values.title,
          email: values.email,
          phone: values.phone,
          linkedin: values.linkedin,
          industry: values.industry,
          lead_source: values.leadSource,
          lead_status: values.leadStatus,
          created_by: user.id,
          assigned_to: user.id, // Set the assigned_to field to the current user's ID
          // Rental preferences
          move_in_date: values.moveInDate || null,
          lease_length_preference: values.leaseLengthPreference || null,
          bedrooms_sought: values.bedroomsSought || null,
          bathrooms_sought: values.bathroomsSought || null,
          num_occupants: values.numOccupants || null,
          // Financial information
          credit_score_min: values.creditScoreMin || null,
          credit_score_max: values.creditScoreMax || null,
          yearly_income: values.yearlyIncome || null,
          // Pet information
          has_pets: values.hasPets || false,
          pet_details: values.petDetails || null
        })
        .select()

      if (error) {
        console.error("Error creating contact:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create contact. Please try again.",
        })
        return
      }

      toast({
        title: "Success",
        description: "Contact created successfully.",
      })

      // Redirect to the contacts page
      router.push("/contacts")
    } catch (error) {
      console.error("Error creating contact:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="border-b bg-background p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Add New Contact</h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex justify-center">
                <AvatarUpload
                  currentImage="/placeholder.svg"
                  onImageChange={handleImageUpload}
                  isUploading={isUploading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter LinkedIn profile URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Full URL to the LinkedIn profile (e.g., https://linkedin.com/in/username)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter industry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lead source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {/* Display with title case for better UI, but keep value as lowercase */}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="leadStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a lead status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {/* Display with title case for better UI, but keep value as lowercase */}
                            {status
                              .split(" ")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rental Preferences Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Rental Preferences</CardTitle>
                  <CardDescription>Information about rental requirements and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="moveInDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Move-in Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="leaseLengthPreference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lease Length Preference</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "0" ? 0 : Number(value))} 
                            value={field.value?.toString() || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lease length" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {leaseLengthOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value.toString()}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="bedroomsSought"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bedrooms Sought</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bathroomsSought"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bathrooms Sought</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.5"
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numOccupants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Occupants</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="1" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                    <FormField
                      control={form.control}
                      name="creditScoreMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Score (Min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="300" 
                              max="850" 
                              placeholder="300" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Range: 300-850</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="creditScoreMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Score (Max)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="300" 
                              max="850" 
                              placeholder="850" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>Range: 300-850</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="yearlyIncome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Income</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>Annual gross income in USD</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Pet Information Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Pet Information</CardTitle>
                  <CardDescription>Details about pets if applicable</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hasPets"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Has Pets</FormLabel>
                          <FormDescription>
                            Check this box if the contact has pets
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("hasPets") && (
                    <FormField
                      control={form.control}
                      name="petDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pet Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe pets (type, breed, size, etc.)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Include type of pets, breeds, sizes, and any relevant information
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? "Saving..." : "Save Contact"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}
