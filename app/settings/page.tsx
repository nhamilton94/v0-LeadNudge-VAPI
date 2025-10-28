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
  const [dataLoading, setDataLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const { toast } = useToast();

  // Fetch current user first to check if admin
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch users for all, invitations only for admin (only once on mount)
  useEffect(() => {
    if (currentUser && !initialFetchDone) {
      setInitialFetchDone(true);
      loadInitialData();
    }
  }, [currentUser, isAdmin, initialFetchDone]);

  const loadInitialData = async () => {
    setDataLoading(true);
    
    try {
      // All users can see the people list
      await fetchUsers();
      
      // Only admins can see invitations
      if (isAdmin) {
        await fetchInvitations();
      }
    } finally {
      setDataLoading(false);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/settings/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        setIsAdmin(data.user?.role === 'admin');
      } else {
        // User not authenticated or profile not found
        setInitialFetchDone(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setInitialFetchDone(true);
      setLoading(false);
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

  // Refresh users and invitations (called after invite, role change, etc.)
  const handleRefresh = async () => {
    if (isAdmin) {
      await Promise.all([fetchUsers(), fetchInvitations()]);
    } else {
      await fetchUsers();
    }
  };

  // Loading state - show skeleton until both user and data are loaded
  if (loading || !currentUser || dataLoading) {
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

      {/* Admin View: Show tabs with People and Pending Invitations */}
      {isAdmin ? (
        <Tabs defaultValue="people" className="w-full">
          <TabsList>
            <TabsTrigger value="people">People</TabsTrigger>
            <TabsTrigger value="invitations">
              Pending Invitations ({invitations.length})
            </TabsTrigger>
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
        </Tabs>
      ) : (
        /* User View: Show only People list without tabs */
        <Card>
          <CardHeader>
            <CardTitle>People in your Organization</CardTitle>
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
      )}
    </div>
  );
}



