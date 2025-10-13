import { SupabaseClient } from '@supabase/supabase-js'

export interface SearchResult {
  type: 'conversation' | 'message'
  conversation_id: string
  conversation_name: string
  contact_email: string | null
  phone_number: string | null
  message_id?: string
  message_content?: string
  message_timestamp?: string
  message_direction?: 'inbound' | 'outbound'
  match_snippet?: string
  match_type: 'conversation_name' | 'message_content'
}

export interface SearchOptions {
  supabase: SupabaseClient
  userId: string
  query: string
  limit?: number
  offset?: number
}

export interface SearchResults {
  results: SearchResult[]
  total: number
  hasMore: boolean
}

/**
 * Comprehensive search across conversations and messages
 */
export async function searchConversationsAndMessages({
  supabase,
  userId,
  query,
  limit = 50,
  offset = 0
}: SearchOptions): Promise<SearchResults> {
  try {
    if (!query.trim()) {
      return { results: [], total: 0, hasMore: false }
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`
    
    // Search in conversations (contact names) - using base tables
    const { data: conversationResults, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        phone_number,
        contacts (
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .or(`contacts.name.ilike.${searchTerm},contacts.email.ilike.${searchTerm},phone_number.ilike.${searchTerm}`)
      .limit(Math.min(limit, 25)) // Limit conversation results

    if (convError) {
      console.error('Error searching conversations:', convError)
    }

    // Search in messages content - simplified approach
    const { data: messageResults, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        direction,
        created_at,
        conversation_id
      `)
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 25)) // Limit message results

    if (msgError) {
      console.error('Error searching messages:', msgError)
    }

    // Combine and format results
    const results: SearchResult[] = []

    // Add conversation matches
    if (conversationResults) {
      conversationResults.forEach(conv => {
        results.push({
          type: 'conversation',
          conversation_id: conv.id!,
          conversation_name: (conv.contacts as any)?.name || 'Unknown Contact',
          contact_email: (conv.contacts as any)?.email,
          phone_number: conv.phone_number,
          match_snippet: (conv.contacts as any)?.name || '',
          match_type: 'conversation_name'
        })
      })
    }

    // Add message matches - get conversation details separately
    if (messageResults && messageResults.length > 0) {
      // Get unique conversation IDs from message results
      const conversationIds = [...new Set(messageResults.map(msg => msg.conversation_id))]
      
      // Get conversation details for these IDs
      const { data: messageConversations } = await supabase
        .from('conversations')
        .select(`
          id, 
          phone_number,
          contacts (
            name,
            email
          )
        `)
        .eq('user_id', userId)
        .in('id', conversationIds)

      // Create a lookup map for conversation details
      const conversationLookup = (messageConversations || []).reduce((acc, conv) => {
        acc[conv.id!] = conv
        return acc
      }, {} as Record<string, any>)

      messageResults.forEach(msg => {
        const conversation = conversationLookup[msg.conversation_id]
        results.push({
          type: 'message',
          conversation_id: msg.conversation_id,
          conversation_name: (conversation?.contacts as any)?.name || 'Unknown Contact',
          contact_email: (conversation?.contacts as any)?.email,
          phone_number: conversation?.phone_number,
          message_id: msg.id,
          message_content: msg.content,
          message_timestamp: msg.created_at,
          message_direction: msg.direction,
          match_snippet: highlightMatch(msg.content, query),
          match_type: 'message_content'
        })
      })
    }

    // Sort by relevance (conversation matches first, then by timestamp)
    results.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'conversation' ? -1 : 1
      }
      
      const aTime = a.message_timestamp || '0'
      const bTime = b.message_timestamp || '0'
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    const total = results.length
    const paginatedResults = results.slice(offset, offset + limit)

    return {
      results: paginatedResults,
      total,
      hasMore: offset + limit < total
    }

  } catch (error) {
    console.error('Error in comprehensive search:', error)
    return { results: [], total: 0, hasMore: false }
  }
}

/**
 * Highlight matching text in content with proper highlighting
 */
function highlightMatch(content: string, query: string): string {
  if (!query.trim()) return content

  const queryTerm = query.trim()
  const regex = new RegExp(`(${escapeRegExp(queryTerm)})`, 'gi')
  
  // Find the match position
  const matchIndex = content.toLowerCase().indexOf(queryTerm.toLowerCase())
  if (matchIndex === -1) return content

  // Get context around the match (40 chars before and after for better context)
  const contextLength = 40
  const start = Math.max(0, matchIndex - contextLength)
  const end = Math.min(content.length, matchIndex + queryTerm.length + contextLength)
  
  let snippet = content.substring(start, end)
  
  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'
  
  // Apply highlighting with markers that can be processed by the UI
  const highlightedSnippet = snippet.replace(regex, `<mark>$1</mark>`)
  
  return highlightedSnippet
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Load all messages for a conversation to find a specific message
 */
export async function loadMessagesForNavigation(
  supabase: SupabaseClient,
  conversationId: string,
  targetMessageId: string,
  userId: string
): Promise<{ messages: any[], targetIndex: number }> {
  try {
    // Load all messages for this conversation
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }) // Chronological order

    if (error) {
      console.error('Error loading messages for navigation:', error)
      return { messages: [], targetIndex: -1 }
    }

    const targetIndex = messages?.findIndex(msg => msg.id === targetMessageId) ?? -1

    return {
      messages: messages || [],
      targetIndex
    }

  } catch (error) {
    console.error('Error in loadMessagesForNavigation:', error)
    return { messages: [], targetIndex: -1 }
  }
}