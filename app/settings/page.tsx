'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PeopleList from '@/components/settings/people-list';
import PendingInvitations from '@/components/settings/pending-invitations';
import { mockUsers, mockInvitations, mockCurrentUser } from '@/lib/mock-data/settings-data';
import { User, Invitation } from '@/types/settings';

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [invitations, setInvitations] = useState<Invitation[]>(mockInvitations);
  const currentUser = mockCurrentUser;

  const isAdmin = currentUser.role === 'admin';

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
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}



