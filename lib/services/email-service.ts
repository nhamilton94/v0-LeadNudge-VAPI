import { Resend } from 'resend';
import { render } from '@react-email/render';
import InvitationEmail from '@/emails/invitation-email';
import * as React from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationEmailParams {
  to: string;
  invitedByName: string;
  invitedByEmail: string;
  organizationName: string;
  role: string;
  invitationToken: string;
  expiresAt: Date;
  propertiesCount?: number;
}

export async function sendInvitationEmail(params: SendInvitationEmailParams) {
  try {
    const {
      to,
      invitedByName,
      invitedByEmail,
      organizationName,
      role,
      invitationToken,
      expiresAt,
      propertiesCount = 0,
    } = params;

    console.log('[Email Service] Preparing to send invitation email to:', to);
    console.log('[Email Service] Resend API Key configured:', !!process.env.RESEND_API_KEY);
    console.log('[Email Service] App URL:', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // Calculate expiry in human-readable format
    const now = new Date();
    const expiryDays = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expiresInText = expiryDays > 1 ? `${expiryDays} days` : '24 hours';

    // Build invitation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const invitationUrl = `${baseUrl}/invite/${invitationToken}`;

    console.log('[Email Service] Invitation URL:', invitationUrl);

    // Render email HTML using React.createElement
    let emailHtml: string;
    try {
      emailHtml = await render(
        React.createElement(InvitationEmail, {
          invitedByName,
          invitedByEmail,
          inviteeEmail: to,
          organizationName,
          role,
          invitationUrl,
          expiresAt: expiresInText,
          propertiesCount,
        })
      );

      // Ensure it's a string
      if (typeof emailHtml !== 'string') {
        console.error('[Email Service] render() did not return a string:', typeof emailHtml);
        emailHtml = String(emailHtml);
      }

      console.log('[Email Service] Email HTML rendered successfully');
      console.log('[Email Service] Email HTML type:', typeof emailHtml);
      console.log('[Email Service] Email HTML length:', emailHtml?.length || 0);
    } catch (renderError) {
      console.error('[Email Service] Error rendering email template:', renderError);
      throw new Error(`Failed to render email template: ${renderError}`);
    }

    // Send email via Resend
    console.log('[Email Service] Attempting to send via Resend...');
    console.log('[Email Service] Email payload:', {
      from: 'LeadNudge <invitations@leadnudge.ai>',
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      htmlType: typeof emailHtml,
      htmlLength: emailHtml.length,
      replyTo: invitedByEmail,
    });

    const { data, error } = await resend.emails.send({
      from: 'LeadNudge <invitations@summitlogisticsinc.us>', // Using verified domain
      to: [to],
      subject: `You've been invited to join ${organizationName}`,
      html: emailHtml,
      replyTo: invitedByEmail,
    });

    if (error) {
      console.error('[Email Service] Resend API error:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to send invitation email: ${error.message || JSON.stringify(error)}`);
    }

    console.log('[Email Service] Email sent successfully! Message ID:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('[Email Service] Unexpected error:', error);
    console.error('[Email Service] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}


