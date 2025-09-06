import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface Contact {
  qualification_status?: {
    qualification_status: string
    qualification_progress: number
  }
  qualification_details?: {
    income?: number
    credit_score?: string
    desired_price?: string
  }
}

interface QualificationStatsProps {
  contact: Contact
}

export function QualificationStats({ contact }: QualificationStatsProps) {
  const calculateQualificationScore = () => {
    let score = 0
    let total = 0

    // Income check
    if (contact.qualification_details?.income) {
      total += 40
      if (contact.qualification_details.income >= 150000) score += 40
      else if (contact.qualification_details.income >= 100000) score += 30
      else if (contact.qualification_details.income >= 75000) score += 20
      else score += 10
    }

    // Credit score check
    if (contact.qualification_details?.credit_score) {
      total += 40
      const creditScore = contact.qualification_details.credit_score
      if (creditScore === "750+" || Number.parseInt(creditScore) >= 750) score += 40
      else if (creditScore === "700-749" || (Number.parseInt(creditScore) >= 700 && Number.parseInt(creditScore) < 750))
        score += 30
      else if (creditScore === "650-699" || (Number.parseInt(creditScore) >= 650 && Number.parseInt(creditScore) < 700))
        score += 20
      else score += 10
    }

    // Price range check
    if (contact.qualification_details?.desired_price) {
      total += 20
      score += 20 // If they've provided a price range, they get full points
    }

    return total > 0 ? Math.round((score / total) * 100) : 0
  }

  const qualificationScore = calculateQualificationScore()

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700"
    if (score >= 60) return "text-yellow-700"
    return "text-red-700"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qualification Score</CardTitle>
        <CardDescription>Based on financial criteria and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(qualificationScore)}`}>{qualificationScore}%</span>
          </div>
          <Progress value={qualificationScore} className="h-2" />
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Income Check</p>
              <div className="flex items-center gap-2">
                {contact.qualification_details?.income ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                    Pending
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Credit Score</p>
              <div className="flex items-center gap-2">
                {contact.qualification_details?.credit_score ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                    Pending
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Price Range</p>
              <div className="flex items-center gap-2">
                {contact.qualification_details?.desired_price ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                    Confirmed
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
