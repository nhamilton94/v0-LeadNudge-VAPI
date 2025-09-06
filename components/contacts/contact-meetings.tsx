import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type MeetingType = "Tour" | "Follow-up Call"

interface Meeting {
  id: number
  date: string
  type: MeetingType
  attendees: string
}

const meetings: Meeting[] = [
  {
    id: 1,
    date: "Mar 15, 2024",
    type: "Tour",
    attendees: "Sarah, John, Mike",
  },
  {
    id: 2,
    date: "Mar 18, 2024",
    type: "Follow-up Call",
    attendees: "Sarah, Alex",
  },
]

export function ContactMeetings() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Attendees</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {meetings.map((meeting) => (
          <TableRow key={meeting.id}>
            <TableCell>{meeting.date}</TableCell>
            <TableCell>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                  meeting.type === "Tour"
                    ? "bg-primary/10 text-primary"
                    : "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10",
                )}
              >
                {meeting.type}
              </span>
            </TableCell>
            <TableCell>{meeting.attendees}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
