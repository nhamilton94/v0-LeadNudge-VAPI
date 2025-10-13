import { User, Property, Invitation } from '@/types/settings';

export const mockProperties: Property[] = [
  { id: '1', address: '123 Main St', city: 'San Francisco', state: 'CA' },
  { id: '2', address: '456 Oak Ave', city: 'San Francisco', state: 'CA' },
  { id: '3', address: '789 Pine Rd', city: 'Oakland', state: 'CA' },
  { id: '4', address: '321 Elm St', city: 'Berkeley', state: 'CA' },
  { id: '5', address: '654 Maple Dr', city: 'San Jose', state: 'CA' },
  { id: '6', address: '987 Cedar Ln', city: 'Palo Alto', state: 'CA' },
  { id: '7', address: '159 Birch Way', city: 'Mountain View', state: 'CA' },
];

export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@abcrealty.com',
    full_name: 'John Admin',
    role: 'admin',
    avatar_url: null,
    status: 'active',
    last_login_at: '2025-01-08T10:30:00Z',
    properties: mockProperties, // Admin sees all
  },
  {
    id: '2',
    email: 'jane@abcrealty.com',
    full_name: 'Jane Smith',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2025-01-05T14:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T09:15:00Z',
    properties: [mockProperties[0], mockProperties[1], mockProperties[2]], // 3 properties
  },
  {
    id: '3',
    email: 'mike@abcrealty.com',
    full_name: 'Mike Johnson',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2025-01-06T10:00:00Z',
    status: 'active',
    last_login_at: '2025-01-07T16:45:00Z',
    properties: [mockProperties[3], mockProperties[4], mockProperties[0], mockProperties[1], mockProperties[5]], // 5 properties
  },
  {
    id: '4',
    email: 'sarah@abcrealty.com',
    full_name: 'Sarah Williams',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2025-01-03T11:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T08:30:00Z',
    properties: [mockProperties[2]], // 1 property
  },
  {
    id: '5',
    email: 'robert@abcrealty.com',
    full_name: 'Robert Davis',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2025-01-04T09:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T11:20:00Z',
    properties: [mockProperties[0], mockProperties[3]], // 2 properties
  },
  {
    id: '6',
    email: 'emily@abcrealty.com',
    full_name: 'Emily Martinez',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2025-01-02T15:30:00Z',
    status: 'active',
    last_login_at: '2025-01-07T14:10:00Z',
    properties: [mockProperties[1], mockProperties[4], mockProperties[6]], // 3 properties
  },
  {
    id: '7',
    email: 'david@abcrealty.com',
    full_name: 'David Brown',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2025-01-01T12:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T07:45:00Z',
    properties: [mockProperties[5]], // 1 property
  },
  {
    id: '8',
    email: 'lisa@abcrealty.com',
    full_name: 'Lisa Anderson',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2024-12-28T10:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T13:00:00Z',
    properties: [mockProperties[2], mockProperties[3], mockProperties[4], mockProperties[5]], // 4 properties
  },
  {
    id: '9',
    email: 'james@abcrealty.com',
    full_name: 'James Wilson',
    role: 'admin',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2024-12-20T08:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T06:30:00Z',
    properties: mockProperties, // Admin sees all
  },
  {
    id: '10',
    email: 'maria@abcrealty.com',
    full_name: 'Maria Garcia',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2024-12-15T16:00:00Z',
    status: 'active',
    last_login_at: '2025-01-07T18:20:00Z',
    properties: [mockProperties[0], mockProperties[6]], // 2 properties
  },
  {
    id: '11',
    email: 'thomas@abcrealty.com',
    full_name: 'Thomas Taylor',
    role: 'user',
    avatar_url: null,
    invited_by: '1',
    invited_at: '2024-12-10T14:30:00Z',
    status: 'active',
    last_login_at: '2025-01-08T12:15:00Z',
    properties: [mockProperties[1], mockProperties[5]], // 2 properties
  },
  {
    id: '12',
    email: 'jennifer@abcrealty.com',
    full_name: 'Jennifer Lee',
    role: 'user',
    avatar_url: null,
    invited_by: '9',
    invited_at: '2024-12-05T11:00:00Z',
    status: 'active',
    last_login_at: '2025-01-08T15:40:00Z',
    properties: [mockProperties[3], mockProperties[4]], // 2 properties
  },
];

export const mockInvitations: Invitation[] = [
  {
    id: '1',
    email: 'newuser@abcrealty.com',
    role: 'user',
    invited_by: '1',
    invited_by_name: 'John Admin',
    status: 'pending',
    expires_at: '2025-01-15T14:00:00Z',
    created_at: '2025-01-08T14:00:00Z',
    properties_to_assign: [mockProperties[0]],
  },
  {
    id: '2',
    email: 'tom@abcrealty.com',
    role: 'admin',
    invited_by: '1',
    invited_by_name: 'John Admin',
    status: 'pending',
    expires_at: '2025-01-12T09:00:00Z',
    created_at: '2025-01-05T09:00:00Z',
  },
  {
    id: '3',
    email: 'amy@abcrealty.com',
    role: 'user',
    invited_by: '9',
    invited_by_name: 'James Wilson',
    status: 'pending',
    expires_at: '2025-01-16T10:00:00Z',
    created_at: '2025-01-09T10:00:00Z',
    properties_to_assign: [mockProperties[2], mockProperties[3]],
  },
  {
    id: '4',
    email: 'chris@abcrealty.com',
    role: 'user',
    invited_by: '1',
    invited_by_name: 'John Admin',
    status: 'pending',
    expires_at: '2025-01-14T15:30:00Z',
    created_at: '2025-01-07T15:30:00Z',
  },
  {
    id: '5',
    email: 'patricia@abcrealty.com',
    role: 'user',
    invited_by: '9',
    invited_by_name: 'James Wilson',
    status: 'pending',
    expires_at: '2025-01-17T11:00:00Z',
    created_at: '2025-01-10T11:00:00Z',
    properties_to_assign: [mockProperties[1]],
  },
  {
    id: '6',
    email: 'mark@abcrealty.com',
    role: 'admin',
    invited_by: '1',
    invited_by_name: 'John Admin',
    status: 'pending',
    expires_at: '2025-01-13T08:00:00Z',
    created_at: '2025-01-06T08:00:00Z',
  },
];

export const mockCurrentUser: User = mockUsers[0]; // Logged in as Admin

// To test as regular user, uncomment:
// export const mockCurrentUser: User = mockUsers[1]; // Logged in as User



