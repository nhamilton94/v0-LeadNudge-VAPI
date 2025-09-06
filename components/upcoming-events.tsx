import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const events = [
  {
    date: {
      day: 15,
      month: "JUN",
    },
    title: "Team Meeting",
    time: "10:00 AM - 11:30 AM",
  },
]

export function UpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {events.map((event) => (
            <div key={event.title} className="flex items-start gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{event.date.day}</div>
                <div className="text-sm text-muted-foreground">{event.date.month}</div>
              </div>
              <div>
                <h4 className="font-semibold">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
