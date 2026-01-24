/**
 * Unified Email Service for DMA Masterclass
 *
 * Uses SendGrid as the primary email provider.
 * All emails should use this service for consistent handling.
 */

import sgMail from '@sendgrid/mail';

// Lazy initialization of SendGrid
let sgInitialized = false;

function initSendGrid(): void {
  if (sgInitialized) return;

  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  sgMail.setApiKey(apiKey);
  sgInitialized = true;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Reply-to address (optional) */
  replyTo?: string;
  /** Custom from name (default: "DMA Masterclass") */
  fromName?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@dma.hu';
const DEFAULT_FROM_NAME = 'DMA Masterclass';
const BCC_EMAIL = 'info@dma.hu';

/**
 * Sends an email via SendGrid
 *
 * @param options Email options (to, subject, html, text)
 * @returns Promise with result indicating success/failure
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, replyTo, fromName = DEFAULT_FROM_NAME } = options;

  try {
    initSendGrid();

    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: DEFAULT_FROM_EMAIL,
        name: fromName,
      },
      bcc: BCC_EMAIL,
      subject,
      html,
      text: text || stripHtml(html),
    };

    if (replyTo) {
      msg.replyTo = replyTo;
    }

    const [response] = await sgMail.send(msg);

    console.log(`✅ Email sent successfully to ${to}`, {
      subject,
      statusCode: response.statusCode,
      messageId: response.headers?.['x-message-id'],
    });

    return {
      success: true,
      messageId: response.headers?.['x-message-id'] as string,
    };
  } catch (error: any) {
    console.error(`❌ Failed to send email to ${to}`, {
      subject,
      error: error.message,
      code: error.code,
      response: error.response?.body,
    });

    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Sends an email without blocking the main operation
 * Use this when email is not critical (e.g., notifications)
 */
export function sendEmailAsync(options: EmailOptions): void {
  sendEmail(options).catch(error => {
    console.error('Async email send failed:', error);
  });
}

/**
 * Sends multiple emails in batch
 */
export async function sendBulkEmails(
  emails: EmailOptions[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(emails.map(email => sendEmail(email)));

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      sent++;
    } else {
      failed++;
      const error =
        result.status === 'rejected'
          ? result.reason.message
          : result.value.error;
      errors.push(`${emails[index].to}: ${error}`);
    }
  });

  console.log(`Bulk email result: ${sent} sent, ${failed} failed`);

  return { sent, failed, errors };
}

/**
 * Basic HTML to plain text conversion
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Email template types for categorization
 */
export type EmailType =
  | 'verification'
  | 'password_reset'
  | 'welcome'
  | 'subscription_started'
  | 'subscription_canceled'
  | 'payment_success'
  | 'payment_failed'
  | 'trial_ending'
  | 'new_course'
  | 'employee_invite'
  | 'employee_reminder'
  | 'team_invite';

/**
 * Logs email activity for debugging/monitoring
 */
export function logEmailActivity(
  type: EmailType,
  to: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  console.log(`📧 Email Activity: ${type}`, {
    to,
    success,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}
