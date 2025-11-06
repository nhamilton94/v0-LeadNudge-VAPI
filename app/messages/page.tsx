"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ConversationList } from "@/components/messages/conversation-list"
import { ChatInterface } from "@/components/messages/chat-interface"
import { cn } from "@/lib/utils"
import { ConversationWithDetails } from "@/lib/services/conversations-service"
import { useConversations } from "@/lib/hooks/use-conversations"

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null)

  // Debounced search query to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    
    return () => clearTimeout(handler)
  }, [searchInput])

  // Get conversations with stable search query
  const { conversations, isLoading: conversationsLoading, refresh: refreshConversations, updateUnreadCount } = useConversations({
    search: searchQuery,
    limit: 20,
    enableRealtime: true
  })

  const handleConversationSelect = useCallback((conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation)
  }, [])

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value)
    // Don't clear selection immediately - wait for debounced search
  }, [])

  const handleAutoSelectFirst = () => {
    if (conversations.length > 0) {
      setSelectedConversation(conversations[0])
    }
  }

  const handleMessagesRead = () => {
    if (selectedConversation) {
      // Update the conversation list immediately using the local function
      if ((window as any).localUpdateUnreadCount) {
        (window as any).localUpdateUnreadCount(selectedConversation.id!, 0)
      }
    }
  }

  const handleMessageSelect = useCallback(async (conversationId: string, messageId: string, searchResult?: any) => {
    // Find the conversation and select it
    let conversation = conversations.find(c => c.id === conversationId)
    
    if (!conversation) {
      // If conversation not found in current list, create a conversation object with search data
      // The useMessages hook in ChatInterface will load the full conversation details
      conversation = {
        id: conversationId,
        user_id: null,
        contact_id: null,
        phone_number: searchResult?.phone_number || '',
        status: 'active',
        created_at: '',
        updated_at: '',
        botpress_conversation_id: null,
        botpress_user_id: null,
        twilio_conversation_sid: null,
        metadata: null,
        contact_name: searchResult?.conversation_name || null, // Use search data if available
        contact_email: searchResult?.contact_email || null,
        contact_lead_status: null,
        contact_lead_source: null,
        last_message_content: null,
        last_message_at: null,
        message_count: 0,
        unread_count: 0
      }
    }
    
    // Use React 18 batching or ensure proper state update order
    setSelectedConversation(conversation)
    
    // Small delay to ensure conversation selection is processed first
    setTimeout(() => {
      setTargetMessageId(messageId)
    }, 10)
    
    // Clear search when navigating to message
    setSearchInput("")
    setSearchQuery("")
  }, [conversations])

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with conversation list */}
        <div className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
          {/* Search header */}
          <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search conversations and messages..." 
                className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
              />
            </div>
          </div>
          
          {/* Conversation list with scroll */}
              <ConversationList
                selectedConversationId={selectedConversation?.id || null}
                onSelect={handleConversationSelect}
                searchQuery={searchQuery}
                searchInput={searchInput}
                onAutoSelectFirst={handleAutoSelectFirst}
                onUpdateUnreadCount={updateUnreadCount}
                onMessageSelect={handleMessageSelect}
              />
        </div>

        {/* Main chat area */}
        <div className={cn("flex-1", !selectedConversation && "hidden md:block")}>
          {selectedConversation ? (
            <ChatInterface
              conversationId={selectedConversation.id!}
              conversation={selectedConversation}
              targetMessageId={targetMessageId}
              onMessagesRead={handleMessagesRead}
              onMessageNavigated={() => setTargetMessageId(null)}
            />
          ) : conversationsLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">Loading conversations...</h3>
                <p className="text-muted-foreground">
                  Please wait while we load your messages
                </p>
              </div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No conversations found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'No conversations available yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to view messages
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
