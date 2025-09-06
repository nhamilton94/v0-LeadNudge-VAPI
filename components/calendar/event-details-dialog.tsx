"use client"

import { format } from "date-fns"
import { CalendarIcon, Clock, MapPin, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface EventDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: {
    id: number
    title: string
    type: string
    date: Date
    startTime: string
    endTime: string
    status: string
    attendees?: string[]
    location?: string
    description?: string
  } | null
  onEdit?: (eventId: number) => void
  onDelete?: (eventId: number) => void
}

export function EventDetailsDialog({ open, onOpenChange, event, onEdit, onDelete }: EventDetailsDialogProps) {
  if (!event) return null

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">{event.title}</DialogTitle>
            <Badge
              variant="outline"
              className={event.type === "TOUR" ? "bg-primary/10 text-primary" : "bg-blue-100 text-blue-700"}
            >
              {event.type}
            </Badge>
          </div>
          <DialogDescription>Event details and information</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{format(event.date, "EEEE, MMMM d, yyyy")}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium mb-1">Attendees</div>
                <ul className="space-y-1">
                  {event.attendees.map((attendee, index) => (
                    <li key={index} className="text-sm">
                      {attendee}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {event.description && (
            <>
              <Separator />
              <div>
                <div className="font-medium mb-1">Description</div>
                <p className="text-sm text-muted-foreground">{event.description}</p>
              </div>
            </>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {event.status}
            </Badge>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={() => {
              if (onDelete) onDelete(event.id)
              onOpenChange(false)
            }}
          >
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (onEdit) onEdit(event.id)
                onOpenChange(false)
              }}
            >
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
