import { supabase } from '@/lib/supabase/client'
import { Database, Message } from '@/lib/database.types'

// New type for conversation with real-time data from base tables
export interface ConversationWithDetails {
  // Base conversation fields
  id: string
  user_id: string | null
  contact_id: string | null
  phone_number: string
  status: string
  created_at: string
  updated_at: string
  botpress_conversation_id: string | null
  botpress_user_id: string | null
  twilio_conversation_sid: string | null
  metadata: any
  
  // Contact fields (joined)
  contact_name: string | null
  contact_email: string | null
  contact_lead_status: string | null
  contact_lead_source: string | null
  
  // Latest message fields (calculated)
  last_message_content: string | null
  last_message_at: string | null
  message_count: number
  unread_count: number
}

export interface ConversationListParams {
  userId: string
  page?: number
  limit?: number
  search?: string
  orderBy?: 'last_message_at' | 'created_at'
  orderDirection?: 'asc' | 'desc'
}

export interface ConversationListResponse {
  conversations: ConversationWithDetails[]
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
    // Build the query using base conversations table with joins
    let query = supabase
      .from('conversations')
      .select(`
        *,
        contacts (
          name,
          email,
          lead_status,
          lead_source
        )
      `, { count: 'exact' })
      .eq('user_id', userId)

    // Add search filter if provided - search in conversation phone and joined contact fields
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`
      query = query.or(`phone_number.ilike.${searchTerm},contacts.name.ilike.${searchTerm},contacts.email.ilike.${searchTerm}`)
    }

    // Add pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: conversationsData, error: conversationsError, count } = await query

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError)
      throw new Error(`Failed to fetch conversations: ${conversationsError.message}`)
    }

    const conversations = conversationsData || []
    const conversationIds = conversations.map(c => c.id)

    // Get latest message info for each conversation in a single query
    let latestMessages: Record<string, { content: string, created_at: string }> = {}
    let messageCounts: Record<string, number> = {}
    let unreadCounts: Record<string, number> = {}

    if (conversationIds.length > 0) {
      // Get latest message for each conversation using a more reliable approach
      const latestMessagePromises = conversationIds.map(async (conversationId) => {
        const { data, error } = await supabase
          .from('messages')
          .select('conversation_id, content, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (error || !data) return null
        
        return {
          conversation_id: conversationId,
          content: data.content,
          created_at: data.created_at
        }
      })

      const latestMsgResults = await Promise.all(latestMessagePromises)
      
      latestMsgResults.forEach(result => {
        if (result) {
          latestMessages[result.conversation_id] = {
            content: result.content,
            created_at: result.created_at
          }
        }
      })

      // Get message counts for each conversation
      const { data: msgCountData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)

      if (msgCountData) {
        messageCounts = msgCountData.reduce((acc, msg) => {
          acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }

      // Get unread counts for each conversation
      const { data: unreadData } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('is_read', false)

      if (unreadData) {
        unreadCounts = unreadData.reduce((acc, msg) => {
          acc[msg.conversation_id] = (acc[msg.conversation_id] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      }
    }

    // Transform the data to match our interface
    const conversationsWithDetails: ConversationWithDetails[] = conversations.map(conv => ({
      id: conv.id,
      user_id: conv.user_id,
      contact_id: conv.contact_id,
      phone_number: conv.phone_number,
      status: conv.status,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      botpress_conversation_id: conv.botpress_conversation_id,
      botpress_user_id: conv.botpress_user_id,
      twilio_conversation_sid: conv.twilio_conversation_sid,
      metadata: conv.metadata,
      
      // Contact fields from joined data
      contact_name: (conv.contacts as any)?.name || null,
      contact_email: (conv.contacts as any)?.email || null,
      contact_lead_status: (conv.contacts as any)?.lead_status || null,
      contact_lead_source: (conv.contacts as any)?.lead_source || null,
      
      // Latest message fields (always fresh)
      last_message_content: latestMessages[conv.id]?.content || null,
      last_message_at: latestMessages[conv.id]?.created_at || null,
      message_count: messageCounts[conv.id] || 0,
      unread_count: unreadCounts[conv.id] || 0
    }))

    // Sort by the requested field
    conversationsWithDetails.sort((a, b) => {
      let aValue = orderBy === 'last_message_at' ? a.last_message_at : a.created_at
      let bValue = orderBy === 'last_message_at' ? b.last_message_at : b.created_at
      
      // Handle null values - put them last
      if (!aValue && !bValue) return 0
      if (!aValue) return 1
      if (!bValue) return -1
      
      const comparison = new Date(aValue).getTime() - new Date(bValue).getTime()
      return orderDirection === 'desc' ? -comparison : comparison
    })

    const total = count || 0
    const hasMore = (page - 1) * limit + conversationsWithDetails.length < total

    return {
      conversations: conversationsWithDetails,
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
    // First, get total count
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    const total = count || 0
    
    // For chat interface, implement reverse pagination
    // Page 1 should get the LATEST messages, Page 2 should get older messages
    let from: number
    let to: number
    
    if (orderDirection === 'asc') {
      // Calculate offset from the end for reverse pagination
      const offsetFromEnd = (page - 1) * limit
      from = Math.max(0, total - limit - offsetFromEnd)
      to = Math.max(limit - 1, total - 1 - offsetFromEnd)
    } else {
      // Regular pagination for DESC order
      from = (page - 1) * limit
      to = from + limit - 1
    }

    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)

    // Add ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    // Add pagination
    query = query.range(from, to)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      throw new Error(`Failed to fetch messages: ${error.message}`)
    }

    const hasMore = orderDirection === 'asc' ? from > 0 : from + limit < total

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
export async function getConversationById(conversationId: string, userId: string): Promise<ConversationWithDetails | null> {
  try {
    const { data: conversationData, error } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts (
          name,
          email,
          lead_status,
          lead_source
        )
      `)
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

    // Get latest message info for this conversation
    const { data: latestMsgData } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get message count
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)

    // Transform to ConversationWithDetails
    const result: ConversationWithDetails = {
      id: conversationData.id,
      user_id: conversationData.user_id,
      contact_id: conversationData.contact_id,
      phone_number: conversationData.phone_number,
      status: conversationData.status,
      created_at: conversationData.created_at,
      updated_at: conversationData.updated_at,
      botpress_conversation_id: conversationData.botpress_conversation_id,
      botpress_user_id: conversationData.botpress_user_id,
      twilio_conversation_sid: conversationData.twilio_conversation_sid,
      metadata: conversationData.metadata,
      
      // Contact fields from joined data
      contact_name: (conversationData.contacts as any)?.name || null,
      contact_email: (conversationData.contacts as any)?.email || null,
      contact_lead_status: (conversationData.contacts as any)?.lead_status || null,
      contact_lead_source: (conversationData.contacts as any)?.lead_source || null,
      
      // Latest message fields
      last_message_content: latestMsgData?.content || null,
      last_message_at: latestMsgData?.created_at || null,
      message_count: messageCount || 0,
      unread_count: unreadCount || 0
    }

    return result
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