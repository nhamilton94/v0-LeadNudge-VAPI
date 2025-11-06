import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

export type Contact = Database['public']['Tables']['contacts']['Row']

/**
 * Fetch full contact details by ID
 */
export async function getContactById(contactId: string): Promise<Contact | null> {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (error) {
      console.error('Error fetching contact:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching contact:', error)
    return null
  }
}

/**
 * Fetch contact by conversation ID
 */
export async function getContactByConversationId(conversationId: string): Promise<Contact | null> {
  try {
    // First get the conversation to find the contact_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('contact_id')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation?.contact_id) {
      console.error('Error fetching conversation or no contact_id:', convError)
      return null
    }

    // Then fetch the full contact details
    return await getContactById(conversation.contact_id)
  } catch (error) {
    console.error('Error fetching contact by conversation:', error)
    return null
  }
}