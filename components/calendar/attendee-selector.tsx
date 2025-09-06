"use client"

import { useState } from "react"
import { Search, Plus, X, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

interface Attendee {
  id: string
  name: string
  email?: string
  role: "organizer" | "required" | "optional"
}

interface AttendeeProps {
  value: Attendee[]
  onChange: (value: Attendee[]) => void
}

// Mock data for contacts
const mockContacts = [
  { id: "1", name: "John Smith", email: "john.s@google.com", image: "https://avatar.vercel.sh/john-smith" },
  { id: "2", name: "Sarah Johnson", email: "sarah.j@apple.com", image: "https://avatar.vercel.sh/sarah-johnson" },
  { id: "3", name: "Michael Chen", email: "michael.c@meta.com", image: "https://avatar.vercel.sh/michael-chen" },
  { id: "4", name: "Emily Davis", email: "emily.d@example.com", image: "https://avatar.vercel.sh/emily-davis" },
  { id: "5", name: "Robert Wilson", email: "robert.w@example.com", image: "https://avatar.vercel.sh/robert-wilson" },
]

export function AttendeeSelector({ value, onChange }: AttendeeProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddExternal, setShowAddExternal] = useState(false)
  const [externalName, setExternalName] = useState("")
  const [externalEmail, setExternalEmail] = useState("")

  const filteredContacts = mockContacts.filter(
    (contact) =>
      !value.some((attendee) => attendee.id === contact.id) &&
      (contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleAddAttendee = (contact: (typeof mockContacts)[0]) => {
    onChange([
      ...value,
      {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        role: "required",
      },
    ])
    setSearchQuery("")
  }

  const handleAddExternalAttendee = () => {
    if (externalName && externalEmail) {
      onChange([
        ...value,
        {
          id: `external-${Date.now()}`,
          name: externalName,
          email: externalEmail,
          role: "required",
        },
      ])
      setExternalName("")
      setExternalEmail("")
      setShowAddExternal(false)
    }
  }

  const handleRemoveAttendee = (id: string) => {
    onChange(value.filter((attendee) => attendee.id !== id))
  }

  const handleChangeRole = (id: string, role: Attendee["role"]) => {
    onChange(value.map((attendee) => (attendee.id === id ? { ...attendee, role } : attendee)))
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      {searchQuery && filteredContacts.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <ul className="max-h-[200px] overflow-auto">
              {filteredContacts.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contact.image} alt={contact.name} />
                      <AvatarFallback>{contact.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleAddAttendee(contact)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {searchQuery && filteredContacts.length === 0 && (
        <p className="text-sm text-muted-foreground">No contacts found</p>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Attendees</h4>
          <ul className="space-y-2">
            {value.map((attendee) => (
              <li key={attendee.id} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{attendee.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{attendee.name}</p>
                    <p className="text-xs text-muted-foreground">{attendee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={attendee.role}
                    onValueChange={(value) => handleChangeRole(attendee.id, value as Attendee["role"])}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organizer">Organizer</SelectItem>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="optional">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveAttendee(attendee.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showAddExternal ? (
        <div className="space-y-2 border rounded-md p-3">
          <h4 className="text-sm font-medium">Add External Attendee</h4>
          <div className="space-y-2">
            <Input placeholder="Name" value={externalName} onChange={(e) => setExternalName(e.target.value)} />
            <Input
              placeholder="Email"
              type="email"
              value={externalEmail}
              onChange={(e) => setExternalEmail(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowAddExternal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddExternalAttendee} disabled={!externalName || !externalEmail}>
                Add
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setShowAddExternal(true)}>
          <User className="mr-2 h-4 w-4" />
          Add External Attendee
        </Button>
      )}
    </div>
  )
}
