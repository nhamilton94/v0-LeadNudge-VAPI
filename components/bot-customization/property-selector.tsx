'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { PropertyScope } from '@/types/bot-customization';

interface Property {
  id: string;
  name: string;
  address: string;
}

interface PropertySelectorProps {
  scope: PropertyScope;
  selectedPropertyId: string | null;
  onScopeChange: (scope: PropertyScope) => void;
  onPropertyChange: (propertyId: string | null) => void;
  disabled?: boolean;
}

export function PropertySelector({
  scope,
  selectedPropertyId,
  onScopeChange,
  onPropertyChange,
  disabled = false,
}: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call when backend is ready
    // Fetch properties for the user's organization
    // API call should:
    // - Get organizationId from user context
    // - Only return properties belonging to that organization
    // - Respect user's role (admins see all properties in org)
    // Example:
    // const fetchProperties = async () => {
    //   const response = await fetch('/api/settings/properties');
    //   if (response.ok) {
    //     const data = await response.json();
    //     setProperties(data.properties);
    //   }
    //   setLoading(false);
    // };
    // fetchProperties();
    
    // Mock data for now
    const mockProperties: Property[] = [
      { id: '1', name: 'Sunset Apartments', address: '123 Main St' },
      { id: '2', name: 'Ocean View Complex', address: '456 Beach Blvd' },
      { id: '3', name: 'Mountain Heights', address: '789 Hill Rd' },
    ];
    
    setTimeout(() => {
      setProperties(mockProperties);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="space-y-4">
      <RadioGroup
        value={scope}
        onValueChange={(value) => {
          onScopeChange(value as PropertyScope);
          if (value === 'all') {
            onPropertyChange(null);
          }
        }}
        disabled={disabled}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id="scope-all" disabled={disabled} />
          <Label htmlFor="scope-all" className="font-normal cursor-pointer">
            All Properties (Global) - Apply to every property
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="individual" id="scope-individual" disabled={disabled} />
          <Label htmlFor="scope-individual" className="font-normal cursor-pointer">
            Individual Property - Apply to a specific property
          </Label>
        </div>
      </RadioGroup>

      {scope === 'individual' && (
        <div className="pl-6 pt-2">
          <Label htmlFor="property-select" className="text-sm mb-2 block">
            Select Property
          </Label>
          <Select
            value={selectedPropertyId || undefined}
            onValueChange={(value) => onPropertyChange(value || null)}
            disabled={disabled || loading}
          >
            <SelectTrigger id="property-select" className="w-full max-w-md">
              <SelectValue placeholder={loading ? 'Loading properties...' : 'Choose a property'} />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name} - {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
