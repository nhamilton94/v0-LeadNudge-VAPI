"use client"

import type React from "react"

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
  onEventClick: (event: CalendarEventProps["event"]) => void
}

export function CalendarEvent({ event, view, isOverlapping, onEventClick }: CalendarEventProps) {
  // Add safety checks for time values
  const getTimeValues = () => {
    if (!event.startTime || !event.endTime) {
      return {
        startHour: 0,
        startMinute: 0,
        endHour: 1,
        endMinute: 0,
      }
    }

    const [startHour, startMinute] = event.startTime.split(":").map((num) => Number.parseInt(num))
    const [endHour, endMinute] = event.endTime.split(":").map((num) => Number.parseInt(num))

    return {
      startHour: startHour || 0,
      startMinute: startMinute || 0,
      endHour: endHour || startHour + 1,
      endMinute: endMinute || 0,
    }
  }

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

    const { startHour, startMinute, endHour, endMinute } = getTimeValues()
    const hourHeight = 48 // 48px per hour
    const topPosition = startHour * hourHeight + (startMinute / 60) * hourHeight
    const duration = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60
    const height = duration * hourHeight

    return {
      top: `${topPosition}px`,
      height: `${height}px`,
      marginTop: "-1px",
    }
  }

  const handleEventClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Stop propagation to parent elements
    onEventClick(event)
  }

  return (
    <div
      className={cn(
        "rounded-sm text-sm cursor-pointer hover:opacity-80 transition-opacity",
        getEventStyles(),
        event.type === "TOUR" ? "bg-primary/20 text-primary" : "bg-blue-100 text-blue-700",
      )}
      style={calculatePosition()}
      onClick={handleEventClick}
    >
      {view === "month" ? (
        <div className="truncate">{event.title}</div>
      ) : (
        <>
          <div className="font-medium truncate">{event.title}</div>
          <div className="text-xs">
            {event.startTime || "00:00"} - {event.endTime || "00:00"}
          </div>
        </>
      )}
    </div>
  )
}
