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
import { AvatarUpload } from "@/components/contacts/avatar-upload"
import { useToast } from "@/components/ui/use-toast"

// Make sure we're importing the named export
import { supabase } from "@/utils/supabase/client"

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

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
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
  leadSource: z.enum(leadSources, {
    required_error: "Please select a lead source.",
  }),
  leadStatus: z.enum(leadStatuses, {
    required_error: "Please select a lead status.",
  }),
})

// Default values for the form
const defaultContactValues = {
  name: "",
  title: "",
  email: "",
  phone: "",
  linkedin: "https://linkedin.com/in/",
  industry: "",
  leadSource: "referral" as const, // lowercase
  leadStatus: "new lead" as const, // lowercase with space
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
          name: values.name,
          title: values.title,
          email: values.email,
          phone: values.phone,
          linkedin: values.linkedin,
          industry: values.industry,
          lead_source: values.leadSource,
          lead_status: values.leadStatus,
          created_by: user.id,
          assigned_to: user.id, // Set the assigned_to field to the current user's ID
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

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
