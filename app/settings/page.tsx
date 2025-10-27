'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import PeopleList from '@/components/settings/people-list';
import PendingInvitations from '@/components/settings/pending-invitations';
import { User, Invitation } from '@/types/settings';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch users and current user info
  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/settings/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
      
      // Determine current user from the list (you can also fetch this from a separate endpoint)
      // For now, we'll get it from the auth context or a separate call
      fetchCurrentUser();
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/settings/invitations');
      if (!response.ok) throw new Error('Failed to fetch invitations');
      
      const data = await response.json();
      console.log('[Settings] Received invitations:', data.invitations?.length || 0);
      console.log('[Settings] Invitation statuses:', data.invitations?.map((inv: any) => ({ email: inv.email, status: inv.status })));
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  // Refresh both users and invitations (called after invite, role change, etc.)
  const handleRefresh = async () => {
    await Promise.all([fetchUsers(), fetchInvitations()]);
  };

  const isAdmin = currentUser?.role === 'admin';

  if (loading || !currentUser) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="people" className="w-full">
        <TabsList>
          <TabsTrigger value="people">People</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="invitations">
              Pending Invitations ({invitations.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* People Tab */}
        <TabsContent value="people" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent>
              <PeopleList 
                users={users} 
                currentUser={currentUser}
                onUsersChange={setUsers}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Invitations Tab */}
        {isAdmin && (
          <TabsContent value="invitations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
              </CardHeader>
              <CardContent>
                <PendingInvitations 
                  invitations={invitations}
                  onInvitationsChange={setInvitations}
                  onRefresh={fetchInvitations}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}



