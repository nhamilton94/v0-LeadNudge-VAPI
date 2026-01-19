'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import Pagination from './pagination';
import { Invitation } from '@/types/settings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PendingInvitationsProps {
  invitations: Invitation[];
  onInvitationsChange: (invitations: Invitation[]) => void;
  onRefresh?: () => void;
}

export default function PendingInvitations({
  invitations,
  onInvitationsChange,
  onRefresh,
}: PendingInvitationsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);
  const { toast } = useToast();

  // Memoize filtered invitations - ONLY show pending invitations
  const filteredInvitations = useMemo(() => {
    return invitations.filter(invitation => {
      // Only show pending invitations (filter out cancelled, accepted, expired)
      if (invitation.status !== 'pending') {
        return false;
      }
      
      // Apply search filter
      const matchesSearch = 
        invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invitation.invitedBy || invitation.invited_by_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [invitations, searchQuery]);

  // Memoize pagination calculations
  const { totalPages, paginatedInvitations } = useMemo(() => {
    const total = Math.ceil(filteredInvitations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      totalPages: total,
      paginatedInvitations: filteredInvitations.slice(startIndex, endIndex),
    };
  }, [filteredInvitations, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Memoize handlers to prevent child re-renders
  const handleResend = useCallback(async (invitation: Invitation) => {
    setResendingId(invitation.id);

    try {
      // Call API to resend invitation
      const response = await fetch(`/api/settings/invitations/${invitation.id}/resend`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation');
      }

      toast({
        title: 'Invitation resent',
        description: `A new invitation has been sent to ${invitation.email}.`,
      });

      // Refresh parent data if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast({
        title: 'Failed to resend invitation',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setResendingId(null);
    }
  }, [toast, onRefresh]);

  const handleCancelConfirm = useCallback(async () => {
    if (!invitationToCancel) return;

    console.log('[Cancel Invitation] Starting cancel for:', invitationToCancel.email);

    try {
      // Call API to cancel invitation
      const response = await fetch(`/api/settings/invitations/${invitationToCancel.id}`, {
        method: 'DELETE',
      });

      console.log('[Cancel Invitation] API response status:', response.status);

      const data = await response.json();
      console.log('[Cancel Invitation] API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation');
      }

      toast({
        title: 'Invitation cancelled',
        description: `The invitation to ${invitationToCancel.email} has been cancelled.`,
      });

      console.log('[Cancel Invitation] Success! Refreshing data...');

      // Legacy local state update
      onInvitationsChange(
        invitations.filter(inv => inv.id !== invitationToCancel.id)
      );

      // Refresh parent data if callback provided
      if (onRefresh) {
        await onRefresh();
        console.log('[Cancel Invitation] Parent data refreshed');
      }

      setCancelDialogOpen(false);
      setInvitationToCancel(null);
    } catch (error) {
      console.error('[Cancel Invitation] Error:', error);
      toast({
        title: 'Failed to cancel invitation',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      setCancelDialogOpen(false);
      setInvitationToCancel(null);
    }
  }, [invitationToCancel, invitations, onInvitationsChange, toast, onRefresh]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((items: number) => {
    setItemsPerPage(items);
  }, []);

  const getExpiresIn = useCallback((expiresAt: string) => {
    return formatDistanceToNow(new Date(expiresAt), { addSuffix: true });
  }, []);

  return (
    <>
      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search invitations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No invitations found
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>
                  <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                    {invitation.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {invitation.invitedBy || invitation.invited_by_name || 'Unknown'}
                </TableCell>
                <TableCell className="text-sm">
                  {getExpiresIn(invitation.expiresAt || invitation.expires_at)}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invitation)}
                    disabled={resendingId === invitation.id}
                  >
                    {resendingId === invitation.id ? 'Resending...' : 'Resend'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInvitationToCancel(invitation);
                      setCancelDialogOpen(true);
                    }}
                  >
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredInvitations.length}
          itemLabel="invitations"
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to{' '}
              <strong>{invitationToCancel?.email}</strong>? They will no longer be able to use
              this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}



