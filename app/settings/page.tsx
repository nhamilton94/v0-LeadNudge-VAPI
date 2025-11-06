'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import PeopleList from '@/components/settings/people-list';
import PendingInvitations from '@/components/settings/pending-invitations';
import BotCustomizationTab from '@/components/settings/bot-customization-tab';
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
    <div className="h-screen flex flex-col">
      {/* Admin View: Show tabs with People, Pending Invitations, and Bot Customization */}
      {isAdmin ? (
        <Tabs defaultValue="people" className="flex flex-col h-full">
          {/* Fixed Header with Tabs */}
          <div className="flex-shrink-0 border-b bg-background sticky top-0 z-10">
            <div className="container mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <TabsList className="h-auto bg-transparent">
                  <TabsTrigger 
                    value="people"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                  >
                    People
                  </TabsTrigger>
                  <TabsTrigger 
                    value="invitations"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                  >
                    Pending Invitations ({invitations.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bot-customization"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                  >
                    Bot Customization
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {/* People Tab */}
            <TabsContent value="people" className="m-0 h-full">
              <div className="container mx-auto px-6 py-6">
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
              </div>
            </TabsContent>

            {/* Pending Invitations Tab */}
            <TabsContent value="invitations" className="m-0 h-full">
              <div className="container mx-auto px-6 py-6">
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
              </div>
            </TabsContent>

            {/* Bot Customization Tab */}
            <TabsContent value="bot-customization" className="m-0 h-full">
              <div className="container mx-auto px-6 py-6">
                <BotCustomizationTab isAdmin={isAdmin} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        /* User View: Show only People list without tabs */
        <>
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b bg-background sticky top-0 z-10">
            <div className="container mx-auto px-6 py-6">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-6">
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
            </div>
          </div>
        </>
      )}
    </div>
  );
}



