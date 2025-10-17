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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { User, UserRole } from '@/types/settings';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ChangeRoleDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (newRole: UserRole) => void;
  onSuccess?: () => void;
}

export default function ChangeRoleDialog({
  user,
  open,
  onOpenChange,
  onSave,
  onSuccess,
}: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);

    try {
      // Get the role ID for the selected role
      const rolesResponse = await fetch('/api/settings/roles');
      if (!rolesResponse.ok) throw new Error('Failed to fetch roles');
      
      const rolesData = await rolesResponse.json();
      const roleObj = rolesData.roles?.find((r: any) => r.name === selectedRole);
      
      if (!roleObj) throw new Error('Role not found');

      // Call API to change role
      const response = await fetch(`/api/settings/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleId: roleObj.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change role');
      }

      toast({
        title: 'Role changed',
        description: `${user.name || user.full_name} is now ${selectedRole === 'admin' ? 'an Admin' : 'a User'}.`,
      });

      // Call legacy callback if provided
      if (onSave) {
        onSave(selectedRole);
      }

      // Refresh parent data
      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'Failed to change role',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {user.name || user.full_name} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
            <label 
              htmlFor="role-user-change" 
              className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent"
            >
              <RadioGroupItem value="user" id="role-user-change" />
              <div className="space-y-1 leading-none flex-1">
                <div className="font-medium">
                  User
                </div>
                <p className="text-sm text-muted-foreground">
                  Can view assigned properties and interact with leads. Cannot manage users or settings.
                </p>
              </div>
            </label>
            <label 
              htmlFor="role-admin-change" 
              className="flex items-start space-x-3 space-y-0 rounded-md border p-4 cursor-pointer hover:bg-accent"
            >
              <RadioGroupItem value="admin" id="role-admin-change" />
              <div className="space-y-1 leading-none flex-1">
                <div className="font-medium">
                  Admin
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to manage users, properties, assignments, and organization settings.
                </p>
              </div>
            </label>
          </RadioGroup>

          {selectedRole === 'admin' && user.role === 'user' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This user will gain full administrative access to the organization.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



