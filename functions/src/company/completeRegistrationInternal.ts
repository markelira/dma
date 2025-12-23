/**
 * Internal Registration Completion Helper
 *
 * This is the core business logic for completing registration.
 * Can be called from both the Cloud Function and the Stripe webhook.
 */
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';
import { CompanyAdmin } from '../types/company';
import { linkEmployeeByEmail } from './linkEmployeeByEmail';
import { sendWelcomeEmail } from '../email/templates/welcome';
import { sendEmployeeWelcomeEmail } from '../email/templates/employeeWelcome';

export interface InternalRegistrationInput {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  billingEmail?: string;
  industry?: string;
  companySize?: string;
}

export interface InternalRegistrationResponse {
  success: boolean;
  companyId: string;
  userId: string;
  linkedToInvite?: boolean;
  alreadyRegistered?: boolean;
  message?: string;
}

/**
 * Complete registration internally - creates company and user documents
 * This function is idempotent - safe to call multiple times
 * Uses transaction to prevent race conditions between frontend and webhook
 */
export async function completeRegistrationInternal(
  input: InternalRegistrationInput
): Promise<InternalRegistrationResponse> {
  const db = admin.firestore();
  const auth = admin.auth();

  const { userId, firstName, lastName, email, phone, companyName, billingEmail, industry, companySize } = input;

  // Validate required fields first (before transaction)
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
    throw new Error('Missing required fields: firstName, lastName, email, phone');
  }

  // Apply fallbacks for optional fields
  const finalCompanyName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;
  const finalBillingEmail = billingEmail?.trim()?.toLowerCase() || email.trim().toLowerCase();

  logger.info('📝 [completeRegistrationInternal] Processing registration:', {
    userId,
    email: email.substring(0, 5) + '...',
    companyName: finalCompanyName
  });

  // Generate company slug from name
  const slug = finalCompanyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50);

  // Check if slug already exists (outside transaction, acceptable race condition)
  const existingCompanyQuery = await db
    .collection('companies')
    .where('slug', '==', slug)
    .limit(1)
    .get();

  let finalSlug = slug;
  if (!existingCompanyQuery.empty) {
    finalSlug = `${slug}-${Date.now()}`;
    logger.info(`⚠️ [completeRegistrationInternal] Slug collision detected, using: ${finalSlug}`);
  }

  // Pre-generate company ID
  const companyRef = db.collection('companies').doc();
  const companyId = companyRef.id;
  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  // Use transaction to prevent race conditions
  // This ensures that concurrent calls don't both pass the idempotency check
  const result = await db.runTransaction(async (transaction) => {
    // Idempotency check inside transaction - atomic read
    const existingUserDoc = await transaction.get(db.collection('users').doc(userId));

    if (existingUserDoc.exists) {
      const userData = existingUserDoc.data();
      if (userData?.companyId) {
        logger.warn(`⚠️ [completeRegistrationInternal] User ${userId} already registered with company ${userData.companyId}`);
        return {
          alreadyRegistered: true,
          companyId: userData.companyId
        };
      }
    }

    // Prepare company document
    const companyData: any = {
      name: finalCompanyName,
      slug: finalSlug,
      billingEmail: finalBillingEmail,
      plan: 'basic',
      status: 'active',
      subscriptionStatus: 'none', // Will be updated by subscription handlers
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (industry) companyData.industry = industry;
    if (companySize) companyData.companySize = companySize;

    // Prepare admin document
    const adminData: Omit<CompanyAdmin, 'id'> = {
      userId,
      companyId,
      email: email.trim().toLowerCase(),
      name: fullName,
      role: 'owner',
      permissions: {
        canManageEmployees: true,
        canViewReports: true,
        canManageBilling: true,
        canManageMasterclasses: true,
      },
      status: 'active',
      addedBy: userId,
      addedAt: FieldValue.serverTimestamp() as admin.firestore.Timestamp,
    };

    // Prepare user document
    const userDocData = {
      id: userId,
      uid: userId,
      email: email.trim().toLowerCase(),
      emailVerified: true,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      role: 'COMPANY_ADMIN',
      companyId: companyId,
      companyRole: 'owner',
      profilePictureUrl: null,
      title: 'Owner',
      bio: `Owner of ${finalCompanyName}`,
      institution: finalCompanyName,
      credentials: [],
      specialties: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Write all documents in transaction
    transaction.set(companyRef, companyData);
    transaction.set(db.collection('companies').doc(companyId).collection('admins').doc(userId), adminData);
    transaction.set(db.collection('users').doc(userId), userDocData);

    return {
      alreadyRegistered: false,
      companyId: companyId
    };
  });

  // If already registered, return early
  if (result.alreadyRegistered) {
    return {
      success: true,
      companyId: result.companyId,
      userId: userId,
      alreadyRegistered: true,
      message: 'User already registered (idempotent)'
    };
  }

  logger.info('✅ [completeRegistrationInternal] Transaction completed, documents created');

  // Set custom claims
  const customClaims = {
    role: 'COMPANY_ADMIN',
    companyId: companyId,
    companyRole: 'owner',
  };

  await auth.setCustomUserClaims(userId, customClaims);
  logger.info('✅ [completeRegistrationInternal] Custom claims set');

  // Check for pending employee invite
  let linkedToInvite = false;
  try {
    const linkResult = await linkEmployeeByEmail(userId, email.trim().toLowerCase());
    if (linkResult.linked) {
      linkedToInvite = true;
      logger.info('🎉 [completeRegistrationInternal] User auto-linked to company invite');
    }
  } catch (linkError: any) {
    logger.warn('⚠️ [completeRegistrationInternal] Error checking employee invite:', linkError.message);
  }

  logger.info(`✅ [completeRegistrationInternal] Registration completed for ${fullName} (${companyId})`);

  // Send welcome email (fire-and-forget)
  const emailData = {
    firstName: firstName.trim(),
    email: email.trim().toLowerCase(),
  };

  const sendEmailFn = linkedToInvite ? sendEmployeeWelcomeEmail : sendWelcomeEmail;
  sendEmailFn(emailData).catch((err) => {
    logger.warn(`⚠️ [completeRegistrationInternal] Error sending email:`, err.message);
  });

  return {
    success: true,
    companyId,
    userId,
    linkedToInvite,
    message: 'Registration successful',
  };
}
