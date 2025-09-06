/**
 * Generates the HTML body for the “Authorise Zillow leads” email.
 * Using a plain-HTML string avoids React-runtime rendering issues in the Resend SDK.
 */
interface EmailTemplateProps {
  firstName: string
  lastName: string
  userEmail: string
  webhookUrl: string
}

export function renderZillowAuthEmail({ firstName, lastName, userEmail, webhookUrl }: EmailTemplateProps): string {
  return /* html */ `
    <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5">
      <p>Dear Zillow Support Team,</p>

      <p>
        I am writing to request authorisation for my Zillow Premier Agent account to send
        leads to my designated webhook endpoint.
      </p>

      <p>Please configure my account so that leads are delivered to the following webhook URL:</p>

      <p><strong>${webhookUrl}</strong></p>

      <p>
        If you need any additional information to complete this request, please let me know.
      </p>

      <p>Thank you for your assistance!</p>

      <p>
        Best regards,<br />
        ${firstName} ${lastName}<br />
        ${userEmail}
      </p>
    </div>
  `
}
