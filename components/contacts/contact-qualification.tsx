import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Update the Contact interface to match the nested structure from the API
interface Contact {
  qualification_status?: {
    contact_id: string
    qualification_status: string
    qualification_progress: number
    qualification_date?: string
    automation_enabled: boolean
    updated_at: string
    updated_by: string
  }
  qualification_details?: {
    contact_id: string
    income?: number
    credit_score?: string
    desired_price?: string
    move_in_timeline?: string
    preferred_locations?: string[]
    verified: boolean
    verification_date: string
    verified_by: string
  }
  interested_property?: {
    id: string
    address?: string
    city?: string// Include other property fields you need
    state?: string
    zip?: string
    price?: number
    bedrooms?: number
    bathrooms?: number
    // ... add more properties as needed
  }
}

interface ContactQualificationProps {
  contact: Contact
}

export function ContactQualification({ contact }: ContactQualificationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Update the getStatusColor function to handle lowercase status values
  const getStatusColor = (status: string | undefined) => {
    if (!status) return "text-gray-700 bg-gray-50 ring-gray-600/20"

    const normalizedStatus = status.toUpperCase()
    switch (normalizedStatus) {
      case "QUALIFIED":
        return "text-green-700 bg-green-50 ring-green-600/20"
      case "IN_PROGRESS":
        return "text-yellow-700 bg-yellow-50 ring-yellow-600/20"
      case "NOT_QUALIFIED":
        return "text-red-700 bg-red-50 ring-red-600/20"
      default:
        return "text-gray-700 bg-gray-50 ring-gray-600/20"
    }
  }

  // Update the formatQualificationStatus function to handle the nested structure
  const formatQualificationStatus = (status: string | undefined) => {
    if (!status) return "Unknown"

    // Replace underscores with spaces and capitalize each word
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Qualification Status</CardTitle>
          <CardDescription>Current qualification progress and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                    contact.qualification_status?.qualification_status,
                  )}`}
                >
                  {formatQualificationStatus(contact.qualification_status?.qualification_status)}
                </span>
                {contact.qualification_status?.qualification_date && (
                  <p className="text-sm text-muted-foreground">
                    Qualified on {new Date(contact.qualification_status.qualification_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {contact.qualification_status?.automation_enabled ? "Automation Enabled" : "Manual Qualification"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Qualification Progress</span>
                <span>{contact.qualification_status?.qualification_progress || 0}%</span>
              </div>
              <Progress value={contact.qualification_status?.qualification_progress || 0} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Qualification Details</CardTitle>
          <CardDescription>Financial and preference information</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Criteria</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Annual Income</TableCell>
                <TableCell>
                  {contact.qualification_details?.income
                    ? formatCurrency(contact.qualification_details.income)
                    : "Not provided"}
                </TableCell>
                <TableCell>
                  {contact.qualification_details?.income && contact.qualification_details.income >= 100000 ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                      Pending
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Credit Score Range</TableCell>
                <TableCell>{contact.qualification_details?.credit_score || "Not provided"}</TableCell>
                <TableCell>
                  {contact.qualification_details?.credit_score ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                      Pending
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Desired Price Range</TableCell>
                <TableCell>{contact.qualification_details?.desired_price || "Not provided"}</TableCell>
                <TableCell>
                  {contact.qualification_details?.desired_price ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                      Pending
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Preferred Locations</TableCell>
                <TableCell>
                  {contact.qualification_details?.preferred_locations
                    ? contact.qualification_details.preferred_locations.join(", ")
                    : "Not provided"}
                </TableCell>
                <TableCell>
                  {contact.qualification_details?.preferred_locations ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                      Pending
                    </span>
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Move-in Timeline</TableCell>
                <TableCell>{contact.qualification_details?.move_in_timeline || "Not provided"}</TableCell>
                <TableCell>
                  {contact.qualification_details?.move_in_timeline ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                      Confirmed
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                      Pending
                    </span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
