"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Phone, User, MessageCircle, Mail, MapPin, Tag, Briefcase } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useMessages } from "@/lib/hooks/use-conversations"
import { Message } from "@/lib/database.types"
import { ConversationWithDetails } from "@/lib/services/conversations-service"
import { markSpecificMessagesAsRead } from "@/lib/services/conversations-service"
import { getContactByConversationId } from "@/lib/services/contacts-service"
import { ContactWithDetails } from "@/types/contact"
import { useAuth } from "@/components/auth/supabase-auth-provider"
import { supabase } from "@/utils/supabase/client"

interface ChatInterfaceProps {
  conversationId: string
  conversation: ConversationWithDetails
  targetMessageId?: string | null
  onMessagesRead?: () => void
  onMessageNavigated?: () => void
}

export function ChatInterface({ conversationId, conversation, targetMessageId, onMessagesRead, onMessageNavigated }: ChatInterfaceProps) {
  const { user } = useAuth()
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [previousConversationId, setPreviousConversationId] = useState<string | null>(null)
  const [contactDetails, setContactDetails] = useState<ContactWithDetails | null>(null)
  const [isLoadingContact, setIsLoadingContact] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [propertyDetails, setPropertyDetails] = useState<{id: string, address: string, city?: string, state?: string} | null>(null)

  const {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    loadAllMessagesForNavigation,
    conversation: fetchedConversation
  } = useMessages({
    conversationId,
    limit: 50,
    enableRealtime: true
  })

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Handle conversation changes and initial load
  useEffect(() => {
    if (conversationId !== previousConversationId) {
      setIsInitialLoad(true)
      setPreviousConversationId(conversationId)
    }
  }, [conversationId, previousConversationId])

  // Handle message navigation when targetMessageId is provided
  useEffect(() => {
    if (targetMessageId && conversationId) {
      const navigateToMessage = async () => {
        // Wait for messages to load if not already loaded
        if (isLoading || messages.length === 0) {
          setTimeout(() => navigateToMessage(), 100)
          return
        }
        // First, check if the target message is already loaded
        const targetElement = document.querySelector(`[data-message-id="${targetMessageId}"]`)
        
        if (targetElement) {
          // Message is already loaded, scroll to it
          scrollToTargetMessage(targetElement)
        } else {
          // Message not loaded, load all messages to find it
          const found = await loadAllMessagesForNavigation(targetMessageId)
          
          if (found) {
            // Wait for DOM update, then scroll to the target
            setTimeout(() => {
              const newTargetElement = document.querySelector(`[data-message-id="${targetMessageId}"]`)
              if (newTargetElement) {
                scrollToTargetMessage(newTargetElement)
              }
            }, 200)
          }
        }
      }

      navigateToMessage()
    }
  }, [targetMessageId, conversationId, isLoading, messages.length, loadAllMessagesForNavigation, onMessageNavigated])
    conversation: fetchedConversation

  // Helper function to scroll to target message (instant, no animation)
  const scrollToTargetMessage = (targetElement: Element) => {
    targetElement.scrollIntoView({ behavior: "instant", block: "center" })
    
    if (onMessageNavigated) onMessageNavigated()
  }

  // Handle scrolling after messages load (for normal cases)
  const previousMessageCount = useRef(messages.length)
  
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad && !isLoading && !targetMessageId) {
      // For initial load or conversation switch without target message - no delay
      scrollToBottom("instant")
      setIsInitialLoad(false)
      previousMessageCount.current = messages.length
    }
    // DISABLED: Auto-scroll to bottom for new messages (was causing scroll issues during infinite scroll)
  }, [messages, isInitialLoad, isLoading, targetMessageId, isLoadingMore])

  // Reset initial load state when conversation changes but no messages yet
  useEffect(() => {
    if (conversationId && messages.length === 0 && !isLoading) {
      // If we switched conversations but no messages loaded yet, keep initial load true
      // This will be handled by the above effect once messages load
    }
  }, [conversationId, messages.length, isLoading])

  // Track which messages have already been marked as read to prevent duplicate API calls
  const markedAsReadRef = useRef<Set<string>>(new Set())
  const messagesRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const markReadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Reset marked messages when conversation changes
  useEffect(() => {
    markedAsReadRef.current.clear()
  }, [conversationId])
  
  // Intersection Observer to track which messages are visible
  useEffect(() => {
    if (!conversationId || !user?.id || messages.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const newlyVisibleMessages = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target.getAttribute('data-message-id'))
          .filter(Boolean)
          .filter((messageId): messageId is string => {
            // Skip if messageId is null
            if (!messageId) return false
            // Skip if already processed
            if (markedAsReadRef.current.has(messageId)) return false
            
            // Skip if message is already read in database
            const message = messages.find(m => m.id === messageId)
            return message ? !(message as any).is_read : false
          })

        if (newlyVisibleMessages.length > 0) {
          // Add to marked set immediately to prevent duplicate calls
          newlyVisibleMessages.forEach(id => {
            if (id) markedAsReadRef.current.add(id)
          })
          
          // Debounce the API call
          if (markReadTimeoutRef.current) {
            clearTimeout(markReadTimeoutRef.current)
          }
          
          markReadTimeoutRef.current = setTimeout(() => {
            markVisibleMessagesAsRead(conversationId, user.id, newlyVisibleMessages.filter((id): id is string => Boolean(id)))
          }, 500) // 500ms debounce
        }
      },
      {
        threshold: 0.7, // Message is considered "read" when 70% visible (more strict)
        rootMargin: '0px 0px -50px 0px' // Only trigger when message is well within viewport
      }
    )

    // Observe all message elements
    Object.values(messagesRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => {
      observer.disconnect()
      if (markReadTimeoutRef.current) {
        clearTimeout(markReadTimeoutRef.current)
      }
    }
  }, [conversationId, user?.id, messages])

  // Function to mark specific messages as read
  const markVisibleMessagesAsRead = async (convId: string, userId: string, messageIds: string[]) => {
    try {
      await markSpecificMessagesAsRead(convId, userId, messageIds)
      if (onMessagesRead) {
        onMessagesRead()
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
      // Remove from marked set if API call failed so it can be retried
      messageIds.forEach(id => markedAsReadRef.current.delete(id))
    }
  }

  const handleCall = () => {
    if (conversation.phone_number) {
      window.location.href = `tel:${conversation.phone_number}`
    }
  }

  // Fetch contact details when contact modal opens
  const handleContactModalOpen = useCallback(async () => {
    setIsContactOpen(true)
    
    if (!contactDetails && !isLoadingContact) {
      setIsLoadingContact(true)
      try {
        const contact = await getContactByConversationId(conversationId)
        setContactDetails(contact)
        
        // Fetch property details if contact has interested_property
        if (contact?.interested_property && !propertyDetails) {
          await fetchPropertyDetails(contact.interested_property)
        }
      } catch (error) {
        console.error('Error fetching contact details:', error)
      } finally {
        setIsLoadingContact(false)
      }
    }
  }, [conversationId, contactDetails, isLoadingContact, propertyDetails])

  // Fetch property details
  const fetchPropertyDetails = async (propertyId: string) => {
    try {
      if (!user?.id) {
        console.warn('User not authenticated, cannot fetch property details')
        return
      }

      // Check if user has access to this property
      const { data: assignment, error: assignmentError } = await supabase
        .from('property_assignments')
        .select('property_id')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .single()

      if (assignmentError || !assignment) {
        console.warn('Property not found or access denied:', propertyId)
        // Fallback to showing property ID
        setPropertyDetails({
          id: propertyId,
          address: `Property ${propertyId}`,
          city: '',
          state: ''
        })
        return
      }

      // Fetch property details
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id, address, city, state')
        .eq('id', propertyId)
        .single()

      if (propertyError || !property) {
        console.error('Error fetching property details:', propertyError)
        // Fallback to showing property ID
        setPropertyDetails({
          id: propertyId,
          address: `Property ${propertyId}`,
          city: '',
          state: ''
        })
        return
      }

      setPropertyDetails({
        id: property.id,
        address: property.address,
        city: property.city,
        state: property.state
      })
    } catch (error) {
      console.error('Error fetching property details:', error)
      // Fallback to showing property ID
      setPropertyDetails({
        id: propertyId,
        address: `Property ${propertyId}`,
        city: '',
        state: ''
      })
    }
  }

  // Handle property link click
  const handlePropertyClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (contactDetails?.interested_property) {
      router.push(`/properties/${contactDetails.interested_property}`)
    }
  }

  // Reset contact details when conversation changes
  useEffect(() => {
    if (conversationId !== previousConversationId) {
      setContactDetails(null)
      setPropertyDetails(null)
      previousMessageCount.current = 0 // Reset message count tracking
    }
  }, [conversationId, previousConversationId])

  // Infinite scroll for loading older messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container || !hasMore || isLoadingMore) return

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      
      // Load more when user scrolls close to the top (100px threshold)
      if (scrollTop < 100 && !isLoadingMore && hasMore) {
        setIsLoadingMore(true)
        
        // Store scroll position BEFORE loading
        const oldScrollHeight = scrollHeight
        const oldScrollTop = scrollTop
        
        try {
          // Set up observer to detect DOM changes and adjust scroll immediately
          const observer = new MutationObserver(() => {
            const newScrollHeight = container.scrollHeight
            const heightDifference = newScrollHeight - oldScrollHeight
            
            if (heightDifference > 0) {
              // Instantly adjust scroll position to prevent any visual movement
              container.scrollTop = oldScrollTop + heightDifference
              observer.disconnect() // Stop observing once we've adjusted
            }
          })
          
          // Start observing DOM changes
          observer.observe(container, { 
            childList: true, 
            subtree: true 
          })
          
          await loadMore()
          
          // Fallback: disconnect observer after a short time
          setTimeout(() => {
            observer.disconnect()
            // Final adjustment in case observer didn't catch it
            const newScrollHeight = container.scrollHeight
            const heightDifference = newScrollHeight - oldScrollHeight
            if (heightDifference > 0) {
              container.scrollTop = oldScrollTop + heightDifference
            }
          }, 100)
          
          // Update message count tracking
          previousMessageCount.current = messages.length
          
        } catch (error) {
          console.error('Error loading more messages:', error)
        } finally {
          setIsLoadingMore(false)
        }
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoadingMore, loadMore])

  // Smart timestamp formatting for messages
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    
    // Start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Start of yesterday
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    
    // Start of this week (Sunday)
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    // Start of this year
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    const timeFormat = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    // Today - show only time
    if (date >= startOfToday) {
      return timeFormat
    }
    
    // Yesterday - show "Yesterday" + time
    if (date >= startOfYesterday) {
      return `Yesterday ${timeFormat}`
    }
    
    // This week - show day + time
    if (date >= startOfWeek) {
      const dateFormat = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      return `${dateFormat}, ${timeFormat}`
    }
    
    // This year - show month/day + time
    if (date >= startOfYear) {
      const monthDay = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
      return `${monthDay}, ${timeFormat}`
    }
    
    // Previous years - show full date + time
    const fullDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
    return `${fullDate}, ${timeFormat}`
  }, [])

  // Get contact initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Mock contact details for the sheet (to be replaced with real contact data)
  const mockContactDetails = {
    id: 1,
    name: (fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).contact_name || 'Unknown Contact',
    image: `https://api.dicebear.com/7.x/initials/svg?seed=${(fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).contact_name}`,
    status: 'online',
    title: 'Potential Tenant',
    email: conversation.contact_email || '',
    phone: conversation.phone_number || '',
    linkedin: '',
    industry: '',
    leadSource: 'Chatbot',
    leadStatus: 'Active'
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar>
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${(fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).contact_name}`} 
                alt={(fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).contact_name || 'Contact'} 
              />
              <AvatarFallback>
                {getInitials((fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).contact_name)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          </div>
          <div>
            <div className="font-semibold">{(fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).contact_name || 'Unknown Contact'}</div>
            <div className="text-sm text-muted-foreground">
              {(fetchedConversation && fetchedConversation.id === conversationId ? fetchedConversation : conversation).phone_number || 'No phone number'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={isContactOpen} onOpenChange={setIsContactOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleContactModalOpen}>
                <User className="h-4 w-4" />
                <span className="sr-only">View contact details</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Contact Information</SheetTitle>
                <SheetDescription className="sr-only">
                  Contact details and information
                </SheetDescription>
              </SheetHeader>
              <div className="h-full">
                {isLoadingContact ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span className="text-sm text-muted-foreground">Loading contact details...</span>
                    </div>
                  </div>
                ) : contactDetails ? (
                  <div className="space-y-8 py-4">
                    {/* Header with Avatar and Actions */}
                    <div className="flex items-center gap-4 pb-6 border-b">
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={contactDetails.image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${contactDetails.name}`} 
                          alt={contactDetails.name || 'Contact'} 
                        />
                        <AvatarFallback className="text-xl">
                          {getInitials(contactDetails.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl mb-2">{contactDetails.name}</h3>
                        {contactDetails.title && (
                          <p className="text-muted-foreground text-base mb-4">{contactDetails.title}</p>
                        )}
                        <div className="flex gap-3">
                          {contactDetails.phone && (
                            <Button 
                              size="default" 
                              variant="outline" 
                              onClick={() => window.location.href = `tel:${contactDetails.phone}`}
                              className="flex items-center gap-2"
                            >
                              <Phone className="h-4 w-4" />
                              Call
                            </Button>
                          )}
                          {contactDetails.email && (
                            <Button 
                              size="default" 
                              variant="outline" 
                              onClick={() => window.location.href = `mailto:${contactDetails.email}`}
                              className="flex items-center gap-2"
                            >
                              <Mail className="h-4 w-4" />
                              Email
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <User className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-lg">Contact Details</h4>
                      </div>
                      <div className="space-y-3 pl-8">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium min-w-[70px]">Email:</span>
                          <span className="break-all">{contactDetails.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium min-w-[70px]">Phone:</span>
                          <span>{contactDetails.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Information */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-lg">Professional</h4>
                      </div>
                      <div className="space-y-3 pl-8">
                        {contactDetails.industry && (
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-muted-foreground min-w-[80px]">Industry:</span>
                            <Badge variant="secondary" className="text-sm">{contactDetails.industry}</Badge>
                          </div>
                        )}
                        {contactDetails.linkedin && (
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-muted-foreground min-w-[80px]">LinkedIn:</span>
                            <a 
                              href={contactDetails.linkedin.startsWith('http') ? contactDetails.linkedin : `https://${contactDetails.linkedin}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View Profile
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lead Status */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Tag className="h-5 w-5 text-primary" />
                        <h4 className="font-medium text-lg">Lead Status</h4>
                      </div>
                      <div className="space-y-3 pl-8">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-muted-foreground min-w-[70px]">Status:</span>
                          <Badge variant={
                            contactDetails.lead_status === 'closed' ? 'default' :
                            contactDetails.lead_status === 'negotiating' || contactDetails.lead_status === 'contract sent' ? 'secondary' :
                            contactDetails.lead_status === 'lost' ? 'destructive' :
                            'outline'
                          } className="text-sm">
                            {contactDetails.lead_status || 'Unknown'}
                          </Badge>
                        </div>
                        {contactDetails.lead_source && (
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-muted-foreground min-w-[70px]">Source:</span>
                            <Badge variant="outline" className="text-sm">{contactDetails.lead_source}</Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Interest */}
                    {contactDetails.interested_property && (
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <MapPin className="h-5 w-5 text-primary" />
                          <h4 className="font-medium text-lg">Interested Property</h4>
                        </div>
                        <div className="pl-8">
                          <button
                            onClick={handlePropertyClick}
                            className="text-primary hover:underline text-sm font-medium inline-flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
                          >
                            <MapPin className="h-4 w-4" />
                            {propertyDetails 
                              ? `${propertyDetails.address}${propertyDetails.city ? `, ${propertyDetails.city}` : ''}${propertyDetails.state ? `, ${propertyDetails.state}` : ''}`
                              : `Property ${contactDetails.interested_property}`
                            }
                          </button>
                          <p className="text-xs text-muted-foreground mt-1">
                            Click to view property details
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="mb-4">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2">Contact Not Found</h3>
                      <p className="text-muted-foreground text-sm">
                        Unable to load contact details for this conversation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

        {/* Messages area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-6 relative"
        >

            {/* Loading overlay for conversation switches */}
            {(isInitialLoad && isLoading) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Loading conversation...</p>
                </div>
              </div>
            )}
        {error && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <p className="text-sm text-destructive mb-2">Failed to load messages</p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try again
              </Button>
            </div>
          </div>
        )}

            {isLoading && messages.length === 0 && !isInitialLoad && (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className={cn("h-12", i % 2 === 0 ? "w-48" : "w-40")} />
                    </div>
                  </div>
                ))}
              </div>
            )}

        {messages.length > 0 && (
          <div className={cn(
            "space-y-2 transition-opacity duration-300",
            isInitialLoad && isLoading ? "opacity-0" : "opacity-100"
          )}>
            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading older messages...
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => {
              const isUnread = !(message as any).is_read
              const showUnreadLine = isUnread && index > 0 && (messages[index - 1] as any).is_read
              
              return (
                <div key={message.id}>
                  {/* Unread messages separator (like Slack) */}
                  {showUnreadLine && (
                    <div className="flex items-center gap-2 my-4">
                      <div className="flex-1 h-px bg-red-500"></div>
                      <span className="text-xs font-medium text-red-500 bg-background px-2">
                        New messages
                      </span>
                      <div className="flex-1 h-px bg-red-500"></div>
                    </div>
                  )}

                  
                  <div
                    ref={(el) => { messagesRefs.current[message.id] = el }}
                    data-message-id={message.id}
                    className={cn(
                      "flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-4", 
                      message.direction === "outbound" ? "items-end" : "items-start",
                      isUnread && "relative"
                    )}
                    style={{ 
                      animationDelay: isInitialLoad ? `${Math.min(index * 50, 500)}ms` : '0ms',
                      animationFillMode: 'both'
                    }}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && message.direction === "inbound" && (
                      <div className="absolute -left-2 top-2 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                        message.direction === "outbound"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white dark:bg-gray-800 text-foreground border border-gray-200 dark:border-gray-700"
                      )}
                    >
                      {message.content}
                    </div>
                    <span className={cn(
                      "text-xs text-muted-foreground px-2",
                      message.direction === "outbound" ? "text-right" : "text-left"
                    )}>
                      {formatTimestamp(message.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {messages.length === 0 && !isLoading && !error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">No messages yet</h3>
              <p className="text-muted-foreground text-sm">
                This conversation doesn't have any messages.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Message input - Read-only for now as requested */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <MessageCircle className="h-4 w-4" />
          <span>This is a read-only view of the conversation between the tenant and chatbot.</span>
        </div>
      </div>
    </div>
  )
}
