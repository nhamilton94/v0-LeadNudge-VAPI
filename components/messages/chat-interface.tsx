"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Phone, Send, User, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ContactDetails } from "@/components/contacts/contact-details"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  conversation: {
    contact: {
      id: number
      name: string
      image: string
      status: string
      title: string
      email: string
      phone: string
      linkedin: string
      industry: string
      leadSource: string
      leadStatus?: string
    }
  }
  messages: Message[]
  input: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ChatInterface({ conversation, messages, input, onInputChange, onSubmit }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isContactOpen, setIsContactOpen] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]) // Fixed dependency array

  const handleCall = () => {
    window.location.href = `tel:${conversation.contact.phone}`
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
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
          <div>
            <div className="font-semibold">{conversation.contact.name}</div>
            <div className="text-sm text-muted-foreground">{conversation.contact.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCall}>
            <Phone className="h-4 w-4" />
            <span className="sr-only">Call contact</span>
          </Button>
          <Sheet open={isContactOpen} onOpenChange={setIsContactOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
                <span className="sr-only">View contact details</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] [&>button]:hidden">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-lg font-semibold">Contact Information</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsContactOpen(false)}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
                <div className="mt-6 flex-1 overflow-y-auto">
                  <ContactDetails contact={conversation.contact} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex flex-col gap-1", message.role === "assistant" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2",
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-[#f5f1ff] dark:bg-primary/10 text-foreground",
                )}
              >
                {message.content}
              </div>
              <span className="text-xs text-muted-foreground">{message.timestamp}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <form onSubmit={onSubmit} className="flex gap-2">
          <Input placeholder="Type a message..." value={input} onChange={onInputChange} className="flex-1" />
          <Button type="submit">
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
