import { Skeleton } from "@/components/ui/skeleton"

export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          <div className="grid gap-4">
            <div className="grid grid-cols-7 gap-4">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="w-[300px] border-l p-4">
          <Skeleton className="h-6 w-48" />
          <div className="mt-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
