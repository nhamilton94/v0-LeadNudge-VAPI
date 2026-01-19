import { Database } from '@/lib/database.types'

// Base Property type from database
export type Property = Database['public']['Tables']['properties']['Row']

// Extended Property type with additional computed or optional fields if needed
export interface PropertyWithDetails extends Property {
  // Add any additional fields that might be computed or joined
  description?: string | null // Optional description field for future use
}