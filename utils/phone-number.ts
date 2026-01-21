/**
 * Normalizes phone numbers to digits-only format for consistent storage
 * Strips all formatting (parentheses, dashes, plus signs, spaces, etc.)
 * Handles US numbers from Zillow (e.g., "908-244-8429") and Twilio (e.g., "+19082448429")
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return ''
  
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Handle various US phone number formats:
  // - (908) 244-8429 -> 9082448429 (Zillow format)
  // - 908-244-8429 -> 9082448429 (Zillow format)  
  // - +19082448429 -> 9082448429 (Twilio format)
  // - 19082448429 -> 9082448429 (11-digit with country code)
  // - 9082448429 -> 9082448429 (10-digit US number)
  
  // If starts with 1 and has 11 digits, remove the country code (1)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return digitsOnly.substring(1) // Remove leading 1, return 10 digits
  }
  
  // If has 10 digits, it's already in the correct format
  if (digitsOnly.length === 10) {
    return digitsOnly
  }
  
  // For any other case, return as-is (may be international or invalid)
  return digitsOnly
}

/**
 * Gets phone number variations for database queries
 * Returns the normalized digits-only format for consistent matching
 */
export function getPhoneSearchVariants(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return []
  
  // Since we're storing digits-only format, we only need the normalized version
  // All phone numbers (from Zillow and Twilio) are normalized to 10 digits: 9082448429
  return [normalized]
}