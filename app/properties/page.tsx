"use client"

import { useAuth } from "@/components/auth/supabase-auth-provider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, Search, SlidersHorizontal, Trash2, Pencil, Home, DollarSign, Bed, Bath } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PropertyList } from "@/components/properties/property-list"
import { PropertyDetails } from "@/components/properties/property-details"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/utils/supabase/client"
import { Property } from "@/types/property"

type ViewMode = "list" | "grid"
type StatusFilter = "all" | "active" | "pending" | "sold" | "off_market"

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  async function fetchProperties() {
    try {
      if (!user?.id) return

      // First, get the property IDs assigned to the current user
      const { data: assignments, error: assignmentsError } = await supabase
        .from("property_assignments")
        .select("property_id")
        .eq("user_id", user.id)

      if (assignmentsError) {
        console.error("Error fetching property assignments:", assignmentsError)
        return
      }

      // If no assignments, show empty state
      if (!assignments || assignments.length === 0) {
        setProperties([])
        setSelectedProperty(null)
        return
      }

      // Extract property IDs from assignments
      const propertyIds = assignments.map((a) => a.property_id)

      // Fetch only the assigned properties
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("id", propertyIds)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching properties:", error)
      } else {
        setProperties(data || [])
        if (data && data.length > 0) {
          setSelectedProperty(data[0])
        } else {
          setSelectedProperty(null)
        }
      }
    } catch (error) {
      console.error("Exception:", error)
    }
  }

  async function deleteProperty(propertyId: string) {
    if (!propertyId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("properties").delete().eq("id", propertyId)

      if (error) {
        console.error("Error deleting property:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete property. Please try again.",
        })
        return false
      }

      const updatedProperties = properties.filter((property) => property.id !== propertyId)
      setProperties(updatedProperties)

      if (updatedProperties.length > 0) {
        setSelectedProperty(updatedProperties[0])
      } else {
        setSelectedProperty(null)
      }

      toast({
        title: "Property deleted",
        description: "The property has been successfully deleted.",
      })

      return true
    } catch (error) {
      console.error("Exception deleting property:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
      return false
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProperties()
    }
  }, [user])

  const filteredProperties = properties.filter((property) => {
    if (statusFilter !== "all") {
      if (property.status?.toLowerCase() !== statusFilter) return false
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        property.address?.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.state?.toLowerCase().includes(query)
      )
    }

    return true
  })

  const formatPrice = (price: number | null) => {
    return price
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(price)
      : "N/A"
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="flex flex-col gap-4 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Properties</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("active")}>
                <Home className="mr-2 h-4 w-4 text-green-500" />
                Active ({properties.filter((p) => p.status === "active").length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("pending")}>
                <Home className="mr-2 h-4 w-4 text-yellow-500" />
                Pending ({properties.filter((p) => p.status === "pending").length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("sold")}>
                <Home className="mr-2 h-4 w-4 text-blue-500" />
                Sold ({properties.filter((p) => p.status === "sold").length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusFilter("off_market")}>
                <Home className="mr-2 h-4 w-4 text-gray-500" />
                Off Market ({properties.filter((p) => p.status === "off_market").length})
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/properties/new")}>Add Property</Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
          >
            {viewMode === "list" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 overflow-auto border-r">
          <PropertyList
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelect={setSelectedProperty}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6 p-6">
            {selectedProperty ? (
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold">{selectedProperty.address}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    selectedProperty.status === "active"
                      ? "bg-green-50 text-green-700 ring-green-600/20"
                      : selectedProperty.status === "pending"
                        ? "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                        : selectedProperty.status === "sold"
                          ? "bg-blue-50 text-blue-700 ring-blue-600/20"
                          : "bg-gray-50 text-gray-700 ring-gray-600/20"
                  }`}
                >
                  {selectedProperty.status?.charAt(0).toUpperCase() + selectedProperty.status?.slice(1)}
                </span>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold">
                {properties.length > 0 ? "No property selected" : "No properties found"}
              </h1>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/properties/${selectedProperty?.id}/edit`)}
                disabled={!selectedProperty}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Property
              </Button>

              <Button
                variant="destructive"
                disabled={!selectedProperty || isDeleting}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Property"}
              </Button>

              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the property
                      {selectedProperty ? ` at "${selectedProperty.address}"` : ""} and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => selectedProperty && deleteProperty(selectedProperty.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {selectedProperty ? (
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">Property Information</TabsTrigger>
                  <TabsTrigger value="details">Details & Features</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="mt-6">
                  <PropertyDetails property={selectedProperty} />
                </TabsContent>
                <TabsContent value="details" className="mt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <h3 className="font-medium mb-2">Property Features</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4" />
                          <span>{selectedProperty.bedrooms || 0} Bedrooms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bath className="h-4 w-4" />
                          <span>{selectedProperty.bathrooms || 0} Bathrooms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4" />
                          <span>{selectedProperty.square_feet?.toLocaleString() || 0} sq ft</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatPrice(selectedProperty.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <h3 className="font-medium mb-2">Description</h3>
                      <p className="text-sm text-muted-foreground">
                        {"No description available for this property."}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center p-8">
                {properties.length > 0 ? (
                  <p className="text-muted-foreground">Select a property to view details</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">You don't have any properties yet.</p>
                    <Button onClick={() => router.push("/properties/new")}>Add Your First Property</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
