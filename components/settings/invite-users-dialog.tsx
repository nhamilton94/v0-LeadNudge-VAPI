'use client';

import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import PropertyMultiSelect from './property-multi-select';
import { UserRole, Property } from '@/types/settings';

interface InviteUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function InviteUsersDialog({ open, onOpenChange, onSuccess }: InviteUsersDialogProps) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [roleId, setRoleId] = useState<string>('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available roles when dialog opens
  useEffect(() => {
    if (open) {
      fetchRoles();
    }
  }, [open]);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/settings/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data = await response.json();
      setRoles(data.roles || []);
      
      // Set default role ID
      const userRole = data.roles?.find((r: Role) => r.name === 'user');
      if (userRole) {
        setRoleId(userRole.id);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate emails
    const emailList = emails
      .split(/[\n,\s]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0);

    const invalidEmails = emailList.filter(email => !email.includes('@'));

    if (invalidEmails.length > 0) {
      toast({
        title: 'Invalid emails',
        description: `The following emails are invalid: ${invalidEmails.join(', ')}`,
        variant: 'destructive',
      });
      return;
    }

    if (emailList.length === 0) {
      toast({
        title: 'No emails provided',
        description: 'Please enter at least one email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!roleId) {
      toast({
        title: 'Role not selected',
        description: 'Please select a role for the invited users.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call real API
      const response = await fetch('/api/settings/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emailList,
          roleId: roleId,
          propertyIds: selectedProperties.map(p => p.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations');
      }

      toast({
        title: 'Invitations sent!',
        description: data.message || `Successfully sent ${emailList.length} invitation(s).`,
      });
      
      // Reset form
      setEmails('');
      setRole('user');
      setSelectedProperties([]);
      
      // Refresh parent data
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast({
        title: 'Failed to send invitations',
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
          <DialogTitle>Invite Users</DialogTitle>
          <DialogDescription>
            Invite new team members to your organization. You can invite multiple users at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="emails">Email Addresses *</Label>
            <Textarea
              id="emails"
              placeholder="Enter emails (comma, space, or newline separated)&#10;example@company.com, another@company.com"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Invitations will expire after 7 days.
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Assign Role *</Label>
            <RadioGroup 
              value={role} 
              onValueChange={(value) => {
                const selectedRole = roles.find(r => r.name === value);
                setRole(value as UserRole);
                if (selectedRole) {
                  setRoleId(selectedRole.id);
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="role-user" />
                <Label htmlFor="role-user" className="font-normal cursor-pointer">
                  User
                  <span className="text-xs text-muted-foreground ml-2">
                    - Can view assigned properties and interact with leads
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="role-admin" />
                <Label htmlFor="role-admin" className="font-normal cursor-pointer">
                  Admin
                  <span className="text-xs text-muted-foreground ml-2">
                    - Full access to manage users, properties, and settings
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Property Assignment (Optional) */}
          <div className="space-y-2">
            <Label>Assign Properties (Optional)</Label>
            <PropertyMultiSelect
              selectedProperties={selectedProperties}
              onSelectionChange={setSelectedProperties}
            />
            <p className="text-xs text-muted-foreground">
              Pre-assign properties that users will have access to upon joining.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Invitations'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



