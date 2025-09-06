"use client"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface ColorSelectorProps {
  value: string
  onChange: (value: string) => void
}

const colorOptions = [
  { value: "#8884d8", label: "Purple" },
  { value: "#82ca9d", label: "Green" },
  { value: "#ffc658", label: "Yellow" },
  { value: "#ff8042", label: "Orange" },
  { value: "#0088fe", label: "Blue" },
  { value: "#ff0000", label: "Red" },
  { value: "#00C49F", label: "Teal" },
  { value: "#FFBB28", label: "Amber" },
]

export function ColorSelector({ value, onChange }: ColorSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colorOptions.map((color) => (
        <button
          key={color.value}
          type="button"
          className={cn(
            "h-8 w-8 rounded-full border-2 flex items-center justify-center",
            value === color.value ? "border-gray-900 dark:border-gray-50" : "border-transparent",
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.value)}
          title={color.label}
        >
          {value === color.value && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  )
}
