import { cn } from "@/lib/utils"

interface TimeGridProps {
  timeSlots: string[]
  currentHour: number
  currentMinute: number
}

export function TimeGrid({ timeSlots, currentHour, currentMinute }: TimeGridProps) {
  return (
    <div className="w-20 flex-shrink-0 border-r bg-background">
      {/* Header spacer to align with day headers */}
      <div className="sticky top-0 z-10 h-11 border-b bg-background" />
      <div className="relative">
        {timeSlots.map((time, i) => {
          const hour = Number.parseInt(time.split(":")[0])
          const isBusinessHour = hour >= 9 && hour <= 17
          const isCurrentHour = hour === currentHour

          return (
            <div
              key={time}
              className={cn("relative flex h-12 items-start border-t px-2 py-1", isBusinessHour && "bg-secondary/20")}
            >
              <span className="text-sm text-muted-foreground">{time}</span>
              {/* Current time indicator */}
              {isCurrentHour && (
                <div
                  className="absolute right-0 left-0 border-t-2 border-red-500"
                  style={{ top: `${(currentMinute / 60) * 100}%` }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
