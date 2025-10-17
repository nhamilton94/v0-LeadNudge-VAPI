export type UserRole = 'admin' | 'user';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface User {
  id: string;
  email: string;
  name?: string; // From API
  full_name?: string; // Legacy field
  role: UserRole;
  roleId?: string | null; // Role ID from database
  organizationId?: string; // Organization ID
  avatar_url?: string | null;
  invited_by?: string;
  invited_at?: string;
  last_login_at?: string;
  lastLoginAt?: string; // From API
  createdAt?: string; // From API
  status?: 'active' | 'inactive' | 'suspended';
  properties: Property[];
}

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  roleId?: string | null; // Role ID from database
  invitedBy?: string; // From API
  invited_by?: string; // Legacy
  invited_by_name?: string; // Legacy
  status: InvitationStatus;
  expiresAt?: string; // From API
  expires_at?: string; // Legacy
  createdAt?: string; // From API
  created_at?: string; // Legacy
  acceptedAt?: string | null; // From API
  propertiesToAssign?: string[]; // From API (property IDs)
  properties_to_assign?: Property[]; // Legacy
}

export interface OrganizationSettings {
  name: string;
  max_users?: number;
  max_properties?: number;
  invitation_rate_limit: number;
}



