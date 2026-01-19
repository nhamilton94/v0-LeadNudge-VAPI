import { Card, CardContent } from "@/components/ui/card"
import { Property } from "@/types/property"

interface PropertyDetailsProps {
  property: Property
}

export function PropertyDetails({ property }: PropertyDetailsProps) {
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

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Address</h3>
              <p className="mt-1">{property.address}</p>
              <p className="text-sm text-muted-foreground">
                {property.city}, {property.state} {property.zip}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Property Type</h3>
              <p className="mt-1">{formatPropertyType(property.property_type)}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
              <p className="mt-1 capitalize">{property.status?.replace(/_/g, " ") || "Active"}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Last Updated</h3>
              <p className="mt-1">{new Date(property.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Price</h3>
              <p className="mt-1 text-lg font-semibold">{formatPrice(property.price)}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Bedrooms / Bathrooms</h3>
              <p className="mt-1">
                {property.bedrooms ?? 0} bed / {property.bathrooms ?? 0} bath
              </p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Square Feet</h3>
              <p className="mt-1">{property.square_feet?.toLocaleString() || "N/A"} sq ft</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground">Listed On</h3>
              <p className="mt-1">{new Date(property.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
