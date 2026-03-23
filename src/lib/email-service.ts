/**
 * Email Service for Save4223
 *
 * Sends checkout/return notifications via SMTP.
 * Toggle enabled via environment variable ENABLE_EMAIL_NOTIFICATIONS
 */

import nodemailer from 'nodemailer'

// Email feature toggle - can be disabled for testing
const EMAIL_ENABLED = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER

// Create SMTP transporter if configured
function createTransporter() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
}

interface TransactionItem {
  name: string
  rfidTag: string
  action: 'BORROW' | 'RETURN'
  dueAt?: string
}

interface SessionSummary {
  sessionId: string
  userId: string
  userEmail: string
  userName: string
  borrowed: TransactionItem[]
  returned: TransactionItem[]
  cabinetName: string
  timestamp: Date
}

/**
 * Send checkout summary email to user
 */
export async function sendCheckoutEmail(summary: SessionSummary): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    console.log('[Email] Notifications disabled (ENABLE_EMAIL_NOTIFICATIONS=false)')
    return false
  }

  try {
    // Build email content
    const subject = `Tool Checkout Summary - ${summary.cabinetName}`

    const borrowedList = summary.borrowed.length > 0
      ? summary.borrowed.map(item =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.rfidTag}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.dueAt ? new Date(item.dueAt).toLocaleDateString() : 'N/A'}</td>
          </tr>`
        ).join('')
      : '<tr><td colspan="3" style="padding: 8px; color: #666;">No items borrowed</td></tr>'

    const returnedList = summary.returned.length > 0
      ? summary.returned.map(item =>
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.rfidTag}</td>
          </tr>`
        ).join('')
      : '<tr><td colspan="2" style="padding: 8px; color: #666;">No items returned</td></tr>'

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tool Checkout Summary</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2c3e50; margin: 0;">Tool Checkout Summary</h1>
    <p style="margin: 10px 0 0 0; color: #666;">
      <strong>Cabinet:</strong> ${summary.cabinetName}<br>
      <strong>Date:</strong> ${summary.timestamp.toLocaleString()}<br>
      <strong>Session ID:</strong> ${summary.sessionId.slice(0, 8)}...
    </p>
  </div>

  ${summary.borrowed.length > 0 ? `
  <div style="margin-bottom: 30px;">
    <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 8px;">
      ✅ Borrowed Items (${summary.borrowed.length})
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item Name</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">RFID Tag</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Due Date</th>
        </tr>
      </thead>
      <tbody>
        ${borrowedList}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${summary.returned.length > 0 ? `
  <div style="margin-bottom: 30px;">
    <h2 style="color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 8px;">
      ↩️ Returned Items (${summary.returned.length})
    </h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item Name</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">RFID Tag</th>
        </tr>
      </thead>
      <tbody>
        ${returnedList}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin-top: 20px;">
    <p style="margin: 0; color: #856404;">
      <strong>⚠️ Reminder:</strong> Please return borrowed items by their due date to avoid overdue notices.
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
    <p>
      This is an automated message from Save4223 Smart Lab Inventory System.<br>
      If you have questions, please contact the lab administrator.
    </p>
  </div>
</body>
</html>
`

    // Send email using SMTP
    // Note: Supabase doesn't have a direct email API for arbitrary emails
    const sent = await sendEmailViaSMTP(summary.userEmail, subject, htmlContent)

    if (!sent) {
      // Fallback: Log the email content for debugging
      console.log('[Email] Would send to:', summary.userEmail)
      console.log('[Email] Subject:', subject)
      console.log('[Email] Content preview:', htmlContent.slice(0, 500))
      return false
    }

    console.log('[Email] Sent checkout summary to:', summary.userEmail)
    return true

  } catch (error) {
    console.error('[Email] Failed to send email:', error)
    return false
  }
}

/**
 * Send email using SMTP
 */
export async function sendEmailViaSMTP(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    return false
  }

  const transporter = createTransporter()
  if (!transporter) {
    console.log('[Email] SMTP not configured - logging email instead')
    console.log('[Email] To:', to)
    console.log('[Email] Subject:', subject)
    return false
  }

  try {
    await transporter.sendMail({
      from: `"Save4223 Lab System" <${SMTP_FROM}>`,
      to,
      subject,
      html,
    })

    console.log('[Email] Sent to:', to)
    return true
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return false
  }
}

/**
 * Check if email notifications are enabled
 */
export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED
}
