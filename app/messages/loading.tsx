import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with conversations list */}
        <div className="w-80 border-r">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-8" disabled />
            </div>
          </div>
          <div className="divide-y">
            {/* Skeleton conversation items */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1">
          <div className="flex h-full flex-col">
            {/* Chat header */}
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${i % 2 === 0 ? "items-start" : "items-end"}`}>
                    <Skeleton
                      className={`h-16 w-[70%] rounded-2xl ${i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"}`}
                    />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>

            {/* Chat input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
