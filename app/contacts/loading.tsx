import { Skeleton } from "@/components/ui/skeleton"
import { Search, SlidersHorizontal, LayoutGrid } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ContactsLoading() {
  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      {/* Header with search and filters */}
      <div className="flex flex-col gap-4 border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search contacts..." className="pl-8" disabled />
          </div>
          <Button variant="outline" size="icon" disabled>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" disabled>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Contacts list */}
        <div className="w-80 overflow-auto border-r">
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="flex-1 overflow-auto">
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>

            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info" disabled>
                  Contact Information
                </TabsTrigger>
                <TabsTrigger value="qualification" disabled>
                  Qualification
                </TabsTrigger>
                <TabsTrigger value="meetings" disabled>
                  Scheduled Meetings
                </TabsTrigger>
                <TabsTrigger value="activity" disabled>
                  Activity History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-6">
                <Skeleton className="h-64 w-full rounded-lg" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
