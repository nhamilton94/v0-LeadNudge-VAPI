"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { ContactWithDetails } from "@/types/contact"

// Update the ContactListProps interface to make selectedContact optional
interface ContactListProps {
  contacts: ContactWithDetails[]
  selectedContact: ContactWithDetails | null
  onSelect: (contact: ContactWithDetails) => void
}

// Update the className logic to handle when selectedContact is null
export function ContactList({ contacts, selectedContact, onSelect }: ContactListProps) {
  return (
    <div className="divide-y">
      {contacts.map((contact) => (
        <button
          key={contact.id}
          className={cn(
            "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50",
            selectedContact && selectedContact.id === contact.id && "bg-muted",
          )}
          onClick={() => onSelect(contact)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact.image_url} alt={contact.name} />
            <AvatarFallback>{contact.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{contact.name}</span>
            <span className="text-sm text-muted-foreground">{contact.title || 'No title'}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
