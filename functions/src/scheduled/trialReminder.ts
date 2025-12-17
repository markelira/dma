/**
 * Trial Reminder Scheduled Function
 *
 * Runs daily at 10:00 AM Budapest time
 * Sends reminder emails to users whose trial ends in 3 days
 */

import * as admin from 'firebase-admin';
import { onSchedule, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { sendTrialEndingEmail } from '../email/templates/trialEnding';

const firestore = admin.firestore();

// Stripe price IDs mapped to amounts (in HUF)
const PRICE_AMOUNTS: Record<string, number> = {
  // Add your actual Stripe price IDs and amounts here
  'price_starter_monthly': 14990,
  'price_professional_monthly': 29990,
  'price_enterprise_monthly': 49990,
  // Default fallback
  'default': 14990,
};

/**
 * Get price amount for a Stripe price ID
 */
function getPriceAmount(priceId: string | undefined): number {
  if (!priceId) return PRICE_AMOUNTS['default'];
  return PRICE_AMOUNTS[priceId] || PRICE_AMOUNTS['default'];
}

/**
 * Scheduled function that runs daily at 10:00 AM Budapest time
 * Sends trial ending reminders to users whose trial ends in 3 days
 */
export const sendTrialReminders = onSchedule({
  schedule: '0 10 * * *', // Daily at 10:00 AM
  timeZone: 'Europe/Budapest',
  region: 'europe-west1',
  memory: '256MiB',
  timeoutSeconds: 300, // 5 minutes
} as ScheduleOptions, async (event) => {
  try {
    logger.info('[sendTrialReminders] Starting trial reminder check');

    // Calculate the date range for 3 days from now
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Set time to start and end of day for the target date
    const dayStart = new Date(threeDaysFromNow);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(threeDaysFromNow);
    dayEnd.setHours(23, 59, 59, 999);

    logger.info('[sendTrialReminders] Checking for trials ending between', {
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
    });

    // Query subscriptions with trialing status and trial ending in 3 days
    // Check subscriptions collection
    const subscriptionsSnapshot = await firestore
      .collection('subscriptions')
      .where('status', '==', 'trialing')
      .get();

    let emailsSent = 0;
    let emailsFailed = 0;
    const processedUsers = new Set<string>();

    for (const doc of subscriptionsSnapshot.docs) {
      const subscriptionData = doc.data();

      // Parse trial end date
      let trialEnd: Date | null = null;
      if (subscriptionData.trialEnd) {
        if (typeof subscriptionData.trialEnd === 'string') {
          trialEnd = new Date(subscriptionData.trialEnd);
        } else if (subscriptionData.trialEnd.toDate) {
          trialEnd = subscriptionData.trialEnd.toDate();
        }
      }

      // Skip if no trial end or not in our target range
      if (!trialEnd || trialEnd < dayStart || trialEnd > dayEnd) {
        continue;
      }

      const userId = subscriptionData.userId;

      // Skip if we already processed this user
      if (!userId || processedUsers.has(userId)) {
        continue;
      }
      processedUsers.add(userId);

      try {
        // Get user data
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData?.email) {
          logger.warn('[sendTrialReminders] User has no email', { userId });
          continue;
        }

        // Format trial end date
        const trialEndFormatted = trialEnd.toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Calculate days remaining
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / msPerDay);

        // Send email
        const result = await sendTrialEndingEmail({
          firstName: userData.firstName || 'Felhasználó',
          email: userData.email,
          planName: subscriptionData.planName || 'DMA Előfizetés',
          trialEndDate: trialEndFormatted,
          daysRemaining,
          amount: getPriceAmount(subscriptionData.stripePriceId),
          currency: 'huf',
        });

        if (result.success) {
          emailsSent++;
          logger.info('[sendTrialReminders] Email sent', { userId, email: userData.email });
        } else {
          emailsFailed++;
          logger.error('[sendTrialReminders] Failed to send email', {
            userId,
            error: result.error,
          });
        }
      } catch (userError: any) {
        emailsFailed++;
        logger.error('[sendTrialReminders] Error processing user', {
          userId,
          error: userError.message,
        });
      }
    }

    // Also check companies with trialing status
    const companiesSnapshot = await firestore
      .collection('companies')
      .where('subscriptionStatus', '==', 'trialing')
      .get();

    for (const doc of companiesSnapshot.docs) {
      const companyData = doc.data();

      // Parse trial end date
      let trialEnd: Date | null = null;
      if (companyData.trialEndDate) {
        if (companyData.trialEndDate.toDate) {
          trialEnd = companyData.trialEndDate.toDate();
        } else if (typeof companyData.trialEndDate === 'string') {
          trialEnd = new Date(companyData.trialEndDate);
        }
      }

      // Skip if no trial end or not in our target range
      if (!trialEnd || trialEnd < dayStart || trialEnd > dayEnd) {
        continue;
      }

      try {
        // Get company admin (owner) to send email
        const adminsSnapshot = await firestore
          .collection('companies')
          .doc(doc.id)
          .collection('admins')
          .where('isOwner', '==', true)
          .limit(1)
          .get();

        if (adminsSnapshot.empty) {
          continue;
        }

        const adminData = adminsSnapshot.docs[0].data();
        const userId = adminsSnapshot.docs[0].id;

        // Skip if we already processed this user
        if (processedUsers.has(userId)) {
          continue;
        }
        processedUsers.add(userId);

        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData?.email) {
          continue;
        }

        // Format trial end date
        const trialEndFormatted = trialEnd.toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Calculate days remaining
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / msPerDay);

        // Send email
        const result = await sendTrialEndingEmail({
          firstName: userData.firstName || 'Felhasználó',
          email: userData.email,
          planName: `${companyData.name} - Céges előfizetés`,
          trialEndDate: trialEndFormatted,
          daysRemaining,
          amount: getPriceAmount(companyData.stripePriceId),
          currency: 'huf',
        });

        if (result.success) {
          emailsSent++;
          logger.info('[sendTrialReminders] Company email sent', {
            companyId: doc.id,
            email: userData.email,
          });
        } else {
          emailsFailed++;
        }
      } catch (companyError: any) {
        emailsFailed++;
        logger.error('[sendTrialReminders] Error processing company', {
          companyId: doc.id,
          error: companyError.message,
        });
      }
    }

    logger.info('[sendTrialReminders] Completed', {
      emailsSent,
      emailsFailed,
      totalProcessed: processedUsers.size,
    });

  } catch (error: any) {
    logger.error('[sendTrialReminders] Fatal error:', error);
    throw error;
  }
});
