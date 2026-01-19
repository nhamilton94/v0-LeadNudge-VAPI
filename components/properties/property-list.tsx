"use client"

import { cn } from "@/lib/utils"
import { Home, DollarSign } from "lucide-react"
import { Property } from "@/types/property"

interface PropertyListProps {
  properties: Property[]
  selectedProperty: Property | null
  onSelect: (property: Property) => void
}

export function PropertyList({ properties, selectedProperty, onSelect }: PropertyListProps) {
  const formatPrice = (price: number | null) => {
    if (!price) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatPropertyType = (type: string) => {
    if (!type) return "Residential"
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "sold":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="divide-y">
      {properties.map((property) => (
        <button
          key={property.id}
          className={cn(
            "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
            selectedProperty && selectedProperty.id === property.id && "bg-muted",
          )}
          onClick={() => onSelect(property)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{property.address}</span>
              <span className={cn("h-2 w-2 rounded-full", getStatusColor(property.status))} />
            </div>
            <span className="text-sm text-muted-foreground">
              {property.city}, {property.state}
            </span>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>{formatPrice(property.price)}</span>
              <span className="mx-1">•</span>
              <span>{formatPropertyType(property.property_type)}</span>
            </div>
          </div>
        </button>
      ))}
      {properties.length === 0 && <div className="p-8 text-center text-muted-foreground">No properties found</div>}
    </div>
  )
}
