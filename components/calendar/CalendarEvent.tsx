import { cn } from "@/lib/utils"

interface CalendarEventProps {
  event: {
    id: number
    title: string
    type: string
    date: Date
    startTime: string
    endTime: string
    status: string
  }
  view: "month" | "week" | "day"
  isOverlapping?: boolean
}

export function CalendarEvent({ event, view, isOverlapping }: CalendarEventProps) {
  const startHour = Number.parseInt(event.startTime.split(":")[0])
  const startMinute = Number.parseInt(event.startTime.split(":")[1])
  const endHour = Number.parseInt(event.endTime.split(":")[0])
  const endMinute = Number.parseInt(event.endTime.split(":")[1])

  const getEventStyles = () => {
    if (view === "month") {
      return "px-1 py-0.5 text-xs truncate"
    }

    // Calculate position and height for week/day view
    return cn("absolute left-0 right-0 px-2 overflow-hidden", isOverlapping ? "w-[45%]" : "w-[95%]", {
      "left-[50%]": isOverlapping,
    })
  }

  // Calculate exact position accounting for borders
  const calculatePosition = () => {
    if (view === "month") return undefined

    const hourHeight = 48 // 48px per hour
    const topPosition = startHour * hourHeight + (startMinute / 60) * hourHeight
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60
    const height = duration * hourHeight

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
      // Offset by -1px to account for the border and ensure perfect alignment
      marginTop: "-1px",
    }
  }

  return (
    <div
      className={cn(
        "rounded-sm text-sm",
        getEventStyles(),
        event.type === "TOUR" ? "bg-primary/20 text-primary" : "bg-blue-100 text-blue-700",
      )}
      style={calculatePosition()}
    >
      {view === "month" ? (
        <div className="truncate">{event.title}</div>
      ) : (
        <>
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-xs">
            {event.startTime} - {event.endTime}
          </div>
        </>
      )}
    </div>
  )
}
