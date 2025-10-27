import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface InvitationEmailProps {
  invitedByName: string;
  invitedByEmail: string;
  inviteeEmail: string;
  organizationName: string;
  role: string;
  invitationUrl: string;
  expiresAt: string;
  propertiesCount?: number;
}

export default function InvitationEmail({
  invitedByName = 'Admin User',
  invitedByEmail = 'admin@company.com',
  inviteeEmail = 'user@example.com',
  organizationName = 'Default Organization',
  role = 'User',
  invitationUrl = 'https://app.example.com/invite/token',
  expiresAt = '7 days',
  propertiesCount = 0,
}: InvitationEmailProps) {
  const previewText = `You've been invited to join ${organizationName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You've been invited! 🎉</Heading>
          
          <Text style={text}>
            <strong>{invitedByName}</strong> ({invitedByEmail}) has invited you to join{' '}
            <strong>{organizationName}</strong>.
          </Text>

          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Your Email:</strong> {inviteeEmail}
            </Text>
            <Text style={infoText}>
              <strong>Role:</strong> {role}
            </Text>
            {propertiesCount > 0 && (
              <Text style={infoText}>
                <strong>Properties Assigned:</strong> {propertiesCount} properties
              </Text>
            )}
          </Section>

          <Text style={text}>
            To accept this invitation and create your account, click the button below:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={invitationUrl}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this URL into your browser:
          </Text>
          <Text style={linkText}>{invitationUrl}</Text>

          <Section style={warningBox}>
            <Text style={warningText}>
              ⏰ This invitation will expire in {expiresAt}
            </Text>
          </Section>

          <Text style={footer}>
            If you weren't expecting this invitation, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#525252',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};

const infoBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const infoText = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const buttonContainer = {
  margin: '32px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const linkText = {
  color: '#3b82f6',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  padding: '0 40px',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px',
};

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
  textAlign: 'center' as const,
};

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '32px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};


