import sgMail from '@sendgrid/mail'

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set in environment variables')
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

interface EmailOptions {
  to: string
  subject: string
  text: string
  html: string
}

interface EmailTemplate {
  subject: string
  text: string
  html: string
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'noreply@revenuemd.com',
      subject,
      text,
      html,
    }

    await sgMail.send(msg)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    throw new Error('Failed to send email')
  }
}

export function getPasswordResetTemplate(resetUrl: string): EmailTemplate {
  return {
    subject: 'RevenueMD - Password Reset Request',
    text: `
      You have requested to reset your password.
      Please click the following link to reset your password: ${resetUrl}
      This link will expire in 1 hour.
      If you did not request this password reset, please ignore this email.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password.</p>
        <p>Please click the following link to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
          ">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you did not request this password reset, please ignore this email.</p>
      </div>
    `,
  }
}

export function getWelcomeTemplate(name: string): EmailTemplate {
  return {
    subject: 'Welcome to RevenueMD',
    text: `
      Welcome to RevenueMD, ${name}!
      
      Thank you for joining our platform. We're excited to help you manage your healthcare practice more efficiently.
      
      If you have any questions, please don't hesitate to contact our support team.
      
      Best regards,
      The RevenueMD Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to RevenueMD</h2>
        <p>Welcome, ${name}!</p>
        <p>Thank you for joining our platform. We're excited to help you manage your healthcare practice more efficiently.</p>
        <p>Here are some things you can do with RevenueMD:</p>
        <ul>
          <li>Manage patient records</li>
          <li>Process insurance claims</li>
          <li>Track payments</li>
          <li>Generate reports</li>
          <li>Access AI-driven insights</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p style="margin-top: 20px;">Best regards,<br>The RevenueMD Team</p>
      </div>
    `,
  }
}

export function getClaimStatusUpdateTemplate(
  patientName: string,
  claimId: string,
  status: 'APPROVED' | 'DENIED' | 'PENDING',
  amount: number
): EmailTemplate {
  const statusColor = {
    APPROVED: '#4CAF50',
    DENIED: '#f44336',
    PENDING: '#ff9800',
  }

  return {
    subject: `Claim Status Update - ${status}`,
    text: `
      Claim Status Update

      Patient: ${patientName}
      Claim ID: ${claimId}
      Status: ${status}
      Amount: $${amount.toFixed(2)}

      Please log in to your RevenueMD account for more details.
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Claim Status Update</h2>
        <div style="
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 5px;
          margin: 20px 0;
        ">
          <p><strong>Patient:</strong> ${patientName}</p>
          <p><strong>Claim ID:</strong> ${claimId}</p>
          <p>
            <strong>Status:</strong> 
            <span style="
              color: ${statusColor[status]};
              font-weight: bold;
            ">
              ${status}
            </span>
          </p>
          <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        </div>
        <p>Please log in to your RevenueMD account for more details.</p>
      </div>
    `,
  }
} 