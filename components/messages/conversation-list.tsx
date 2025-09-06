"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Contact {
  id: number
  name: string
  image: string
  status: "online" | "offline"
}

interface Conversation {
  id: number
  contact: Contact
  lastMessage: {
    text: string
    timestamp: string
  }
  unread: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelect: (conversation: Conversation) => void
}

export function ConversationList({ conversations, selectedConversation, onSelect }: ConversationListProps) {
  return (
    <div className="divide-y">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          className={cn(
            "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50",
            selectedConversation?.id === conversation.id && "bg-muted",
          )}
          onClick={() => onSelect(conversation)}
        >
          <div className="relative">
            <Avatar>
              <AvatarImage src={conversation.contact.image} alt={conversation.contact.name} />
              <AvatarFallback>{conversation.contact.name[0]}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                conversation.contact.status === "online" ? "bg-green-500" : "bg-muted",
              )}
            />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{conversation.contact.name}</span>
              <span className="text-xs text-muted-foreground">{conversation.lastMessage.timestamp}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{conversation.lastMessage.text}</p>
          </div>
          {conversation.unread > 0 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {conversation.unread}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
