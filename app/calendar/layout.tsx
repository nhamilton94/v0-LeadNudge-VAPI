import type React from "react"
export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex h-[calc(100vh-0px)] flex-col bg-background">{children}</div>
}
