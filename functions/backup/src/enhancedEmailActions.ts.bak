import { onCall } from 'firebase-functions/v2/https';
import * as z from 'zod';
import { emailService } from './services/emailService';
import { logger } from './utils/logger';
import * as admin from 'firebase-admin';

// Validation schemas for enhanced email actions
const WelcomeEmailSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  displayName: z.string().optional()
});

const PasswordResetEmailSchema = z.object({
  email: z.string().email(),
  resetLink: z.string().url()
});

const EnrollmentConfirmationSchema = z.object({
  userId: z.string(),
  user: z.object({
    email: z.string().email(),
    name: z.string()
  }).strict(),
  course: z.object({
    title: z.string(),
    instructor: z.string(),
    startDate: z.string().optional()
  }).strict()
});

const QuizCompletionSchema = z.object({
  userId: z.string(),
  user: z.object({
    email: z.string().email(),
    name: z.string()
  }).strict(),
  quiz: z.object({
    title: z.string(),
    score: z.number().min(0).max(100),
    passed: z.boolean(),
    certificateUrl: z.string().url().optional()
  }).strict()
});

const PaymentReceiptSchema = z.object({
  userId: z.string(),
  user: z.object({
    email: z.string().email(),
    name: z.string()
  }).strict(),
  payment: z.object({
    amount: z.number(),
    currency: z.string(),
    description: z.string(),
    invoiceNumber: z.string(),
    date: z.string()
  }).strict()
});

const CertificateEmailSchema = z.object({
  userId: z.string(),
  user: z.object({
    email: z.string().email(),
    name: z.string()
  }).strict(),
  course: z.object({
    title: z.string(),
    completionDate: z.string(),
    certificateUrl: z.string().url()
  }).strict()
});

// Enhanced welcome email with full template
export const sendEnhancedWelcomeEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, email, displayName } = WelcomeEmailSchema.parse(request.data);

    await emailService.sendWelcomeEmail({
      email,
      displayName
    });

    logger.info('Enhanced welcome email sent successfully', { userId, email });
    return { success: true, message: 'Welcome email sent with full template' };

  } catch (error) {
    logger.error('Error sending enhanced welcome email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Enhanced password reset email
export const sendEnhancedPasswordResetEmail = onCall(async (request) => {
  try {
    const { email, resetLink } = PasswordResetEmailSchema.parse(request.data);

    await emailService.sendPasswordResetEmail(email, resetLink);

    logger.info('Enhanced password reset email sent successfully', { email });
    return { success: true, message: 'Password reset email sent with enhanced security template' };

  } catch (error) {
    logger.error('Error sending enhanced password reset email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Course enrollment confirmation email
export const sendEnrollmentConfirmationEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, user, course } = EnrollmentConfirmationSchema.parse(request.data);

    await emailService.sendEnrollmentConfirmation(user as { email: string; name: string }, course as any);

    logger.info('Enrollment confirmation email sent successfully', { userId, courseTitle: course.title });
    return { success: true, message: 'Enrollment confirmation email sent' };

  } catch (error) {
    logger.error('Error sending enrollment confirmation email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Quiz completion notification email
export const sendQuizCompletionNotification = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, user, quiz } = QuizCompletionSchema.parse(request.data);

    await emailService.sendQuizCompletionEmail(user as { email: string; name: string }, quiz as any);

    logger.info('Quiz completion notification sent successfully', { 
      userId, 
      quizTitle: quiz.title, 
      score: quiz.score,
      passed: quiz.passed 
    });
    
    return { success: true, message: 'Quiz completion notification sent' };

  } catch (error) {
    logger.error('Error sending quiz completion notification:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Payment receipt email
export const sendPaymentReceiptEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, user, payment } = PaymentReceiptSchema.parse(request.data);

    await emailService.sendPaymentReceipt(user as { email: string; name: string }, payment as any);

    logger.info('Payment receipt email sent successfully', { 
      userId, 
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount
    });
    
    return { success: true, message: 'Payment receipt email sent' };

  } catch (error) {
    logger.error('Error sending payment receipt email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Certificate achievement email
export const sendCertificateAchievementEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { userId, user, course } = CertificateEmailSchema.parse(request.data);

    await emailService.sendCertificateEmail(user as { email: string; name: string }, course as any);

    logger.info('Certificate achievement email sent successfully', { 
      userId, 
      courseTitle: course.title,
      completionDate: course.completionDate
    });
    
    return { success: true, message: 'Certificate achievement email sent' };

  } catch (error) {
    logger.error('Error sending certificate achievement email:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Get email delivery logs (admin only)
export const getEmailDeliveryLogs = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Check if user has admin role
    const userDoc = await admin.firestore()
      .collection('users').doc(request.auth.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('Admin access required for email delivery logs');
    }

    const { limit = 50, offset = 0, status } = z.object({
      limit: z.number().optional(),
      offset: z.number().optional(),
      status: z.enum(['sent', 'failed']).optional()
    }).parse(request.data);

    let query = admin.firestore()
      .collection('emailLogs')
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .offset(offset);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { 
      success: true, 
      logs,
      total: snapshot.size,
      hasMore: snapshot.size === limit
    };

  } catch (error) {
    logger.error('Error getting email delivery logs:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});

// Email statistics (admin only)
export const getEmailStatistics = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Check if user has admin role
    const userDoc = await admin.firestore()
      .collection('users').doc(request.auth.uid).get();
    
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new Error('Admin access required for email statistics');
    }

    const { days = 30 } = z.object({
      days: z.number().optional()
    }).parse(request.data);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get email statistics
    const [sentSnapshot, failedSnapshot] = await Promise.all([
      admin.firestore()
        .collection('emailLogs')
        .where('status', '==', 'sent')
        .where('sentAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .get(),
      admin.firestore()
        .collection('emailLogs')
        .where('status', '==', 'failed')
        .where('sentAt', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .get()
    ]);

    const statistics = {
      totalSent: sentSnapshot.size,
      totalFailed: failedSnapshot.size,
      successRate: sentSnapshot.size / (sentSnapshot.size + failedSnapshot.size) * 100,
      periodDays: days,
      lastUpdated: new Date().toISOString()
    };

    return { success: true, statistics };

  } catch (error) {
    logger.error('Error getting email statistics:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});