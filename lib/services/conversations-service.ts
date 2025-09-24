import { supabase } from '@/lib/supabase/client'
import { Database, ConversationSummary, Message } from '@/lib/database.types'

export interface ConversationListParams {
  userId: string
  page?: number
  limit?: number
  search?: string
  orderBy?: 'last_message_at' | 'created_at'
  orderDirection?: 'asc' | 'desc'
}

export interface ConversationListResponse {
  conversations: ConversationSummary[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface MessageListParams {
  conversationId: string
  page?: number
  limit?: number
  orderBy?: 'created_at'
  orderDirection?: 'asc' | 'desc'
}

export interface MessageListResponse {
  messages: Message[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/**
 * Fetch conversations with pagination and search
 * @param params - Conversation list parameters
 * @returns Promise<ConversationListResponse>
 * @throws Error with descriptive message on failure
 */
export async function getConversations(params: ConversationListParams): Promise<ConversationListResponse> {
  // Input validation
  if (!params.userId) {
    throw new Error('User ID is required')
  }

  const {
    userId,
    page = 1,
    limit = 20,
    search = '',
    orderBy = 'last_message_at',
    orderDirection = 'desc'
  } = params

  // Validate pagination parameters
  if (page < 1) {
    throw new Error('Page must be greater than 0')
  }
  if (limit < 1 || limit > 100) {
    throw new Error('Limit must be between 1 and 100')
  }

  try {
    let query = supabase
      .from('conversation_summaries')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    // Add search filter if provided
    if (search.trim()) {
      query = query.or(`contact_name.ilike.%${search}%,contact_email.ilike.%${search}%,phone_number.ilike.%${search}%,last_message_content.ilike.%${search}%`)
    }

    // Add ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching conversations:', error)
      throw new Error(`Failed to fetch conversations: ${error.message}`)
    }

    // Fetch unread counts for all conversations in a single query
    const conversationIds = (data || []).map(c => c.id).filter(Boolean)
    let unreadCounts: Record<string, number> = {}
    
    if (conversationIds.length > 0) {
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('is_read', false)

      if (unreadError) {
        console.error('Error fetching unread counts:', unreadError)
      }

      // Count unread messages per conversation
      unreadCounts = (unreadData || []).reduce((acc, message) => {
        acc[message.conversation_id] = (acc[message.conversation_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    // Add unread counts to conversations
    const conversationsWithUnread = (data || []).map(conversation => ({
      ...conversation,
      unread_count: unreadCounts[conversation.id!] || 0
    }))

    const total = count || 0
    const hasMore = from + limit < total

    return {
      conversations: conversationsWithUnread,
      total,
      page,
      limit,
      hasMore
    }
  } catch (error) {
    console.error('Error in getConversations:', error)
    throw error
  }
}

/**
 * Fetch messages for a specific conversation with pagination
 */
export async function getMessages(params: MessageListParams): Promise<MessageListResponse> {
  const {
    conversationId,
    page = 1,
    limit = 50,
    orderBy = 'created_at',
    orderDirection = 'asc'
  } = params

  try {
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)

    // Add ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    const total = count || 0
    const hasMore = from + limit < total

    return {
      messages: data || [],
      total,
      page,
      limit,
      hasMore
    }
  } catch (error) {
    console.error('Error in getMessages:', error)
    throw error
  }
}

/**
 * Get a single conversation summary by ID
 */
export async function getConversationById(conversationId: string, userId: string): Promise<ConversationSummary | null> {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      console.error('Error fetching conversation:', error)
      throw new Error(`Failed to fetch conversation: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in getConversationById:', error)
    throw error
  }
}

/**
 * Mark messages as read (for unread count management)
 */
export async function markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    // Get all unread messages for this conversation
    const { data: unreadMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('is_read', false)

    if (fetchError || !unreadMessages || unreadMessages.length === 0) {
      return
    }

    // Mark all unread messages as read
    const messageIds = unreadMessages.map(m => m.id)
    
    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds)

  } catch (error) {
    console.error('Error marking messages as read:', error)
  }
}

/**
 * Mark specific messages as read (for granular read tracking)
 */
export async function markSpecificMessagesAsRead(conversationId: string, userId: string, messageIds: string[]): Promise<void> {
  try {
    if (!messageIds || messageIds.length === 0) return

    // Only mark messages that are currently unread
    const { data: unreadMessages } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .in('id', messageIds)

    if (!unreadMessages || unreadMessages.length === 0) return

    // Mark these specific messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadMessages.map(m => m.id))

  } catch (error) {
    console.error('Error marking specific messages as read:', error)
  }
}

/**
 * Subscribe to real-time conversation updates
 */
export function subscribeToConversations(userId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel('conversations-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages'
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Subscribe to real-time message updates for a specific conversation
 */
export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
  const channel = supabase
    .channel(`messages-${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Get conversation statistics for a user
 */
export async function getConversationStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('message_count')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching conversation stats:', error)
      throw new Error(`Failed to fetch conversation stats: ${error.message}`)
    }

    const totalConversations = data?.length || 0
    const totalMessages = data?.reduce((sum, conv) => sum + (conv.message_count || 0), 0) || 0

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0
    }
  } catch (error) {
    console.error('Error in getConversationStats:', error)
    throw error
  }
}