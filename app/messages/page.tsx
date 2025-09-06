"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { ConversationList } from "@/components/messages/conversation-list"
import { ChatInterface } from "@/components/messages/chat-interface"
import { cn } from "@/lib/utils"

// Mock conversation data with realistic real estate messages
const conversations = [
  {
    id: 1,
    contact: {
      id: 1,
      name: "John Smith",
      image: "/placeholder.svg",
      status: "online",
      title: "Potential Tenant",
      email: "john.s@example.com",
      phone: "+1 (555) 123-4567",
      linkedin: "linkedin.com/in/johns",
      industry: "Technology",
      leadSource: "Zillow",
      leadStatus: "Viewing Scheduled",
    },
    lastMessage: {
      text: "Perfect, I'll see you tomorrow at 2 PM for the viewing",
      timestamp: "2:30 PM",
    },
    unread: 0,
    messages: [
      {
        id: "1",
        role: "user",
        content: "Hi, I'm interested in the 2-bedroom apartment at 123 Main Street. Is it still available?",
        timestamp: "10:00 AM",
      },
      {
        id: "2",
        role: "assistant",
        content:
          "Hello John! Yes, the apartment at 123 Main Street is still available. It's a beautiful 2-bed, 2-bath unit with recent renovations. The kitchen features stainless steel appliances and there's in-unit laundry. Would you like to schedule a viewing?",
        timestamp: "10:05 AM",
      },
      {
        id: "3",
        role: "user",
        content: "That would be great! What times do you have available this week?",
        timestamp: "10:07 AM",
      },
      {
        id: "4",
        role: "assistant",
        content:
          "I have two time slots available: tomorrow at 2 PM or Thursday at 11 AM. During the tour, I'll also show you the private balcony and building amenities. Which time works better for you?",
        timestamp: "10:10 AM",
      },
      {
        id: "5",
        role: "user",
        content: "Tomorrow at 2 PM works perfectly. Could you tell me more about the parking situation?",
        timestamp: "10:15 AM",
      },
      {
        id: "6",
        role: "assistant",
        content:
          "Of course! The building has a secured underground parking garage with 24/7 access. One dedicated spot is included with the unit, and additional spots can be rented for $150/month. I'll make sure to show you the garage during tomorrow's tour.",
        timestamp: "10:18 AM",
      },
      {
        id: "7",
        role: "user",
        content: "Great, and what's the monthly rent and lease terms?",
        timestamp: "10:20 AM",
      },
      {
        id: "8",
        role: "assistant",
        content:
          "The monthly rent is $2,800, which includes water, trash, and access to all building amenities (gym, rooftop deck, package room). We offer a 12-month lease with the first month's rent and security deposit due at signing. I can provide the full lease terms during our tour.",
        timestamp: "10:25 AM",
      },
      {
        id: "9",
        role: "user",
        content: "Perfect, I'll see you tomorrow at 2 PM for the viewing",
        timestamp: "10:30 AM",
      },
      {
        id: "10",
        role: "assistant",
        content:
          "Excellent! I'll meet you in the lobby at 123 Main Street. Please bring a valid ID for building security. Looking forward to showing you the apartment! Don't hesitate to reach out if you have any questions before then.",
        timestamp: "10:32 AM",
      },
    ],
  },
  {
    id: 2,
    contact: {
      id: 2,
      name: "Sarah Johnson",
      image: "/placeholder.svg",
      status: "offline",
      title: "Interested Buyer",
      email: "sarah.j@example.com",
      phone: "+1 (555) 123-4567",
      linkedin: "linkedin.com/in/sarahj",
      industry: "Healthcare",
      leadSource: "Referral",
      leadStatus: "Viewing Scheduled",
    },
    lastMessage: {
      text: "The natural light in the living room is exactly what I'm looking for",
      timestamp: "11:45 AM",
    },
    unread: 2,
    messages: [
      {
        id: "1",
        role: "user",
        content:
          "Hi, I saw your listing for the condo at 456 Park Avenue. I'm particularly interested in the views and natural light.",
        timestamp: "11:00 AM",
      },
      {
        id: "2",
        role: "assistant",
        content:
          "Hello Sarah! You'll love the natural light at 456 Park Avenue. The unit features floor-to-ceiling windows in both the living room and master bedroom, with eastern exposure for beautiful morning light. Would you like me to send you some recent photos?",
        timestamp: "11:05 AM",
      },
      {
        id: "3",
        role: "user",
        content: "Yes, please! I'm especially interested in the living room and kitchen area.",
        timestamp: "11:08 AM",
      },
      {
        id: "4",
        role: "assistant",
        content:
          "I've just sent you some photos highlighting the open-concept living space. As you can see, the kitchen features a large island with waterfall quartz countertops, and the living room has those stunning 10-foot windows. I have availability this week if you'd like to experience the space in person.",
        timestamp: "11:15 AM",
      },
      {
        id: "5",
        role: "user",
        content:
          "The natural light in the living room is exactly what I'm looking for. Do you have any availability tomorrow afternoon?",
        timestamp: "11:45 AM",
      },
    ],
  },
]

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const { input, handleInputChange, handleSubmit } = useChat()

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-8" />
            </div>
          </div>
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelect={setSelectedConversation}
          />
        </div>

        <div className={cn("flex-1", !selectedConversation && "hidden md:block")}>
          {selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              messages={selectedConversation.messages}
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
