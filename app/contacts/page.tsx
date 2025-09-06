"use client"

import { useAuth } from "@/components/auth/supabase-auth-provider"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, Mail, Phone, Search, SlidersHorizontal, UserCheck, UserX, Clock, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContactList } from "@/components/contacts/contact-list"
import { ContactGrid } from "@/components/contacts/contact-grid"
import { ContactDetails } from "@/components/contacts/contact-details"
import { ContactMeetings } from "@/components/contacts/contact-meetings"
import { ContactActivity } from "@/components/contacts/contact-activity"
import { ContactQualification } from "@/components/contacts/contact-qualification"
import { QualificationControls } from "@/components/contacts/qualification-controls"
import { QualificationStats } from "@/components/contacts/qualification-stats"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

// Make sure we're importing the named export
import { supabase } from "@/utils/supabase/client"

type ViewMode = "list" | "grid"
type QualificationFilter = "all" | "qualified" | "in_progress" | "not_started" | "not_qualified"

export default function ContactsPage() {
  const router = useRouter()
  const [myContacts, setMyContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [qualificationFilter, setQualificationFilter] = useState<QualificationFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userProfile, setUserProfile] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  async function fetchUserProfile() {
    try {
      if (!user?.id) return

      const { data: userProfile, error } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", user.id)
      .single()

      if (error) {
        console.error("Error fetching user profile:", error)
      } else {
        setUserProfile(userProfile)
        console.log("Retrieved User Profile: " + JSON.stringify(userProfile))
        console.log("user profile email: " + userProfile.email)
      }
    } catch (error) {
      console.error("Exception:", error)
    }
  }

  async function fetchContacts() {
    try {
      if (!user?.id) return

      const { data, error } = await supabase.rpc("get_contacts_with_details", {
        user_id: user.id,
      })
      if (error) {
        console.error("Error fetching contacts:", error)
      } else {
        setMyContacts(data || [])
        // Automatically select the first contact if available
        console.log("Retrieved Contacts: " + JSON.stringify(data))
        if (data && data.length > 0) {
          setSelectedContact(data[0])
        } else {
          setSelectedContact(null)
        }
      }
    } catch (error) {
      console.error("Exception:", error)
    }
  }

  async function deleteContact(contactId: string) {
    if (!contactId) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contactId)

      if (error) {
        console.error("Error deleting contact:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete contact. Please try again.",
        })
        return false
      }

      // Remove the contact from the local state
      const updatedContacts = myContacts.filter((contact) => contact.id !== contactId)
      setMyContacts(updatedContacts)

      // Select another contact if available, otherwise set to null
      if (updatedContacts.length > 0) {
        setSelectedContact(updatedContacts[0])
      } else {
        setSelectedContact(null)
      }

      toast({
        title: "Contact deleted",
        description: "The contact has been successfully deleted.",
      })

      return true
    } catch (error) {
      console.error("Exception deleting contact:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
      return false
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Always call useEffect at the top level, handle conditional logic inside
  useEffect(() => {
    // Only execute if user exists
    if (user) {
      fetchUserProfile()
      fetchContacts()
    }
  }, [user, userProfile.email]) // Depend on the entire user object instead of just user.id

  const filteredContacts = myContacts
    ? myContacts.filter((contact) => {
        // Apply qualification filter
        if (qualificationFilter !== "all") {
          const status = contact.qualification_status?.qualification_status?.toLowerCase()
          if (qualificationFilter === "qualified" && status !== "qualified") return false
          if (qualificationFilter === "in_progress" && status !== "in_progress") return false
          if (qualificationFilter === "not_started" && status !== "not_started") return false
          if (qualificationFilter === "not_qualified" && status !== "not_qualified") return false
        }

        // Apply search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            contact.name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query) ||
            contact.phone.includes(query)
          )
        }

        return true
      })
    : []

  const handleBatchAction = (action: "enable" | "disable" | "reset") => {
    // Here you would update the selected contacts' automation status
    console.log(`Batch ${action} automation`)
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="flex flex-col gap-4 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setQualificationFilter("qualified")}>
                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                Qualified (
                {myContacts
                  ? myContacts.filter((c) => c.qualification_status?.qualification_status === "qualified").length
                  : 0}
                )
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQualificationFilter("in_progress")}>
                <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                In Progress (
                {myContacts
                  ? myContacts.filter((c) => c.qualification_status?.qualification_status === "in_progress").length
                  : 0}
                )
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQualificationFilter("not_started")}>
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                Not Started (
                {myContacts
                  ? myContacts.filter((c) => c.qualification_status?.qualification_status === "not_started").length
                  : 0}
                )
              </Button>
              <Button variant="outline" size="sm" onClick={() => setQualificationFilter("not_qualified")}>
                <UserX className="mr-2 h-4 w-4 text-red-500" />
                Not Qualified (
                {myContacts
                  ? myContacts.filter((c) => c.qualification_status?.qualification_status === "not_qualified").length
                  : 0}
                )
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push("/contacts/new")}>Add Contact</Button>
            <Button variant="outline" onClick={() => handleBatchAction("enable")}>
              Enable Automation
            </Button>
            <Button variant="outline" onClick={() => handleBatchAction("disable")}>
              Disable Automation
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            title={`Switch to ${viewMode === "list" ? "grid" : "list"} view`}
          >
            {viewMode === "list" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={
            viewMode === "list" ? "w-80 overflow-auto border-r" : "w-[600px] xl:w-[900px] overflow-auto border-r"
          }
        >
          {viewMode === "list" ? (
            <ContactList contacts={filteredContacts} selectedContact={selectedContact} onSelect={setSelectedContact} />
          ) : (
            <ContactGrid contacts={filteredContacts} selectedContact={selectedContact} onSelect={setSelectedContact} />
          )}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6 p-6">
            {selectedContact ? (
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-semibold">{selectedContact.name}</h1>
                {selectedContact.qualification_status?.qualification_status === "qualified" && (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Qualified
                  </span>
                )}
                {selectedContact.qualification_status?.qualification_status === "in_progress" && (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                    In Progress
                  </span>
                )}
              </div>
            ) : (
              <h1 className="text-2xl font-semibold">
                {myContacts && myContacts.length > 0 ? "No contact selected" : "No contacts found"}
              </h1>
            )}
            <div className="flex gap-2">
              <Button onClick={() => router.push(`/contacts/${selectedContact?.id}/edit`)} disabled={!selectedContact}>
                Edit Contact
              </Button>
              <Button variant="outline" disabled={!selectedContact}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button variant="outline" disabled={!selectedContact}>
                <Phone className="mr-2 h-4 w-4" />
                Call Contact
              </Button>

              {/* Standalone delete button that opens the dialog */}
              <Button
                variant="destructive"
                disabled={!selectedContact || isDeleting}
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete Contact"}
              </Button>

              {/* Separate AlertDialog component */}
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the contact
                      {selectedContact ? ` "${selectedContact.name}"` : ""} and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => selectedContact && deleteContact(selectedContact.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {selectedContact ? (
              <Tabs defaultValue="info">
                <TabsList>
                  <TabsTrigger value="info">Contact Information</TabsTrigger>
                  <TabsTrigger value="qualification">Qualification</TabsTrigger>
                  <TabsTrigger value="meetings">Scheduled Meetings</TabsTrigger>
                  <TabsTrigger value="activity">Activity History</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="mt-6">
                  <ContactDetails contact={selectedContact} />
                </TabsContent>
                <TabsContent value="qualification" className="mt-6">
                  <div className="space-y-6">
                    <QualificationControls contact={selectedContact} userEmail={userProfile?.email || ''} />
                    <QualificationStats contact={selectedContact} />
                    <ContactQualification contact={selectedContact} />
                  </div>
                </TabsContent>
                <TabsContent value="meetings" className="mt-6">
                  <ContactMeetings />
                </TabsContent>
                <TabsContent value="activity" className="mt-6">
                  <ContactActivity />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center p-8">
                {myContacts && myContacts.length > 0 ? (
                  <p className="text-muted-foreground">Select a contact to view details</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground">You don't have any contacts yet.</p>
                    <Button onClick={() => router.push("/contacts/new")}>Add Your First Contact</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
