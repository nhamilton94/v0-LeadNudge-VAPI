"use client"

import { useAuth } from "@/components/auth/supabase-auth-provider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home, DollarSign, Bed, Bath, Maximize2, Calendar, User, Pencil, Trash2, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/utils/supabase/client"

interface Property {
  id: string
  address: string
  city: string
  state: string
  zip: string
  property_type: string
  status: string
  price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  organization_id: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface PropertyPageProps {
  params: { propertyId: string }
}

export default function PropertyPage({ params }: PropertyPageProps) {
  const { propertyId } = params
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperty = async () => {
    if (!user?.id || !propertyId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Check if user has access to this property
      const { data: assignment, error: assignmentError } = await supabase
        .from('property_assignments')
        .select('property_id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .single()

      if (assignmentError || !assignment) {
        setError('Property not found or access denied')
        setIsLoading(false)
        return
      }

      // Fetch property details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          city,
          state,
          zip,
          property_type,
          status,
          price,
          bedrooms,
          bathrooms,
          square_feet,
          organization_id,
          created_by,
          created_at,
          updated_at
        `)
        .eq('id', propertyId)
        .single()

      if (propertyError) {
        console.error('Error fetching property:', propertyError)
        setError('Failed to load property details')
        setIsLoading(false)
        return
      }

      setProperty(propertyData)
    } catch (err) {
      console.error('Error:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchProperty()
    }
  }, [user, propertyId])

  const formatPrice = (price: number | null) => {
    return price
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(price)
      : "Price not set"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sold':
        return 'bg-blue-100 text-blue-800'
      case 'off_market':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Home className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
          <p className="text-gray-600 mb-4">
            {error || "The property you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button onClick={() => router.push('/properties')}>
            View All Properties
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{property.address}</h1>
            <p className="text-muted-foreground">{property.city}, {property.state} {property.zip}</p>
          </div>
          <Badge className={getStatusColor(property.status)}>
            {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={() => router.push(`/properties/${property.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(property.price)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bedrooms</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.bedrooms || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bathrooms</CardTitle>
            <Bath className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{property.bathrooms || 'N/A'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Square Feet</CardTitle>
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {property.square_feet ? property.square_feet.toLocaleString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Property Details</TabsTrigger>
          <TabsTrigger value="contacts">Associated Contacts</TabsTrigger>
          <TabsTrigger value="activity">Activity History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
                <CardDescription>Basic details about this property</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Property Type:</span>
                  <span className="text-sm">
                    {property.property_type?.charAt(0).toUpperCase() + property.property_type?.slice(1) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(property.status)}>
                    {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Created:</span>
                  <span className="text-sm">{formatDate(property.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Last Updated:</span>
                  <span className="text-sm">{formatDate(property.updated_at)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Address and location information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Full Address:</span>
                  <p className="text-sm mt-1">
                    {property.address}<br/>
                    {property.city}, {property.state} {property.zip}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Associated Contacts</CardTitle>
              <CardDescription>Contacts who have shown interest in this property</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No contacts associated with this property yet.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>Recent activity and updates for this property</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}