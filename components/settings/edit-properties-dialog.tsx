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
  onSave: (properties: Property[]) => void;
}

export default function EditPropertiesDialog({
  user,
  open,
  onOpenChange,
  onSave,
}: EditPropertiesDialogProps) {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>(user.properties);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      onSave(selectedProperties);
      toast({
        title: 'Properties updated',
        description: `Successfully updated property assignments for ${user.full_name}.`,
      });
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Property Assignments</DialogTitle>
          <DialogDescription>
            Manage property access for {user.full_name} ({user.email})
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



