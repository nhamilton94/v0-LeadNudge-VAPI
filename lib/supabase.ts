// Update the supabase import to ensure it's properly initialized

import { supabase as browserSupabase } from "@/utils/supabase/client-browser"

// Export the browser client for client-side usage
export const supabase = browserSupabase
