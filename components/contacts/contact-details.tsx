import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ContactWithDetails } from "@/types/contact"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { supabase } from "@/utils/supabase/client"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

interface ContactDetailsProps {
  contact: ContactWithDetails
}

interface Property {
  address: string
  city: string
  state: string
  organization_id: string
  property_id: string
}

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return 'Not specified'
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Not specified'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })
}

const formatCreditScore = (min: number | null, max: number | null) => {
  if (min === null && max === null) return 'Not specified'
  if (min !== null && max !== null) return `${min} - ${max}`
  if (min !== null) return `${min}+`
  if (max !== null) return `Up to ${max}`
  return 'Not specified'
}

export function ContactDetails({ contact }: ContactDetailsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(contact.interested_property || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch user properties
  useEffect(() => {
    async function fetchProperties() {
      if (!user?.id) return
      
      setIsLoading(true)
      try {
        const { data, error } = await supabase.rpc('get_user_properties', {
          p_user_id: user.id
        })
        
        if (error) {
          console.error('Error fetching properties:', error)
        } else {
          setProperties(data || [])
        }
      } catch (error) {
        console.error('Exception fetching properties:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [user?.id])

  // Update contact's interested property
  async function updateInterestedProperty(propertyId: string | null) {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ interested_property: propertyId })
        .eq('id', contact.id)

      if (error) {
        console.error('Error updating interested property:', error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update interested property. Please try again.",
        })
      } else {
        toast({
          title: "Property updated",
          description: "Contact's interested property has been updated successfully.",
        })
      }
    } catch (error) {
      console.error('Exception updating interested property:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePropertyChange = (value: string) => {
    setSelectedPropertyId(value)
    const propertyId = value === 'none' ? null : value
    updateInterestedProperty(propertyId)
  }

  const getSelectedPropertyDisplay = () => {
    if (!selectedPropertyId || selectedPropertyId === 'none') return 'No property selected'
    const property = properties.find(p => p.property_id === selectedPropertyId)
    if (!property) return 'Unknown property'
    return `${property.address}, ${property.city}, ${property.state}`
  }
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Basic contact and professional details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-medium">{contact.title || 'No title'}</h3>
            <div className="mt-1 text-sm text-muted-foreground space-y-1">
              <p>Email: {contact.email || 'No email'}</p>
              <p>Phone: {contact.phone || 'No phone'}</p>
              <p>LinkedIn: {contact.linkedin || 'No LinkedIn'}</p>
              <p>Industry: {contact.industry || 'No industry'}</p>
              <p>Lead Source: {contact.lead_source || 'Unknown'}</p>
              {contact.lead_status && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Lead Status: </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {contact.lead_status.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rental Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Preferences</CardTitle>
          <CardDescription>Housing requirements and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Move-in Date</p>
              <p className="text-sm text-muted-foreground">{formatDate(contact.move_in_date)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Lease Length Preference</p>
              <p className="text-sm text-muted-foreground">
                {contact.lease_length_preference === 0 ? 'Month-to-month' : 
                 contact.lease_length_preference ? `${contact.lease_length_preference} months` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Bedrooms Sought</p>
              <p className="text-sm text-muted-foreground">{contact.bedrooms_sought ?? 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Bathrooms Sought</p>
              <p className="text-sm text-muted-foreground">{contact.bathrooms_sought ?? 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Number of Occupants</p>
              <p className="text-sm text-muted-foreground">{contact.num_occupants ?? 'Not specified'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>Credit and income details for qualification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Credit Score Range</p>
              <p className="text-sm text-muted-foreground">
                {formatCreditScore(contact.credit_score_min, contact.credit_score_max)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Annual Income</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(contact.yearly_income)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pet Information */}
      <Card>
        <CardHeader>
          <CardTitle>Pet Information</CardTitle>
          <CardDescription>Details about pets and pet policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium">Has Pets</p>
            <p className="text-sm text-muted-foreground">{contact.has_pets ? 'Yes' : 'No'}</p>
          </div>
          {contact.has_pets && contact.pet_details && (
            <div>
              <p className="text-sm font-medium">Pet Details</p>
              <p className="text-sm text-muted-foreground">{contact.pet_details?.toString() || 'No details provided'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Interest */}
      <Card>
        <CardHeader>
          <CardTitle>Interested Property</CardTitle>
          <CardDescription>Property the contact is interested in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Current Selection</p>
            <p className="text-sm text-muted-foreground mb-4">{getSelectedPropertyDisplay()}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Change Property</p>
            <Select
              value={selectedPropertyId || 'none'}
              onValueChange={handlePropertyChange}
              disabled={isLoading || isSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading properties..." : "Select a property"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No property selected</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.property_id} value={property.property_id}>
                    {property.address}, {property.city}, {property.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSaving && (
              <p className="text-xs text-muted-foreground mt-1">Saving...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
