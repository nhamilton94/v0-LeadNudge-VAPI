import { supabase } from '@/lib/supabase/client'
import { Message } from '@/lib/database.types'

/**
 * Load all messages for a conversation in chronological order for navigation
 * This bypasses the pagination logic to get a simple chronological list
 */
export async function loadAllMessagesForNavigation(
  conversationId: string
): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }) // Simple chronological order
    
    if (error) {
      console.error('Error loading messages for navigation:', error)
      throw new Error(`Failed to load messages: ${error.message}`)
    }
    
    return data || []
  } catch (error) {
    console.error('Error in loadAllMessagesForNavigation:', error)
    throw error
  }
}