import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserCheck, ClockIcon as UserClock, UserX } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "qualified",
    contact: {
      name: "John Smith",
      image: "https://avatar.vercel.sh/john-smith",
    },
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "in_progress",
    contact: {
      name: "Sarah Johnson",
      image: "https://avatar.vercel.sh/sarah-johnson",
    },
    timestamp: "4 hours ago",
  },
  {
    id: 3,
    type: "not_qualified",
    contact: {
      name: "Michael Chen",
      image: "https://avatar.vercel.sh/michael-chen",
    },
    timestamp: "6 hours ago",
  },
]

export function RecentActivity() {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "qualified":
        return <UserCheck className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <UserClock className="h-4 w-4 text-yellow-500" />
      case "not_qualified":
        return <UserX className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getActivityText = (type: string) => {
    switch (type) {
      case "qualified":
        return "was qualified"
      case "in_progress":
        return "started qualification"
      case "not_qualified":
        return "was not qualified"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-8">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={activity.contact.image} alt={activity.contact.name} />
            <AvatarFallback>{activity.contact.name[0]}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{activity.contact.name}</p>
            <p className="text-sm text-muted-foreground">{getActivityText(activity.type)}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {getActivityIcon(activity.type)}
            <span className="text-sm text-muted-foreground">{activity.timestamp}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
