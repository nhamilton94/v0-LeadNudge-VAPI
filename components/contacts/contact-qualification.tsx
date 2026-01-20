import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContactWithDetails } from "@/types/contact"


interface ContactQualificationProps {
  contact: ContactWithDetails
}

export function ContactQualification({ contact }: ContactQualificationProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }


  const formatCreditScoreRange = (min: number | null, max: number | null) => {
    if (min === null && max === null) return 'Not provided'
    if (min !== null && max !== null) return `${min} - ${max}`
    if (min !== null) return `${min}+`
    if (max !== null) return `Up to ${max}`
    return 'Not provided'
  }

  const formatLeaseLength = (months: number | null) => {
    if (months === null || months === undefined) return 'Not specified'
    if (months === 0) return 'Month-to-month'
    return `${months} months`
  }

  return (
    <div className="space-y-6">
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
                  {contact.yearly_income
                    ? formatCurrency(contact.yearly_income)
                    : "Not provided"}
                </TableCell>
                <TableCell>
                  {contact.yearly_income && contact.yearly_income >= 100000 ? (
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
                <TableCell>{formatCreditScoreRange(contact.credit_score_min, contact.credit_score_max)}</TableCell>
                <TableCell>
                  {contact.credit_score_min || contact.credit_score_max ? (
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
                <TableCell>Lease Length Preference</TableCell>
                <TableCell>{formatLeaseLength(contact.lease_length_preference)}</TableCell>
                <TableCell>
                  {contact.lease_length_preference !== null ? (
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
