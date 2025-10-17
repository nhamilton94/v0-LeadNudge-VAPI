'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MoreHorizontal, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import InviteUsersDialog from './invite-users-dialog';
import EditPropertiesDialog from './edit-properties-dialog';
import ChangeRoleDialog from './change-role-dialog';
import RemoveUserDialog from './remove-user-dialog';
import Pagination from './pagination';
import { User } from '@/types/settings';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PeopleListProps {
  users: User[];
  currentUser: User;
  onUsersChange: (users: User[]) => void;
  onRefresh?: () => void;
}

export default function PeopleList({ users, currentUser, onUsersChange, onRefresh }: PeopleListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editPropertiesUser, setEditPropertiesUser] = useState<User | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);
  const [removeUser, setRemoveUser] = useState<User | null>(null);

  const isAdmin = currentUser.role === 'admin';

  // Memoize filtered users to avoid recalculation on every render
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const userName = user.name || user.full_name || '';
      const userEmail = user.email || '';
      const matchesSearch = userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Memoize pagination calculations
  const { totalPages, paginatedUsers } = useMemo(() => {
    const total = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      totalPages: total,
      paginatedUsers: filteredUsers.slice(startIndex, endIndex),
    };
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, itemsPerPage]);

  // Memoize helper functions
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Memoize handlers to prevent child re-renders
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((items: number) => {
    setItemsPerPage(items);
  }, []);

  const handleRoleFilterChange = useCallback((value: 'all' | 'admin' | 'user') => {
    setRoleFilter(value);
  }, []);

  const renderProperties = (user: User) => {
    const properties = user.properties || [];
    
    if (properties.length === 0) {
      return <span className="text-muted-foreground text-sm">No properties</span>;
    }

    // Single property - show with hover card for details
    if (properties.length === 1) {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className="font-normal cursor-pointer">
              {properties[0].address}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" align="start">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Property Details</h4>
              <div className="text-sm p-2 bg-muted rounded-md">
                <div className="font-medium">{properties[0].address}</div>
                <div className="text-muted-foreground text-xs mt-1">
                  {properties[0].city}, {properties[0].state}
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    // Multiple properties - show count with hover card
    return (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-auto p-0 px-2 py-1 hover:bg-muted font-normal text-sm text-blue-600"
          >
            {properties.length} properties assigned
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80" align="start">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Assigned Properties ({properties.length})</h4>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {properties.map((prop) => (
                <div 
                  key={prop.id} 
                  className="text-sm p-2 bg-muted hover:bg-muted/80 rounded-md"
                >
                  <div className="font-medium">{prop.address}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {prop.city}, {prop.state}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          {isAdmin && (
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Users
          </Button>
        )}
      </div>

      {/* People Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(user.name || user.full_name || user.email)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || user.full_name || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </TableCell>
                  <TableCell>{renderProperties(user)}</TableCell>
                  <TableCell>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setChangeRoleUser(user)}>
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditPropertiesUser(user)}>
                            Edit Properties
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setRemoveUser(user)}
                            className="text-destructive"
                            disabled={user.id === currentUser.id}
                          >
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {!isAdmin && (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredUsers.length}
        itemLabel="users"
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Dialogs */}
      <InviteUsersDialog 
        open={inviteDialogOpen} 
        onOpenChange={setInviteDialogOpen}
        onSuccess={onRefresh}
      />
      {editPropertiesUser && (
        <EditPropertiesDialog
          user={editPropertiesUser}
          open={!!editPropertiesUser}
          onOpenChange={(open) => !open && setEditPropertiesUser(null)}
          onSuccess={onRefresh}
          onSave={(updatedProperties) => {
            // Legacy local state update
            onUsersChange(
              users.map(u => u.id === editPropertiesUser.id ? { ...u, properties: updatedProperties } : u)
            );
            setEditPropertiesUser(null);
          }}
        />
      )}
      {changeRoleUser && (
        <ChangeRoleDialog
          user={changeRoleUser}
          open={!!changeRoleUser}
          onOpenChange={(open) => !open && setChangeRoleUser(null)}
          onSuccess={onRefresh}
          onSave={(newRole) => {
            // Legacy local state update
            onUsersChange(
              users.map(u => u.id === changeRoleUser.id ? { ...u, role: newRole } : u)
            );
            setChangeRoleUser(null);
          }}
        />
      )}
      {removeUser && (
        <RemoveUserDialog
          user={removeUser}
          open={!!removeUser}
          onOpenChange={(open) => !open && setRemoveUser(null)}
          onSuccess={onRefresh}
          onConfirm={() => {
            // Legacy local state update
            onUsersChange(users.filter(u => u.id !== removeUser.id));
            setRemoveUser(null);
          }}
        />
      )}
    </div>
  );
}



