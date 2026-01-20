// Utility functions for consistent contact name handling across the application

interface ContactNameData {
  first_name?: string | null
  last_name?: string | null
  name?: string | null
}

/**
 * Get the display name for a contact with smart fallback logic
 * Priority: first_name + last_name > first_name only > legacy name field > default
 */
export const getContactDisplayName = (contact: ContactNameData): string => {
  // Priority 1: Use first_name + last_name if both available
  if (contact.first_name && contact.last_name) {
    return `${contact.first_name.trim()} ${contact.last_name.trim()}`
  }
  
  // Priority 2: Use first_name only if available
  if (contact.first_name) {
    return contact.first_name.trim()
  }
  
  // Priority 3: Use last_name only if available (edge case)
  if (contact.last_name) {
    return contact.last_name.trim()
  }
  
  // Priority 4: Use legacy name field
  if (contact.name) {
    return contact.name.trim()
  }
  
  // Fallback
  return 'Unknown Contact'
}

/**
 * Get initials for a contact with smart fallback logic
 * Priority: first_name + last_name > first_name only > legacy name field > default
 */
export const getContactInitials = (contact: ContactNameData): string => {
  // Priority 1: Use first_name + last_name initials
  if (contact.first_name && contact.last_name) {
    const firstInitial = contact.first_name.trim()[0]?.toUpperCase() || ''
    const lastInitial = contact.last_name.trim()[0]?.toUpperCase() || ''
    return `${firstInitial}${lastInitial}`
  }
  
  // Priority 2: Use first_name initial only
  if (contact.first_name) {
    return contact.first_name.trim()[0]?.toUpperCase() || '?'
  }
  
  // Priority 3: Use last_name initial only (edge case)
  if (contact.last_name) {
    return contact.last_name.trim()[0]?.toUpperCase() || '?'
  }
  
  // Priority 4: Parse legacy name field for initials
  if (contact.name) {
    return contact.name
      .trim()
      .split(' ')
      .map(n => n[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 2) || '?'
  }
  
  return '?'
}

/**
 * Get the first name of a contact with smart fallback logic
 * Useful for personalized greetings like "Hi John"
 */
export const getContactFirstName = (contact: ContactNameData): string => {
  // Priority 1: Use explicit first_name
  if (contact.first_name) {
    return contact.first_name.trim()
  }
  
  // Priority 2: Parse first word from legacy name field
  if (contact.name) {
    return contact.name.trim().split(' ')[0] || contact.name.trim()
  }
  
  return 'there' // Fallback for greetings: "Hi there"
}

/**
 * Parse legacy name field into first and last name components
 * Used for migrating existing contacts in edit forms
 */
export const parseLegacyName = (name: string): { firstName: string; lastName: string } => {
  if (!name || !name.trim()) {
    return { firstName: '', lastName: '' }
  }
  
  const parts = name.trim().split(' ')
  const firstName = parts[0] || ''
  const lastName = parts.slice(1).join(' ') || ''
  
  return { firstName, lastName }
}

/**
 * Combine first and last name into full name
 * Used for form submissions and backward compatibility
 */
export const combineNames = (firstName?: string, lastName?: string): string => {
  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''
  
  if (first && last) {
    return `${first} ${last}`
  }
  
  return first || last || ''
}