"use client"

import { useState } from "react"
import { Search, Plus, X, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface Property {
  id: string
  address: string
}

interface PropertySelectorProps {
  value: Property[]
  onChange: (value: Property[]) => void
}

// Mock data for properties
const mockProperties = [
  { id: "1", address: "123 Main St, San Francisco, CA 94105", image: "/placeholder.svg?height=100&width=200" },
  { id: "2", address: "456 Market St, San Francisco, CA 94103", image: "/placeholder.svg?height=100&width=200" },
  { id: "3", address: "789 Mission St, San Francisco, CA 94103", image: "/placeholder.svg?height=100&width=200" },
  { id: "4", address: "101 California St, San Francisco, CA 94111", image: "/placeholder.svg?height=100&width=200" },
  { id: "5", address: "1 Lombard St, San Francisco, CA 94111", image: "/placeholder.svg?height=100&width=200" },
]

export function PropertySelector({ value, onChange }: PropertySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProperties = mockProperties.filter(
    (property) =>
      !value.some((selected) => selected.id === property.id) &&
      property.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAddProperty = (property: (typeof mockProperties)[0]) => {
    onChange([
      ...value,
      {
        id: property.id,
        address: property.address,
      },
    ])
    setSearchQuery("")
  }

  const handleRemoveProperty = (id: string) => {
    onChange(value.filter((property) => property.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {searchQuery && filteredProperties.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <ul className="max-h-[200px] overflow-auto">
              {filteredProperties.map((property) => (
                <li key={property.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{property.address}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleAddProperty(property)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {searchQuery && filteredProperties.length === 0 && (
        <p className="text-sm text-muted-foreground">No properties found</p>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Properties</h4>
          <ul className="space-y-2">
            {value.map((property) => (
              <li key={property.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{property.address}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleRemoveProperty(property.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
