import { Card, CardContent } from "@/components/ui/card"

interface Contact {
  name: string
  title: string
  email: string
  phone: string
  linkedin: string
  industry: string
  leadSource: string
  leadStatus?: string
}

interface ContactDetailsProps {
  contact: Contact
}

export function ContactDetails({ contact }: ContactDetailsProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{contact.title}</h3>
            <div className="mt-1 text-sm text-muted-foreground">
              <p>Email: {contact.email}</p>
              <p>Phone: {contact.phone}</p>
              <p>LinkedIn: {contact.linkedin}</p>
              <p>Industry: {contact.industry}</p>
              <p>Lead Source: {contact.lead_source}</p>
              {contact.lead_status && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Lead Status: </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {contact.lead_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
