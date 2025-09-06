"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, MapPin } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AttendeeSelector } from "@/components/calendar/attendee-selector"
import { PropertySelector } from "@/components/calendar/property-selector"
import { ReminderSelector } from "@/components/calendar/reminder-selector"
import { RecurrenceSelector } from "@/components/calendar/recurrence-selector"
import { ColorSelector } from "@/components/calendar/color-selector"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  eventType: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  allDay: z.boolean().default(false),
  locationType: z.enum(["physical", "virtual", "phone"]),
  location: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  attendees: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email().optional(),
        role: z.enum(["organizer", "required", "optional"]).default("required"),
      }),
    )
    .optional(),
  properties: z
    .array(
      z.object({
        id: z.string(),
        address: z.string(),
      }),
    )
    .optional(),
  sendInvitations: z.boolean().default(true),
  recurrence: z
    .object({
      type: z.enum(["none", "daily", "weekly", "monthly", "custom"]).default("none"),
      interval: z.number().optional(),
      endDate: z.date().optional(),
      occurrences: z.number().optional(),
    })
    .optional(),
  reminders: z
    .array(
      z.object({
        time: z.string(),
        type: z.enum(["email", "notification", "sms"]),
      }),
    )
    .optional(),
})

type EventFormValues = z.infer<typeof eventSchema>

const eventTypes = [
  { id: "tour", name: "Property Tour" },
  { id: "meeting", name: "Meeting" },
  { id: "call", name: "Call" },
  { id: "showing", name: "Property Showing" },
  { id: "appointment", name: "Appointment" },
]

interface NewEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: Date
  onEventCreated?: (event: EventFormValues) => void
}

export function NewEventDialog({ open, onOpenChange, defaultDate = new Date(), onEventCreated }: NewEventDialogProps) {
  const [step, setStep] = useState<"details" | "attendees" | "advanced">("details")

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      eventType: "meeting",
      startDate: defaultDate,
      endDate: new Date(defaultDate.getTime() + 60 * 60 * 1000), // 1 hour later
      allDay: false,
      locationType: "physical",
      location: "",
      description: "",
      color: "#8884d8", // Default color
      attendees: [],
      properties: [],
      sendInvitations: true,
      recurrence: {
        type: "none",
      },
      reminders: [
        {
          time: "15min",
          type: "notification",
        },
      ],
    },
  })

  function onSubmit(data: EventFormValues) {
    console.log("Event created:", data)
    if (onEventCreated) {
      onEventCreated(data)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>Add a new event to your calendar. Fill in the details below.</DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(value) => setStep(value as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="attendees">Attendees & Properties</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="details" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date & Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "PPP p") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            <div className="border-t p-3">
                              <Input
                                type="time"
                                value={format(field.value, "HH:mm")}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(":")
                                  const newDate = new Date(field.value)
                                  newDate.setHours(Number.parseInt(hours, 10))
                                  newDate.setMinutes(Number.parseInt(minutes, 10))
                                  field.onChange(newDate)
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date & Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              >
                                {field.value ? format(field.value, "PPP p") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            <div className="border-t p-3">
                              <Input
                                type="time"
                                value={format(field.value, "HH:mm")}
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(":")
                                  const newDate = new Date(field.value)
                                  newDate.setHours(Number.parseInt(hours, 10))
                                  newDate.setMinutes(Number.parseInt(minutes, 10))
                                  field.onChange(newDate)
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="allDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>All Day Event</FormLabel>
                        <FormDescription>Event will take the entire day</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="physical">Physical Address</SelectItem>
                          <SelectItem value="virtual">Virtual Meeting</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("locationType") === "physical" && "Address"}
                        {form.watch("locationType") === "virtual" && "Meeting Link"}
                        {form.watch("locationType") === "phone" && "Phone Number"}
                      </FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input
                            placeholder={
                              form.watch("locationType") === "physical"
                                ? "Enter address"
                                : form.watch("locationType") === "virtual"
                                  ? "Enter meeting link"
                                  : "Enter phone number"
                            }
                            {...field}
                          />
                          {form.watch("locationType") === "physical" && (
                            <Button type="button" variant="outline" size="icon" className="ml-2">
                              <MapPin className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter event description" className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Color</FormLabel>
                      <FormControl>
                        <ColorSelector value={field.value || "#8884d8"} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="button" onClick={() => setStep("attendees")}>
                    Next: Attendees & Properties
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="attendees" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="attendees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendees</FormLabel>
                      <FormControl>
                        <AttendeeSelector value={field.value || []} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>Add contacts who will attend this event</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sendInvitations"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Send Invitations</FormLabel>
                        <FormDescription>Send email invitations to all attendees</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="properties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Properties</FormLabel>
                      <FormControl>
                        <PropertySelector value={field.value || []} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>Link properties to this event</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep("details")}>
                    Back: Event Details
                  </Button>
                  <Button type="button" onClick={() => setStep("advanced")}>
                    Next: Advanced Options
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <FormControl>
                        <RecurrenceSelector
                          value={field.value || { type: "none" }}
                          onChange={field.onChange}
                          startDate={form.watch("startDate")}
                        />
                      </FormControl>
                      <FormDescription>Set up a recurring event</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminders"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminders</FormLabel>
                      <FormControl>
                        <ReminderSelector value={field.value || []} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>Set reminders for this event</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep("attendees")}>
                    Back: Attendees & Properties
                  </Button>
                  <div className="space-x-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Event</Button>
                  </div>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
