import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { emailService } from './services/emailService';
import { logger } from './utils/logger';

/**
 * Trigger: Send welcome email on user creation
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    if (user.email) {
      await emailService.sendWelcomeEmail({
        email: user.email,
        displayName: user.displayName || undefined
      });
      
      logger.info('Welcome email sent to new user:', user.email);
    }
  } catch (error) {
    logger.error('Failed to send welcome email on user creation:', error);
  }
});

/**
 * Trigger: Send enrollment confirmation
 */
export const onEnrollmentCreated = onDocumentCreated('enrollments/{enrollmentId}', async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const enrollment = snapshot.data();
    
    // Get user and course data
    const [userDoc, courseDoc] = await Promise.all([
      admin.firestore().collection('users').doc(enrollment.userId).get(),
      admin.firestore().collection('courses').doc(enrollment.courseId).get()
    ]);
    
    const user = userDoc.data();
    const course = courseDoc.data();
    
    if (user && course) {
      await emailService.sendEnrollmentConfirmation(
        { email: user.email, name: user.displayName || user.firstName },
        { 
          title: course.title,
          instructor: course.instructorName,
          startDate: course.startDate
        }
      );
      
      logger.info('Enrollment confirmation sent to:', user.email);
    }
  } catch (error) {
    logger.error('Failed to send enrollment confirmation:', error);
  }
});

/**
 * Trigger: Send certificate email on completion
 */
export const onCertificateEarned = onDocumentCreated('certificates/{certificateId}', async (event) => {
  try {
    const snapshot = event.data;
    if (!snapshot) return;
    
    const certificate = snapshot.data();
    
    // Get user and course data
    const [userDoc, courseDoc] = await Promise.all([
      admin.firestore().collection('users').doc(certificate.userId).get(),
      admin.firestore().collection('courses').doc(certificate.courseId).get()
    ]);
    
    const user = userDoc.data();
    const course = courseDoc.data();
    
    if (user && course) {
      await emailService.sendCertificateEmail(
        { email: user.email, name: user.displayName || user.firstName },
        { 
          title: course.title,
          completionDate: certificate.completionDate?.toDate()?.toLocaleDateString('hu-HU') || new Date().toLocaleDateString('hu-HU'),
          certificateUrl: certificate.downloadUrl
        }
      );
      
      logger.info('Certificate email sent to:', user.email);
    }
  } catch (error) {
    logger.error('Failed to send certificate email:', error);
  }
});

/**
 * Trigger: Send payment confirmation on successful payment
 */
export const onPaymentCompleted = onDocumentUpdated('payments/{paymentId}', async (event) => {
  try {
    const beforeSnapshot = event.data?.before;
    const afterSnapshot = event.data?.after;
    
    if (!beforeSnapshot || !afterSnapshot) return;
    
    const before = beforeSnapshot.data();
    const after = afterSnapshot.data();
    
    // Only trigger if status changed to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      // Get user data
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(after.userId)
        .get();
      
      const user = userDoc.data();
      
      if (user) {
        await emailService.sendPaymentReceipt(
          { email: user.email, name: user.displayName || user.firstName },
          {
            amount: after.amount,
            currency: after.currency || 'HUF',
            description: after.description,
            invoiceNumber: after.invoiceNumber,
            date: after.completedAt?.toDate()?.toLocaleDateString('hu-HU') || new Date().toLocaleDateString('hu-HU')
          }
        );
        
        logger.info('Payment receipt sent to:', user.email);
      }
    }
  } catch (error) {
    logger.error('Failed to send payment receipt:', error);
  }
});

/**
 * Scheduled: Send course reminders
 */
export const sendCourseReminders = onSchedule('0 9 * * *', async (event) => {
  try {
    // Get all active enrollments with no recent activity
    const enrollments = await admin.firestore()
      .collection('enrollments')
      .where('status', '==', 'active')
      .where('lastActivityDate', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
      .get();
    
    let emailsSent = 0;
    
    for (const doc of enrollments.docs) {
      const enrollment = doc.data();
      
      // Get user data
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(enrollment.userId)
        .get();
      
      const user = userDoc.data();
      
      if (user && user.emailPreferences?.reminders !== false) {
        // Send reminder email
        await emailService.sendEmail({
          to: user.email,
          subject: 'Ne felejtse el folytatni a tanulást! 📚',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📚 Ideje folytatni a tanulást!</h1>
                </div>
                <div class="content">
                  <h2>Kedves ${user.displayName || user.firstName}!</h2>
                  <p>Már egy hete nem lépett be az ELIRA platformra.</p>
                  <p>Ne hagyja abba! Folytassa kurzusait és érje el céljait.</p>
                  
                  <h3>💡 Miért érdemes folytatni?</h3>
                  <ul>
                    <li>🎯 Közelebb kerül céljai eléréséhez</li>
                    <li>🧠 Megőrzi a már megszerzett tudást</li>
                    <li>🏆 Hamarabb szerzi meg a tanúsítványt</li>
                    <li>💼 Fejleszti karrierlehetőségeit</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="https://elira.com/dashboard" class="button">Folytatás most</a>
                  </div>
                  
                  <p><em>Ez csak egy baráti emlékeztető. Ha nem szeretne több ilyen emailt kapni, 
                  beállíthatja preferenciáit a profiljában.</em></p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        emailsSent++;
      }
    }
    
    logger.info(`Course reminder emails sent: ${emailsSent}`);
  } catch (error) {
    logger.error('Failed to send course reminders:', error);
  }
});

/**
 * Scheduled: Send weekly digest emails
 */
export const sendWeeklyDigest = onSchedule('0 18 * * 0', async (event) => {
    try {
      // Get users who want weekly digest
      const users = await admin.firestore()
        .collection('users')
        .where('emailPreferences.weeklyDigest', '==', true)
        .get();
      
      let emailsSent = 0;
      
      for (const userDoc of users.docs) {
        const user = userDoc.data();
        
        // Get user's progress and new content
        const [enrollments, newCourses] = await Promise.all([
          admin.firestore()
            .collection('enrollments')
            .where('userId', '==', userDoc.id)
            .where('status', '==', 'active')
            .get(),
          admin.firestore()
            .collection('courses')
            .where('createdAt', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .limit(3)
            .get()
        ]);
        
        // Send weekly digest
        await emailService.sendEmail({
          to: user.email,
          subject: 'ELIRA heti összefoglaló 📊',
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                .stats { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📊 Heti összefoglaló</h1>
                  <p>Az Ön tanulási fejlődése</p>
                </div>
                <div class="content">
                  <h2>Kedves ${user.displayName || user.firstName}!</h2>
                  
                  <div class="stats">
                    <h3>📈 Az Ön statisztikái</h3>
                    <p><strong>Aktív kurzusok:</strong> ${enrollments.size}</p>
                    <p><strong>Ez a hét:</strong> Remek munka a tanulással!</p>
                  </div>
                  
                  ${newCourses.size > 0 ? `
                    <h3>🆕 Új kurzusok</h3>
                    <ul>
                      ${newCourses.docs.map(doc => `<li>${doc.data().title}</li>`).join('')}
                    </ul>
                  ` : ''}
                  
                  <div style="text-align: center;">
                    <a href="https://elira.com/dashboard" class="button">Irány a műszerfal</a>
                    <a href="https://elira.com/courses" class="button">Kurzusok böngészése</a>
                  </div>
                  
                  <p style="font-size: 12px; color: #666; margin-top: 30px;">
                    <a href="https://elira.com/profile/preferences">Leiratkozás</a> a heti összefoglalóról
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        
        emailsSent++;
      }
      
      logger.info(`Weekly digest emails sent: ${emailsSent}`);
    } catch (error) {
      logger.error('Failed to send weekly digest:', error);
    }
  });