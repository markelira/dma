"use strict";
/**
 * Unified Email Service for DMA Masterclass
 *
 * Uses SendGrid as the primary email provider.
 * All emails should use this service for consistent handling.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
exports.sendEmailAsync = sendEmailAsync;
exports.sendBulkEmails = sendBulkEmails;
exports.isValidEmail = isValidEmail;
exports.logEmailActivity = logEmailActivity;
const mail_1 = __importDefault(require("@sendgrid/mail"));
// Lazy initialization of SendGrid
let sgInitialized = false;
function initSendGrid() {
    if (sgInitialized)
        return;
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
        console.error('SENDGRID_API_KEY not configured');
        throw new Error('Email service not configured');
    }
    mail_1.default.setApiKey(apiKey);
    sgInitialized = true;
}
const DEFAULT_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@dma.hu';
const DEFAULT_FROM_NAME = 'DMA Masterclass';
/**
 * Sends an email via SendGrid
 *
 * @param options Email options (to, subject, html, text)
 * @returns Promise with result indicating success/failure
 */
async function sendEmail(options) {
    const { to, subject, html, text, replyTo, fromName = DEFAULT_FROM_NAME } = options;
    try {
        initSendGrid();
        const msg = {
            to,
            from: {
                email: DEFAULT_FROM_EMAIL,
                name: fromName,
            },
            subject,
            html,
            text: text || stripHtml(html),
        };
        if (replyTo) {
            msg.replyTo = replyTo;
        }
        const [response] = await mail_1.default.send(msg);
        console.log(`✅ Email sent successfully to ${to}`, {
            subject,
            statusCode: response.statusCode,
            messageId: response.headers?.['x-message-id'],
        });
        return {
            success: true,
            messageId: response.headers?.['x-message-id'],
        };
    }
    catch (error) {
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
function sendEmailAsync(options) {
    sendEmail(options).catch(error => {
        console.error('Async email send failed:', error);
    });
}
/**
 * Sends multiple emails in batch
 */
async function sendBulkEmails(emails) {
    const results = await Promise.allSettled(emails.map(email => sendEmail(email)));
    let sent = 0;
    let failed = 0;
    const errors = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
            sent++;
        }
        else {
            failed++;
            const error = result.status === 'rejected'
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
function stripHtml(html) {
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
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Logs email activity for debugging/monitoring
 */
function logEmailActivity(type, to, success, metadata) {
    console.log(`📧 Email Activity: ${type}`, {
        to,
        success,
        timestamp: new Date().toISOString(),
        ...metadata,
    });
}
//# sourceMappingURL=emailService.js.map