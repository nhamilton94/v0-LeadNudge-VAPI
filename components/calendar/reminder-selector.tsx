"use client"

import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Reminder {
  time: string
  type: "email" | "notification" | "sms"
}

interface ReminderSelectorProps {
  value: Reminder[]
  onChange: (value: Reminder[]) => void
}

const reminderTimes = [
  { value: "0min", label: "At time of event" },
  { value: "5min", label: "5 minutes before" },
  { value: "15min", label: "15 minutes before" },
  { value: "30min", label: "30 minutes before" },
  { value: "1hour", label: "1 hour before" },
  { value: "2hours", label: "2 hours before" },
  { value: "1day", label: "1 day before" },
  { value: "2days", label: "2 days before" },
]

const reminderTypes = [
  { value: "notification", label: "Notification" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
]

export function ReminderSelector({ value, onChange }: ReminderSelectorProps) {
  const handleAddReminder = () => {
    onChange([
      ...value,
      {
        time: "15min",
        type: "notification",
      },
    ])
  }

  const handleRemoveReminder = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleChangeReminderTime = (index: number, time: string) => {
    onChange(value.map((reminder, i) => (i === index ? { ...reminder, time } : reminder)))
  }

  const handleChangeReminderType = (index: number, type: Reminder["type"]) => {
    onChange(value.map((reminder, i) => (i === index ? { ...reminder, type } : reminder)))
  }

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((reminder, index) => (
            <li key={index} className="flex items-center gap-2">
              <Select value={reminder.time} onValueChange={(time) => handleChangeReminderTime(index, time)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderTimes.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={reminder.type}
                onValueChange={(type) => handleChangeReminderType(index, type as Reminder["type"])}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button size="sm" variant="ghost" onClick={() => handleRemoveReminder(index)}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" size="sm" className="w-full" onClick={handleAddReminder}>
        <Plus className="mr-2 h-4 w-4" />
        Add Reminder
      </Button>
    </div>
  )
}
