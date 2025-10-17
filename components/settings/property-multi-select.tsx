'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Property } from '@/types/settings';
import { useToast } from '@/components/ui/use-toast';

interface PropertyMultiSelectProps {
  selectedProperties: Property[];
  onSelectionChange: (properties: Property[]) => void;
}

export default function PropertyMultiSelect({
  selectedProperties,
  onSelectionChange,
}: PropertyMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch properties from API
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/properties');
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      setAvailableProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error loading properties',
        description: 'Failed to load available properties. Please try again.',
        variant: 'destructive',
      });
      setAvailableProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (property: Property) => {
    const isSelected = selectedProperties.some(p => p.id === property.id);
    
    if (isSelected) {
      onSelectionChange(selectedProperties.filter(p => p.id !== property.id));
    } else {
      onSelectionChange([...selectedProperties, property]);
    }
  };

  const handleRemove = (propertyId: string) => {
    onSelectionChange(selectedProperties.filter(p => p.id !== propertyId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading properties...
              </>
            ) : selectedProperties.length === 0 ? (
              'Select properties...'
            ) : (
              `${selectedProperties.length} selected`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search properties..." />
            <CommandEmpty>
              {availableProperties.length === 0 
                ? 'No properties available. Add properties first.'
                : 'No properties found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {availableProperties.map((property) => {
                const isSelected = selectedProperties.some(p => p.id === property.id);
                return (
                  <CommandItem
                    key={property.id}
                    onSelect={() => handleSelect(property)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div>
                      <div className="font-medium">{property.address}</div>
                      <div className="text-xs text-muted-foreground">
                        {property.city}, {property.state}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Properties */}
      {selectedProperties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProperties.map((property) => (
            <Badge key={property.id} variant="secondary" className="gap-1">
              {property.address}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => handleRemove(property.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}



