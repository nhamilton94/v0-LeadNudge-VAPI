"use client"

import { useState } from "react"
import { format, addMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecurrenceRule {
  type: "none" | "daily" | "weekly" | "monthly" | "custom"
  interval?: number
  endDate?: Date
  occurrences?: number
}

interface RecurrenceSelectorProps {
  value: RecurrenceRule
  onChange: (value: RecurrenceRule) => void
  startDate: Date
}

export function RecurrenceSelector({ value, onChange, startDate }: RecurrenceSelectorProps) {
  const [endType, setEndType] = useState<"never" | "on" | "after">(
    value.endDate ? "on" : value.occurrences ? "after" : "never",
  )

  const handleTypeChange = (type: RecurrenceRule["type"]) => {
    const newValue: RecurrenceRule = { type }

    if (type !== "none") {
      newValue.interval = 1
    }

    onChange(newValue)
  }

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value, interval })
  }

  const handleEndTypeChange = (type: "never" | "on" | "after") => {
    setEndType(type)

    const newValue = { ...value }

    if (type === "never") {
      delete newValue.endDate
      delete newValue.occurrences
    } else if (type === "on") {
      newValue.endDate = addMonths(startDate, 1)
      delete newValue.occurrences
    } else if (type === "after") {
      newValue.occurrences = 10
      delete newValue.endDate
    }

    onChange(newValue)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      onChange({ ...value, endDate: date })
    }
  }

  const handleOccurrencesChange = (occurrences: number) => {
    onChange({ ...value, occurrences })
  }

  const getRecurrenceSummary = () => {
    if (value.type === "none") return "Does not repeat"

    let summary = ""

    switch (value.type) {
      case "daily":
        summary = value.interval === 1 ? "Daily" : `Every ${value.interval} days`
        break
      case "weekly":
        summary = value.interval === 1 ? "Weekly" : `Every ${value.interval} weeks`
        break
      case "monthly":
        summary = value.interval === 1 ? "Monthly" : `Every ${value.interval} months`
        break
      case "custom":
        summary = "Custom recurrence"
        break
    }

    if (value.endDate) {
      summary += ` until ${format(value.endDate, "MMM d, yyyy")}`
    } else if (value.occurrences) {
      summary += `, ${value.occurrences} times`
    }

    return summary
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={value.type} onValueChange={(v) => handleTypeChange(v as RecurrenceRule["type"])}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none">Does not repeat</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="daily" id="daily" />
          <Label htmlFor="daily">Daily</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="weekly" id="weekly" />
          <Label htmlFor="weekly">Weekly</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="monthly" id="monthly" />
          <Label htmlFor="monthly">Monthly</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="custom" id="custom" />
          <Label htmlFor="custom">Custom</Label>
        </div>
      </RadioGroup>

      {value.type !== "none" && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Repeat every</span>
            <Input
              type="number"
              min="1"
              max="99"
              value={value.interval || 1}
              onChange={(e) => handleIntervalChange(Number.parseInt(e.target.value) || 1)}
              className="w-16"
            />
            <span className="text-sm">
              {value.type === "daily" && "days"}
              {value.type === "weekly" && "weeks"}
              {value.type === "monthly" && "months"}
              {value.type === "custom" && "custom period"}
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium">Ends</span>
            <RadioGroup value={endType} onValueChange={(v) => handleEndTypeChange(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never">Never</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on" id="on" />
                <Label htmlFor="on">On</Label>
                {endType === "on" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[200px] pl-3 text-left font-normal",
                          !value.endDate && "text-muted-foreground",
                        )}
                      >
                        {value.endDate ? format(value.endDate, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={value.endDate}
                        onSelect={handleEndDateChange}
                        initialFocus
                        disabled={(date) => date < startDate}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="after" />
                <Label htmlFor="after">After</Label>
                {endType === "after" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={value.occurrences || 10}
                      onChange={(e) => handleOccurrencesChange(Number.parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                    <span className="text-sm">occurrences</span>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="rounded-md bg-muted p-3">
            <p className="text-sm">Summary: {getRecurrenceSummary()}</p>
          </div>
        </div>
      )}
    </div>
  )
}
