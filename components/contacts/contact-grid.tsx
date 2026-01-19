"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ContactWithDetails } from "@/types/contact"

// Update the ContactGridProps interface to make selectedContact optional
interface ContactGridProps {
  contacts: ContactWithDetails[]
  selectedContact: ContactWithDetails | null
  onSelect: (contact: ContactWithDetails) => void
}

// Update the className logic to handle when selectedContact is null
export function ContactGrid({ contacts, selectedContact, onSelect }: ContactGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {contacts.map((contact) => (
        <Card
          key={contact.id}
          className={cn(
            "cursor-pointer transition-colors hover:bg-muted/50",
            selectedContact && selectedContact.id === contact.id && "bg-muted",
          )}
          onClick={() => onSelect(contact)}
        >
          <CardHeader className="flex flex-row items-center gap-4 space-y-0">
            <Avatar className="h-12 w-12">
              <AvatarImage src={contact.image_url || ''} alt={contact.name} />
              <AvatarFallback>{contact.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{contact.name}</h3>
              <p className="text-sm text-muted-foreground">{contact.title || 'No title'}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>{contact.email || 'No email'}</p>
              <p>{contact.phone || 'No phone'}</p>
            </div>
            {contact.lead_status && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {contact.lead_status.replace('_', ' ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
