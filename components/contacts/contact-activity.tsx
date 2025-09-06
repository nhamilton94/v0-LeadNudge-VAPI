import { format } from "date-fns"
import { CalendarCheck, FileText, Mail, MessageSquare, Phone, Home, User, type LucideIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

interface Activity {
  id: number
  type: "email" | "call" | "meeting" | "note" | "document" | "viewing" | "status"
  title: string
  description: string
  timestamp: Date
  user: {
    name: string
    image: string
  }
  metadata?: {
    duration?: string
    status?: string
    documentName?: string
    property?: string
  }
}

const activities: Activity[] = [
  {
    id: 1,
    type: "viewing",
    title: "Property Viewing",
    description: "Completed property viewing at 123 Main St",
    timestamp: new Date("2024-02-17T14:00:00"),
    user: {
      name: "Alex Thompson",
      image: "/placeholder.svg",
    },
    metadata: {
      duration: "45 minutes",
      property: "123 Main St, Unit 4B",
    },
  },
  {
    id: 2,
    type: "email",
    title: "Follow-up Email Sent",
    description: "Sent viewing feedback and next steps",
    timestamp: new Date("2024-02-17T15:30:00"),
    user: {
      name: "Sarah Johnson",
      image: "/placeholder.svg",
    },
  },
  {
    id: 3,
    type: "call",
    title: "Phone Call",
    description: "Discussed lease terms and pricing",
    timestamp: new Date("2024-02-16T11:00:00"),
    user: {
      name: "Mike Davis",
      image: "/placeholder.svg",
    },
    metadata: {
      duration: "15 minutes",
    },
  },
  {
    id: 4,
    type: "document",
    title: "Document Shared",
    description: "Sent lease agreement for review",
    timestamp: new Date("2024-02-15T16:45:00"),
    user: {
      name: "Sarah Johnson",
      image: "/placeholder.svg",
    },
    metadata: {
      documentName: "Lease_Agreement_123Main_v1.pdf",
    },
  },
  {
    id: 5,
    type: "note",
    title: "Added Note",
    description: "Client prefers units with outdoor space and modern appliances. Budget range $2,000-2,500.",
    timestamp: new Date("2024-02-15T10:15:00"),
    user: {
      name: "Alex Thompson",
      image: "/placeholder.svg",
    },
  },
  {
    id: 6,
    type: "status",
    title: "Status Updated",
    description: "Lead status changed from 'Prospecting' to 'Viewing Scheduled'",
    timestamp: new Date("2024-02-14T09:30:00"),
    user: {
      name: "Sarah Johnson",
      image: "/placeholder.svg",
    },
    metadata: {
      status: "Viewing Scheduled",
    },
  },
]

const activityIcons: Record<Activity["type"], LucideIcon> = {
  email: Mail,
  call: Phone,
  meeting: CalendarCheck,
  note: MessageSquare,
  document: FileText,
  viewing: Home,
  status: User,
}

export function ContactActivity() {
  return (
    <div className="space-y-8">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.type]

        return (
          <div key={activity.id} className="flex gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{activity.title}</span>
                  <HoverCard>
                    <HoverCardTrigger>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.user.image} />
                        <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                      </Avatar>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-60">
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarImage src={activity.user.image} />
                          <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{activity.user.name}</span>
                          <span className="text-sm text-muted-foreground">Agent</span>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(activity.timestamp, "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{activity.description}</p>
              {activity.metadata && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {activity.metadata.duration && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      Duration: {activity.metadata.duration}
                    </span>
                  )}
                  {activity.metadata.status && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs text-green-700 ring-1 ring-inset ring-green-700/10">
                      {activity.metadata.status}
                    </span>
                  )}
                  {activity.metadata.documentName && (
                    <Button variant="link" className="h-auto p-0 text-xs">
                      View: {activity.metadata.documentName}
                    </Button>
                  )}
                  {activity.metadata.property && (
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700 ring-1 ring-inset ring-purple-700/10">
                      {activity.metadata.property}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
