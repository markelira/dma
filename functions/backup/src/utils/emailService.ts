import sgMail from '@sendgrid/mail';
import { defineSecret } from 'firebase-functions/params';
import { logger } from './logger';
import { emailService as enhancedEmailService } from '../services/emailService';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailOptions {
  to: string | string[];
  template: EmailTemplate;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
  }>;
}

class EmailService {
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;
    
    try {
      const apiKey = sendgridApiKey.value();
      sgMail.setApiKey(apiKey);
      this.initialized = true;
      logger.info('SendGrid email service initialized');
    } catch (error) {
      logger.error('Failed to initialize SendGrid:', error);
      throw new Error('Email service initialization failed');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.initialize();

      const {
        to,
        template,
        from = 'noreply@elira.com',
        replyTo = 'support@elira.com',
        attachments
      } = options;

      const msg = {
        to: Array.isArray(to) ? to : [to],
        from: {
          email: from,
          name: 'ELIRA Platform'
        },
        replyTo,
        subject: template.subject,
        html: template.html,
        text: template.text || this.stripHtml(template.html),
        attachments
      };

      const [response] = await sgMail.send(msg);
      
      logger.info('Email sent successfully:', {
        to: msg.to,
        subject: template.subject,
        statusCode: response.statusCode
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email:', {
        error,
        to: options.to,
        subject: options.template.subject
      });
      return false;
    }
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<boolean[]> {
    try {
      await this.initialize();

      const results = await Promise.allSettled(
        emails.map(email => this.sendEmail(email))
      );

      return results.map(result => 
        result.status === 'fulfilled' ? result.value : false
      );
    } catch (error) {
      logger.error('Failed to send bulk emails:', error);
      return emails.map(() => false);
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async getDeliveryStatus(messageId: string): Promise<any> {
    try {
      await this.initialize();
      // SendGrid API doesn't provide direct message status lookup
      // This would require webhook integration for real-time status
      logger.info('Email delivery status requested for:', messageId);
      return { status: 'unknown', message: 'Use webhooks for real-time status' };
    } catch (error) {
      logger.error('Failed to get delivery status:', error);
      throw error;
    }
  }
}

// Keep backward compatibility with the utils version
export const emailService = new EmailService();
export { EmailTemplate, EmailOptions };

// Also export the enhanced service for direct access
export { enhancedEmailService };