import { Card, CardContent } from "@/components/ui/card"
import { ContactWithDetails } from "@/types/contact"

interface ContactDetailsProps {
  contact: ContactWithDetails
}

export function ContactDetails({ contact }: ContactDetailsProps) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{contact.title || 'No title'}</h3>
            <div className="mt-1 text-sm text-muted-foreground">
              <p>Email: {contact.email || 'No email'}</p>
              <p>Phone: {contact.phone || 'No phone'}</p>
              <p>LinkedIn: {contact.linkedin || 'No LinkedIn'}</p>
              <p>Industry: {contact.industry || 'No industry'}</p>
              <p>Lead Source: {contact.lead_source || 'Unknown'}</p>
              {contact.lead_status && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Lead Status: </span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {contact.lead_status.replace('_', ' ')}
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
