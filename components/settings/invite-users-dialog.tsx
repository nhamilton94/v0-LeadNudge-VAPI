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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import PropertyMultiSelect from './property-multi-select';
import { UserRole, Property } from '@/types/settings';

interface InviteUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InviteUsersDialog({ open, onOpenChange }: InviteUsersDialogProps) {
  const [emails, setEmails] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

    setIsLoading(true);

    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Invitations sent!',
        description: `Successfully sent ${emailList.length} invitation(s).`,
      });
      
      // Reset form
      setEmails('');
      setRole('user');
      setSelectedProperties([]);
      onOpenChange(false);
    }, 1000);
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
            <RadioGroup value={role} onValueChange={(value) => setRole(value as UserRole)}>
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



