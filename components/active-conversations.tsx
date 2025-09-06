import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const conversations = [
  {
    contact: {
      name: "John Doe",
      image: "/placeholder.svg",
    },
    topic: "Product Demo",
    status: "Active",
    lastUpdated: "5 mins ago",
  },
]

export function ActiveConversations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Topic</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.map((conversation) => (
              <TableRow key={conversation.contact.name}>
                <TableCell className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={conversation.contact.image} alt={conversation.contact.name} />
                    <AvatarFallback>{conversation.contact.name[0]}</AvatarFallback>
                  </Avatar>
                  {conversation.contact.name}
                </TableCell>
                <TableCell>{conversation.topic}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    {conversation.status}
                  </span>
                </TableCell>
                <TableCell>{conversation.lastUpdated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
