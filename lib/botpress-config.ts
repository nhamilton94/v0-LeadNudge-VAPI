/**
 * Botpress Integration Configuration
 * This file provides the API URL for Botpress to fetch customizations
 */

/**
 * Get the base API URL for Botpress to call
 * In production: uses NEXT_PUBLIC_APP_URL
 * In development: uses localhost
 */
export function getBotpressApiUrl(): string {
  // Check if we're in browser or server
  if (typeof window !== 'undefined') {
    // Browser: use window.location.origin or env var
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }
  
  // Server: use env var or fallback to localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Get the full customizations endpoint URL for Botpress
 */
export function getCustomizationsEndpoint(organizationId: string, propertyId?: string | null): string {
  const baseUrl = getBotpressApiUrl();
  const params = new URLSearchParams({
    organization_id: organizationId,
  });
  
  if (propertyId) {
    params.set('property_id', propertyId);
  }
  
  return `${baseUrl}/api/botpress/customizations?${params.toString()}`;
}

/**
 * Configuration to copy-paste into Botpress Execute Code card
 */
export const BOTPRESS_GREETING_CODE = `
// Fetch greeting from LeadNudge API
try {
  // Get organization ID from conversation tags or event
  const orgId = event.tags?.organizationId || 
                event.payload?.organizationId || 
                '00000000-0000-0000-0000-000000000001'; // Default for testing
  
  // API URL - UPDATE THIS WITH YOUR PRODUCTION URL
  const apiUrl = \`https://your-domain.vercel.app/api/botpress/customizations?organization_id=\${orgId}\`;
  
  console.log('[Botpress] Fetching greeting for org:', orgId);
  console.log('[Botpress] API URL:', apiUrl);
  
  const response = await axios.get(apiUrl);
  
  if (response.data && response.data.customGreeting) {
    workflow.customGreeting = response.data.customGreeting;
    console.log('[Botpress] ✅ Greeting loaded successfully');
    console.log('[Botpress] Greeting:', workflow.customGreeting.substring(0, 100));
  } else {
    // Fallback default
    workflow.customGreeting = "Hi {prospect_name}! I'm {bot_name}, a virtual assistant for {property_name}. How can I help you today?";
    console.log('[Botpress] ⚠️ No custom greeting found, using default');
  }
  
} catch (error) {
  console.error('[Botpress] Error loading greeting:', error.message);
  console.error('[Botpress] Full error:', error);
  
  // Use default on error (bot won't break)
  workflow.customGreeting = "Hi {prospect_name}! I'm {bot_name}, a virtual assistant for {property_name}. How can I help you today?";
  console.log('[Botpress] Using fallback greeting due to error');
}
`;

