export type UserRole = 'admin' | 'user';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  invited_by?: string;
  invited_at?: string;
  last_login_at?: string;
  status: 'active' | 'suspended';
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
  invited_by: string;
  invited_by_name: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
  properties_to_assign?: Property[];
}

export interface OrganizationSettings {
  name: string;
  max_users?: number;
  max_properties?: number;
  invitation_rate_limit: number;
}



