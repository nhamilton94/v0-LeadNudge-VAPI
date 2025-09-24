'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/auth/supabase-auth-provider'
import {
  getConversations,
  getMessages,
  getConversationById,
  subscribeToConversations,
  subscribeToMessages,
  type ConversationListParams,
  type ConversationListResponse,
  type MessageListParams,
  type MessageListResponse
} from '@/lib/services/conversations-service'
import { ConversationSummary, Message } from '@/lib/database.types'

interface UseConversationsOptions {
  search?: string
  limit?: number
  orderBy?: 'last_message_at' | 'created_at'
  orderDirection?: 'asc' | 'desc'
  enableRealtime?: boolean
}

interface UseConversationsReturn {
  conversations: ConversationSummary[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  total: number
  page: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  search: (query: string) => void
  searchQuery: string
  updateUnreadCount: (conversationId: string, newCount: number) => void
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const {
    search: initialSearch = '',
    limit = 20,
    orderBy = 'last_message_at',
    orderDirection = 'desc',
    enableRealtime = true
  } = options

  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const fetchConversations = useCallback(async (
    pageNum: number = 1,
    searchTerm: string = searchQuery,
    append: boolean = false
  ) => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const params: ConversationListParams = {
        userId: user.id,
        page: pageNum,
        limit,
        search: searchTerm,
        orderBy,
        orderDirection
      }

      const response: ConversationListResponse = await getConversations(params)

      setConversations(prev => append ? [...prev, ...response.conversations] : response.conversations)
      setHasMore(response.hasMore)
      setTotal(response.total)
      setPage(pageNum)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations'
      setError(errorMessage)
      console.error('Error fetching conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, limit, orderBy, orderDirection, searchQuery])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchConversations(page + 1, searchQuery, true)
  }, [hasMore, isLoading, page, searchQuery, fetchConversations])

  const refresh = useCallback(async () => {
    await fetchConversations(1, searchQuery, false)
  }, [fetchConversations, searchQuery])

  const search = useCallback((query: string) => {
    setSearchQuery(query)
    setPage(1)
    fetchConversations(1, query, false)
  }, [fetchConversations])

  // Initial load
  useEffect(() => {
    if (user?.id) {
      fetchConversations(1, searchQuery, false)
    }
  }, [user?.id, fetchConversations])

  // Real-time subscriptions - disabled for now to avoid recursive calls
  // useEffect(() => {
  //   if (!user?.id || !enableRealtime) return
  //   const unsubscribe = subscribeToConversations(user.id, (payload) => {
  //     // Handle real-time updates here if needed
  //   })
  //   return unsubscribe
  // }, [user?.id, enableRealtime])

  // Function to update unread count for a specific conversation
  const updateUnreadCount = useCallback((conversationId: string, newCount: number) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: newCount } as ConversationSummary & { unread_count: number }
          : conv
      )
    )
  }, [])

  return {
    conversations,
    isLoading,
    error,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
    search,
    searchQuery,
    updateUnreadCount
  }
}

interface UseMessagesOptions {
  conversationId?: string
  limit?: number
  orderBy?: 'created_at'
  orderDirection?: 'asc' | 'desc'
  enableRealtime?: boolean
}

interface UseMessagesReturn {
  messages: Message[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  total: number
  page: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  conversation: ConversationSummary | null
  loadAllMessagesForNavigation: (targetMessageId: string) => Promise<boolean>
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const {
    conversationId,
    limit = 50,
    orderBy = 'created_at',
    orderDirection = 'asc',
    enableRealtime = true
  } = options

  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<ConversationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const fetchMessages = useCallback(async (
    pageNum: number = 1,
    append: boolean = false
  ) => {
    if (!conversationId || !user?.id) return

    setIsLoading(true)
    setError(null)

    try {
      const params: MessageListParams = {
        conversationId,
        page: pageNum,
        limit,
        orderBy,
        orderDirection
      }

      const response: MessageListResponse = await getMessages(params)

      setMessages(prev => {
        if (append) {
          // For infinite scroll (loading older messages), add to the BEGINNING
          return [...response.messages, ...prev]
        } else {
          // For initial load, replace entirely
          return response.messages
        }
      })
      setHasMore(response.hasMore)
      setTotal(response.total)
      setPage(pageNum)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages'
      setError(errorMessage)
      console.error('Error fetching messages:', err)
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, user?.id, limit, orderBy, orderDirection])

  const fetchConversation = useCallback(async () => {
    if (!conversationId || !user?.id) return

    try {
      const conv = await getConversationById(conversationId, user.id)
      setConversation(conv)
    } catch (err) {
      console.error('Error fetching conversation:', err)
    }
  }, [conversationId, user?.id])

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await fetchMessages(page + 1, true)
  }, [hasMore, isLoading, page, fetchMessages])

  const refresh = useCallback(async () => {
    await fetchMessages(1, false)
  }, [fetchMessages])

  // Load conversation and messages when conversationId changes
  useEffect(() => {
    if (conversationId && user?.id) {
      fetchConversation()
      fetchMessages(1, false)
    } else {
      setMessages([])
      setConversation(null)
      setPage(1)
    }
  }, [conversationId, user?.id, fetchConversation, fetchMessages])

  // Load all messages for navigation to specific message
  const loadAllMessagesForNavigation = useCallback(async (targetMessageId: string): Promise<boolean> => {
    if (!conversationId || !user?.id) return false

    try {
      setIsLoading(true)
      setError(null)

      // Load all messages in chronological order
      const result = await getMessages({
        conversationId,
        userId: user.id,
        page: 1,
        limit: 1000, // Load a large number to get all messages
        orderBy: 'created_at',
        orderDirection: 'asc'
      })

      if (result.messages) {
        setMessages(result.messages)
        setTotal(result.total)
        setHasMore(false) // No more pages needed since we loaded all
        setPage(1)
        
        // Check if target message exists
        const targetExists = result.messages.some(msg => msg.id === targetMessageId)
        return targetExists
      }

      return false
    } catch (err) {
      console.error('Error loading all messages for navigation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [conversationId, user?.id])

  // Real-time subscriptions
  useEffect(() => {
    if (!conversationId || !enableRealtime) return

    const unsubscribe = subscribeToMessages(conversationId, (payload) => {
      console.log('Real-time message update:', payload)
      // Refresh messages when there are changes
      refresh()
    })

    return unsubscribe
  }, [conversationId, enableRealtime, refresh])

  return {
    messages,
    isLoading,
    error,
    hasMore,
    total,
    page,
    loadMore,
    refresh,
    conversation,
    loadAllMessagesForNavigation
  }
}