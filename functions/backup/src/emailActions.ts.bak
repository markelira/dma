import { onCall } from 'firebase-functions/v2/https';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as z from 'zod';
import { emailService } from './utils/emailService';
import { emailService as enhancedEmailService } from './services/emailService';
import { EmailTemplates } from './utils/emailTemplates';
import { logger } from './utils/logger';

// Validation schemas
const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(200),
  template: z.enum(['welcome', 'passwordReset', 'enrollment', 'quiz', 'payment', 'certificate', 'custom']),
  data: z.record(z.any()).optional(),
});

const SendWelcomeEmailSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  email: z.string().email(),
  loginUrl: z.string().url()
});

const SendCourseEnrollmentEmailSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  email: z.string().email(),
  courseName: z.string(),
  courseUrl: z.string().url(),
  instructorName: z.string()
});

const SendPasswordResetEmailSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  resetUrl: z.string().url(),
  expiryTime: z.string()
});

const SendCourseCompletionEmailSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  email: z.string().email(),
  courseName: z.string(),
  certificateUrl: z.string().url(),
  completionDate: z.string()
});

const SendPaymentConfirmationEmailSchema = z.object({
  userId: z.string(),
  firstName: z.string(),
  email: z.string().email(),
  courseName: z.string(),
  amount: z.string(),
  transactionId: z.string(),
  invoiceUrl: z.string().url()
});

const SendUniversityInviteEmailSchema = z.object({
  firstName: z.string(),
  email: z.string().email(),
  universityName: z.string(),
  inviterName: z.string(),
  acceptUrl: z.string().url(),
  role: z.string()
});

const SendBulkEmailSchema = z.object({
  emails: z.array(z.object({
    to: z.string().email(),
    templateType: z.enum(['welcome', 'enrollment', 'completion', 'payment', 'invite']),
    data: z.record(z.any())
  }))
});

/**
 * Unified Send Email Cloud Function
 */
export const sendEmail = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Validate input
    const validated = SendEmailSchema.parse(request.data);

    // Check user permissions (admin only for custom emails)
    if (validated.template === 'custom') {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(request.auth.uid)
        .get();
      
      if (userDoc.data()?.role !== 'admin') {
        throw new Error('Only admins can send custom emails');
      }
    }

    // Send email based on template
    switch (validated.template) {
      case 'welcome':
        await enhancedEmailService.sendWelcomeEmail({
          email: validated.to as string,
          displayName: validated.data?.displayName
        });
        break;
        
      case 'passwordReset':
        await enhancedEmailService.sendPasswordResetEmail(
          validated.to as string,
          validated.data?.resetLink
        );
        break;
        
      case 'enrollment':
        await enhancedEmailService.sendEnrollmentConfirmation(
          { email: validated.to as string, name: validated.data?.userName },
          { 
            title: validated.data?.courseTitle,
            instructor: validated.data?.instructorName,
            startDate: validated.data?.startDate
          }
        );
        break;
        
      case 'quiz':
        await enhancedEmailService.sendQuizCompletionEmail(
          { email: validated.to as string, name: validated.data?.userName },
          {
            title: validated.data?.quizTitle,
            score: validated.data?.score,
            passed: validated.data?.passed,
            certificateUrl: validated.data?.certificateUrl
          }
        );
        break;
        
      case 'payment':
        await enhancedEmailService.sendPaymentReceipt(
          { email: validated.to as string, name: validated.data?.userName },
          {
            amount: validated.data?.amount,
            currency: validated.data?.currency || 'HUF',
            description: validated.data?.description,
            invoiceNumber: validated.data?.invoiceNumber,
            date: validated.data?.date || new Date().toLocaleDateString('hu-HU')
          }
        );
        break;
        
      case 'certificate':
        await enhancedEmailService.sendCertificateEmail(
          { email: validated.to as string, name: validated.data?.userName },
          {
            title: validated.data?.courseTitle,
            completionDate: validated.data?.completionDate,
            certificateUrl: validated.data?.certificateUrl
          }
        );
        break;
        
      case 'custom':
        await enhancedEmailService.sendEmail({
          to: validated.to,
          subject: validated.subject,
          html: validated.data?.html || '',
          text: validated.data?.text
        });
        break;
    }

    logger.info('Unified email sent successfully', { 
      template: validated.template, 
      recipient: validated.to 
    });

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    logger.error('Send email error:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Welcome email
export const sendWelcomeEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, firstName, email, loginUrl } = SendWelcomeEmailSchema.parse(request.data);

    const template = EmailTemplates.welcomeEmail({
      firstName,
      email,
      loginUrl
    });

    const success = await emailService.sendEmail({
      to: email,
      template
    });

    if (success) {
      logger.info('Welcome email sent successfully', { userId, email });
      return { success: true, message: 'Welcome email sent' };
    } else {
      throw new Error('Failed to send welcome email');
    }

  } catch (error) {
    logger.error('Error sending welcome email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Course enrollment email
export const sendCourseEnrollmentEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, firstName, email, courseName, courseUrl, instructorName } = 
      SendCourseEnrollmentEmailSchema.parse(request.data);

    const template = EmailTemplates.courseEnrollmentEmail({
      firstName,
      courseName,
      courseUrl,
      instructorName
    });

    const success = await emailService.sendEmail({
      to: email,
      template
    });

    if (success) {
      logger.info('Course enrollment email sent successfully', { userId, courseName });
      return { success: true, message: 'Enrollment email sent' };
    } else {
      throw new Error('Failed to send enrollment email');
    }

  } catch (error) {
    logger.error('Error sending enrollment email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Password reset email
export const sendPasswordResetEmail = onCall(async (request) => {
  try {
    const { email, firstName, resetUrl, expiryTime } = 
      SendPasswordResetEmailSchema.parse(request.data);

    const template = EmailTemplates.passwordResetEmail({
      firstName,
      resetUrl,
      expiryTime
    });

    const success = await emailService.sendEmail({
      to: email,
      template
    });

    if (success) {
      logger.info('Password reset email sent successfully', { email });
      return { success: true, message: 'Password reset email sent' };
    } else {
      throw new Error('Failed to send password reset email');
    }

  } catch (error) {
    logger.error('Error sending password reset email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Course completion email
export const sendCourseCompletionEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, firstName, email, courseName, certificateUrl, completionDate } = 
      SendCourseCompletionEmailSchema.parse(request.data);

    const template = EmailTemplates.courseCompletionEmail({
      firstName,
      courseName,
      certificateUrl,
      completionDate
    });

    const success = await emailService.sendEmail({
      to: email,
      template
    });

    if (success) {
      logger.info('Course completion email sent successfully', { userId, courseName });
      return { success: true, message: 'Completion email sent' };
    } else {
      throw new Error('Failed to send completion email');
    }

  } catch (error) {
    logger.error('Error sending completion email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Payment confirmation email
export const sendPaymentConfirmationEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, firstName, email, courseName, amount, transactionId, invoiceUrl } = 
      SendPaymentConfirmationEmailSchema.parse(request.data);

    const template = EmailTemplates.paymentConfirmationEmail({
      firstName,
      courseName,
      amount,
      transactionId,
      invoiceUrl
    });

    const success = await emailService.sendEmail({
      to: email,
      template
    });

    if (success) {
      logger.info('Payment confirmation email sent successfully', { userId, transactionId });
      return { success: true, message: 'Payment confirmation email sent' };
    } else {
      throw new Error('Failed to send payment confirmation email');
    }

  } catch (error) {
    logger.error('Error sending payment confirmation email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// University invite email
export const sendUniversityInviteEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { firstName, email, universityName, inviterName, acceptUrl, role } = 
      SendUniversityInviteEmailSchema.parse(request.data);

    const template = EmailTemplates.universityInviteEmail({
      firstName,
      universityName,
      inviterName,
      acceptUrl,
      role
    });

    const success = await emailService.sendEmail({
      to: email,
      template
    });

    if (success) {
      logger.info('University invite email sent successfully', { email, universityName });
      return { success: true, message: 'University invite email sent' };
    } else {
      throw new Error('Failed to send university invite email');
    }

  } catch (error) {
    logger.error('Error sending university invite email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Bulk email sending
export const sendBulkEmails = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Check if user has admin role
    const userDoc = await require('firebase-admin').firestore()
      .collection('users').doc(request.auth.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('Admin access required for bulk email operations');
    }

    const { emails } = SendBulkEmailSchema.parse(request.data);

    const emailOptions = emails.map(emailData => {
      let template;
      
      switch (emailData.templateType) {
        case 'welcome':
          template = EmailTemplates.welcomeEmail(emailData.data as any);
          break;
        case 'enrollment':
          template = EmailTemplates.courseEnrollmentEmail(emailData.data as any);
          break;
        case 'completion':
          template = EmailTemplates.courseCompletionEmail(emailData.data as any);
          break;
        case 'payment':
          template = EmailTemplates.paymentConfirmationEmail(emailData.data as any);
          break;
        case 'invite':
          template = EmailTemplates.universityInviteEmail(emailData.data as any);
          break;
        default:
          throw new Error(`Unknown template type: ${emailData.templateType}`);
      }

      return {
        to: emailData.to,
        template
      };
    });

    const results = await emailService.sendBulkEmails(emailOptions);
    const successCount = results.filter(r => r).length;
    const failureCount = results.length - successCount;

    logger.info('Bulk email operation completed', { 
      total: emails.length, 
      success: successCount, 
      failed: failureCount 
    });

    return { 
      success: true, 
      message: 'Bulk email operation completed',
      results: {
        total: emails.length,
        success: successCount,
        failed: failureCount
      }
    };

  } catch (error) {
    logger.error('Error sending bulk emails:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Email delivery status check
export const getEmailDeliveryStatus = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { messageId } = z.object({
      messageId: z.string()
    }).parse(request.data);

    const status = await emailService.getDeliveryStatus(messageId);

    return { success: true, status };

  } catch (error) {
    logger.error('Error getting email delivery status:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});