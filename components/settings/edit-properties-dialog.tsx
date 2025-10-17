'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import PropertyMultiSelect from './property-multi-select';
import { User, Property } from '@/types/settings';

interface EditPropertiesDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (properties: Property[]) => void;
  onSuccess?: () => void;
}

export default function EditPropertiesDialog({
  user,
  open,
  onOpenChange,
  onSave,
  onSuccess,
}: EditPropertiesDialogProps) {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>(user.properties);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Call API to update properties
      const response = await fetch(`/api/settings/users/${user.id}/properties`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyIds: selectedProperties.map(p => p.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update properties');
      }

      toast({
        title: 'Properties updated',
        description: `Successfully updated property assignments for ${user.name || user.full_name}.`,
      });

      // Call legacy callback if provided
      if (onSave) {
        onSave(selectedProperties);
      }

      // Refresh parent data
      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating properties:', error);
      toast({
        title: 'Failed to update properties',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Property Assignments</DialogTitle>
          <DialogDescription>
            Manage property access for {user.name || user.full_name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <PropertyMultiSelect
            selectedProperties={selectedProperties}
            onSelectionChange={setSelectedProperties}
          />
          <p className="text-sm text-muted-foreground mt-4">
            Currently assigned to {selectedProperties.length} {selectedProperties.length === 1 ? 'property' : 'properties'}.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



