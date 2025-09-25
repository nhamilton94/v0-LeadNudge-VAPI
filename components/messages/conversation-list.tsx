"use client"

import { useEffect, useRef, useCallback, memo, useMemo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useConversations } from "@/lib/hooks/use-conversations"
import { useSearch } from "@/lib/hooks/use-search"
import { ConversationWithDetails } from "@/lib/services/conversations-service"
import { MessageSquare, User } from "lucide-react"

interface ConversationListProps {
  selectedConversationId: string | null
  onSelect: (conversation: ConversationWithDetails) => void
  searchQuery: string
  searchInput: string
  onAutoSelectFirst?: () => void
  onUpdateUnreadCount?: (conversationId: string, count: number) => void
  onMessageSelect?: (conversationId: string, messageId: string, searchResult?: any) => void
}

export const ConversationList = memo(function ConversationList({ 
  selectedConversationId, 
  onSelect, 
  searchQuery,
  searchInput,
  onAutoSelectFirst,
  onUpdateUnreadCount,
  onMessageSelect
}: ConversationListProps) {
  // Use search when there's a query, otherwise use normal conversations
  const isSearching = searchQuery.trim().length > 0
  
  const {
    conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
    hasMore: conversationsHasMore,
    total: conversationsTotal,
    loadMore: loadMoreConversations,
    refresh,
    search,
    updateUnreadCount: localUpdateUnreadCount
  } = useConversations({
    search: isSearching ? '' : '', // Don't search in conversations hook when using search service
    limit: 20,
    enableRealtime: true
  })

  const {
    results: searchResults,
    isLoading: searchLoading,
    error: searchError,
    total: searchTotal,
    hasMore: searchHasMore,
    loadMore: loadMoreSearch,
    clearResults: clearSearchResults
  } = useSearch({
    query: searchQuery,
    enabled: isSearching,
    limit: 50
  })

  // Clear search results when switching back to normal conversations
  useEffect(() => {
    if (!isSearching && searchResults.length > 0) {
      clearSearchResults()
    }
  }, [isSearching, searchResults.length, clearSearchResults])

  // Determine which data to use
  const isLoading = isSearching ? searchLoading : conversationsLoading
  const error = isSearching ? searchError : conversationsError
  const hasMore = isSearching ? searchHasMore : conversationsHasMore
  const total = isSearching ? searchTotal : conversationsTotal
  const loadMore = isSearching ? loadMoreSearch : loadMoreConversations

  // Expose the local updateUnreadCount function to parent
  useEffect(() => {
    if (onUpdateUnreadCount) {
      onUpdateUnreadCount('_setup_', 0) // Signal that we're ready
      // Store the local function globally so parent can call it
      ;(window as any).localUpdateUnreadCount = localUpdateUnreadCount
    }
  }, [localUpdateUnreadCount, onUpdateUnreadCount])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Auto-select first result when not searching and conversations load
  useEffect(() => {
    if (!isSearching && conversations.length > 0 && !selectedConversationId && !searchQuery && onAutoSelectFirst) {
      // Find first conversation without unread messages, or fallback to first conversation
      const conversationToSelect = conversations.find(conv => !(conv as any).unread_count) || conversations[0]
      onAutoSelectFirst()
    }
  }, [conversations, selectedConversationId, searchQuery, onAutoSelectFirst, isSearching])

  // Handle conversation selection from search results
  const handleSearchResultSelect = useCallback((result: any) => {
    if (result.type === 'conversation') {
      // Find the full conversation object or create a minimal one
      const conversation: ConversationWithDetails = {
        id: result.conversation_id,
        user_id: '', // Will be filled by the parent
        contact_id: null,
        phone_number: result.phone_number,
        status: 'active',
        created_at: '',
        updated_at: '',
        botpress_conversation_id: null,
        botpress_user_id: null,
        twilio_conversation_sid: null,
        metadata: null,
        contact_name: result.conversation_name,
        contact_email: result.contact_email,
        contact_lead_status: null,
        contact_lead_source: null,
        last_message_content: null,
        last_message_at: null,
        message_count: 0,
        unread_count: 0
      }
      onSelect(conversation)
    } else if (result.type === 'message' && onMessageSelect) {
      // Handle message selection - navigate to specific message with search result data
      onMessageSelect(result.conversation_id, result.message_id!, result)
    }
  }, [onSelect, onMessageSelect])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoading || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const scrollThreshold = 100 // Load more when 100px from bottom

    if (scrollHeight - scrollTop - clientHeight < scrollThreshold) {
      loadMore()
    }
  }, [isLoading, hasMore, loadMore])

  // Attach scroll listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll)
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Format timestamp for display - memoized for performance
  const formatTimestamp = useCallback((timestamp: string | null) => {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }, [])

  // Get contact initials for avatar fallback - memoized for performance
  const getInitials = useCallback((name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }, [])

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Failed to load conversations</p>
        <button 
          onClick={refresh}
          className="text-xs text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // Empty state
  if (!isLoading && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">
          {searchQuery ? 'No conversations found' : 'No conversations yet'}
        </p>
      </div>
    )
  }

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Loading skeletons for initial load */}
      {isLoading && conversations.length === 0 && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </>
      )}

          {/* Results list - either conversations or search results */}
          {isSearching ? (
            // Search results
            searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.conversation_id}-${result.message_id || index}`}
                className={cn(
                  "flex w-full items-start gap-3 p-3 text-left transition-all duration-200 hover:bg-white dark:hover:bg-slate-700 relative rounded-lg mx-2 my-1 min-w-0",
                  selectedConversationId === result.conversation_id && "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 shadow-md hover:bg-blue-50/80 dark:hover:bg-blue-900/40",
                )}
                onClick={() => handleSearchResultSelect(result)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${result.conversation_name}`} 
                      alt={result.conversation_name || 'Contact'} 
                    />
                    <AvatarFallback>
                      {getInitials(result.conversation_name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Result type indicator */}
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background flex items-center justify-center",
                    result.type === 'conversation' ? "bg-blue-500" : "bg-green-500"
                  )}>
                    {result.type === 'conversation' ? (
                      <User className="h-2 w-2 text-white" />
                    ) : (
                      <MessageSquare className="h-2 w-2 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "truncate",
                      selectedConversationId === result.conversation_id ? "font-semibold" : "font-medium"
                    )}>
                      {result.conversation_name || 'Unknown Contact'}
                    </span>
                    {result.message_timestamp && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTimestamp(result.message_timestamp)}
                      </span>
                    )}
                  </div>
                  
                  {result.type === 'message' ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {result.message_direction === 'inbound' ? 'Received' : 'Sent'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Message
                        </Badge>
                      </div>
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: (result.match_snippet || result.message_content || '').replace(
                            /<mark>/g, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">'
                          )
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs">
                        Contact
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Match in contact name
                      </p>
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            // Regular conversations
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                className={cn(
                  "flex w-full items-start gap-3 p-3 text-left transition-all duration-200 hover:bg-white dark:hover:bg-slate-700 relative rounded-lg mx-2 my-1 min-w-0",
                  selectedConversationId === conversation.id && "bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 shadow-md hover:bg-blue-50/80 dark:hover:bg-blue-900/40",
                )}
                onClick={() => onSelect(conversation)}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.contact_name}`} 
                      alt={conversation.contact_name || 'Contact'} 
                    />
                    <AvatarFallback>
                      {getInitials(conversation.contact_name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status indicator - could be enhanced with real status */}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                </div>
                
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "truncate",
                      selectedConversationId === conversation.id ? "font-semibold" : "font-medium"
                    )}>
                      {conversation.contact_name || 'Unknown Contact'}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatTimestamp(conversation.last_message_at)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {conversation.last_message_content || 'No messages yet'}
                  </p>
                  
                  {/* Show message count and unread indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {conversation.message_count || 0} messages
                    </span>
                  </div>
                </div>
                
                {/* Unread indicator */}
                {(conversation as any).unread_count > 0 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {(conversation as any).unread_count > 99 ? '99+' : (conversation as any).unread_count}
                  </div>
                )}
              </button>
            ))
          )}

      {/* Loading more indicator */}
      {isLoading && conversations.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-sm text-muted-foreground">Loading more...</span>
          </div>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && conversations.length > 0 && (
        <div className="flex items-center justify-center p-4">
          <span className="text-xs text-muted-foreground">
            Showing all {total} conversations
          </span>
        </div>
      )}
    </div>
  )
})
