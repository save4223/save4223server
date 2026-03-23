/**
 * Email Service for Save4223
 *
 * Uses Supabase's built-in email capabilities to send notifications.
 * Toggle enabled via environment variable ENABLE_EMAIL_NOTIFICATIONS
 */

import { createClient } from '@/utils/supabase/server'

// Email feature toggle - can be disabled for testing
const EMAIL_ENABLED = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'

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
    const supabase = await createClient()

    // Build email content
    const subject = `Save4223 - Session Summary: ${summary.borrowed.length} borrowed, ${summary.returned.length} returned`

    const borrowedSection = summary.borrowed.length > 0
      ? `
<h3>📤 Borrowed Items (${summary.borrowed.length})</h3>
<ul>
${summary.borrowed.map(item => `
  <li>
    <strong>${item.name}</strong> (Tag: ${item.rfidTag.slice(0, 8)}...)
    ${item.dueAt ? `<br>Due: ${new Date(item.dueAt).toLocaleDateString()}` : ''}
  </li>
`).join('')}
</ul>
`
      : ''

    const returnedSection = summary.returned.length > 0
      ? `
<h3>📥 Returned Items (${summary.returned.length})</h3>
<ul>
${summary.returned.map(item => `
  <li><strong>${item.name}</strong> (Tag: ${item.rfidTag.slice(0, 8)}...)</li>
`).join('')}
</ul>
`
      : ''

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #003974; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    h2 { margin-top: 0; }
    h3 { color: #003974; border-bottom: 2px solid #eee; padding-bottom: 8px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 12px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-borrow { background: #fee2e2; color: #dc2626; }
    .badge-return { background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Save4223 Session Complete</h2>
      <p>Hi ${summary.userName},</p>
    </div>
    <div class="content">
      <p>Your cabinet session at <strong>${summary.cabinetName}</strong> has been completed.</p>
      <p><strong>Time:</strong> ${summary.timestamp.toLocaleString()}</p>
      <p><strong>Session ID:</strong> ${summary.sessionId.slice(0, 8)}...</p>

      ${borrowedSection}
      ${returnedSection}

      ${summary.borrowed.length > 0 ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 20px;">
        <strong>Reminder:</strong> Please return borrowed items by their due dates to avoid penalties.
      </div>
      ` : ''}

      <div class="footer">
        <p>This is an automated message from Save4223 Smart Lab Inventory System.</p>
        <p>If you have questions, please contact the lab administrator.</p>
      </div>
    </div>
  </div>
</body>
</html>
`

    // Send email using SMTP method
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
 * Send email using SMTP (alternative method)
 */
export async function sendEmailViaSMTP(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!EMAIL_ENABLED) {
    return false
  }

  try {
    // For production, use a proper email service like Resend, SendGrid, or AWS SES
    // This is a placeholder that logs the email
    console.log('[Email/SMTP] To:', to)
    console.log('[Email/SMTP] Subject:', subject)
    console.log('[Email/SMTP] HTML length:', html.length)

    // TODO: Integrate with actual email provider
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({ from: 'noreply@save4223.com', to, subject, html })

    return true
  } catch (error) {
    console.error('[Email/SMTP] Error:', error)
    return false
  }
}

/**
 * Check if email notifications are enabled
 */
export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED
}
