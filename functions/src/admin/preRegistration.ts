/**
 * Pre-Registration Cloud Functions
 *
 * Allows platform admins to pre-register company admins.
 * The user receives an email with a link to complete registration.
 */

import * as admin from 'firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as crypto from 'crypto';
import { sendPreRegistrationEmail } from '../email/templates/preRegistration';

const db = admin.firestore();

interface CreatePreRegistrationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

interface CreatePreRegistrationResponse {
  success: boolean;
  preRegistrationId: string;
  message: string;
}

interface VerifyPreRegistrationInput {
  token: string;
}

interface VerifyPreRegistrationResponse {
  valid: boolean;
  preRegistrationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
}

/**
 * Create a pre-registration for a new company admin
 * Only platform admins (ADMIN role) can call this function
 */
export const createPreRegistration = onCall({
  region: 'europe-west1',
  memory: '256MiB',
  cors: [
    'https://masterclass.dma.hu',
    'https://academion.hu',
    'https://dmaapp-477d4.web.app',
    'https://dmaapp-477d4.firebaseapp.com',
    'http://localhost:3000'
  ]
}, async (request): Promise<CreatePreRegistrationResponse> => {
  // 1. Authentication check
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges');
  }

  // 2. Permission check - only ADMIN role can create pre-registrations
  const adminClaims = request.auth.token;
  const adminRole = adminClaims.role as string | undefined;

  if (adminRole !== 'ADMIN' && adminRole !== 'admin') {
    console.warn(`[createPreRegistration] Permission denied for user ${request.auth.uid} with role ${adminRole}`);
    throw new HttpsError('permission-denied', 'Csak platform adminisztrátorok hozhatnak létre előregisztrációt');
  }

  // 3. Input validation
  const { firstName, lastName, email, phone, companyName } = request.data as CreatePreRegistrationInput;

  if (!firstName?.trim()) {
    throw new HttpsError('invalid-argument', 'A keresztnév megadása kötelező');
  }
  if (!lastName?.trim()) {
    throw new HttpsError('invalid-argument', 'A vezetéknév megadása kötelező');
  }
  if (!email?.trim()) {
    throw new HttpsError('invalid-argument', 'Az email cím megadása kötelező');
  }
  if (!phone?.trim()) {
    throw new HttpsError('invalid-argument', 'A telefonszám megadása kötelező');
  }
  if (!companyName?.trim()) {
    throw new HttpsError('invalid-argument', 'A cégnév megadása kötelező');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailRegex.test(normalizedEmail)) {
    throw new HttpsError('invalid-argument', 'Érvénytelen email cím formátum');
  }

  console.log(`[createPreRegistration] Admin ${request.auth.uid} creating pre-registration for ${normalizedEmail}`);

  // 4. Check if email is already registered in Firebase Auth
  try {
    await admin.auth().getUserByEmail(normalizedEmail);
    // If we get here, the user exists
    throw new HttpsError('already-exists', 'Ez az email cím már regisztrálva van a rendszerben');
  } catch (err: any) {
    if (err.code !== 'auth/user-not-found') {
      // Re-throw if it's our custom error or unexpected error
      if (err instanceof HttpsError) throw err;
      console.error('[createPreRegistration] Error checking email:', err);
      throw new HttpsError('internal', 'Email ellenőrzés sikertelen');
    }
    // User not found - good, we can proceed
  }

  // 5. Check for existing pending pre-registration with same email
  const existingQuery = await db.collection('preRegistrations')
    .where('email', '==', normalizedEmail)
    .where('status', '==', 'pending')
    .limit(1)
    .get();

  if (!existingQuery.empty) {
    throw new HttpsError('already-exists', 'Ehhez az email címhez már van függőben lévő előregisztráció');
  }

  // 6. Generate secure token and expiration date
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  // 7. Create pre-registration document
  const preRegData = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    phone: phone.trim(),
    companyName: companyName.trim(),
    token,
    expiresAt: Timestamp.fromDate(expiresAt),
    status: 'pending' as const,
    createdBy: request.auth.uid,
    createdByEmail: request.auth.token.email || 'unknown',
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('preRegistrations').add(preRegData);
  console.log(`[createPreRegistration] Created pre-registration ${docRef.id} for ${normalizedEmail}`);

  // 8. Send pre-registration email
  const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
  const registerUrl = `${APP_URL}/regisztracio?preregister=${token}`;

  try {
    const emailResult = await sendPreRegistrationEmail({
      firstName: firstName.trim(),
      email: normalizedEmail,
      companyName: companyName.trim(),
      registerUrl,
    });

    if (!emailResult.success) {
      console.error('[createPreRegistration] Failed to send email:', emailResult.error);
      // Don't throw - the pre-registration was created successfully
      // Admin can resend the email later if needed
    } else {
      console.log(`[createPreRegistration] Email sent to ${normalizedEmail}`);
    }
  } catch (emailError: any) {
    console.error('[createPreRegistration] Email send error:', emailError);
    // Continue - pre-registration is still valid
  }

  return {
    success: true,
    preRegistrationId: docRef.id,
    message: `Előregisztráció létrehozva és email elküldve: ${normalizedEmail}`,
  };
});

/**
 * Verify a pre-registration token and return the pre-filled data
 * This function is called when a user visits the register page with a preregister token
 * No authentication required (user is not logged in yet)
 */
export const verifyPreRegistration = onCall({
  region: 'europe-west1',
  memory: '256MiB',
  cors: [
    'https://masterclass.dma.hu',
    'https://academion.hu',
    'https://dmaapp-477d4.web.app',
    'https://dmaapp-477d4.firebaseapp.com',
    'http://localhost:3000'
  ]
}, async (request): Promise<VerifyPreRegistrationResponse> => {
  const { token } = request.data as VerifyPreRegistrationInput;

  if (!token?.trim()) {
    throw new HttpsError('invalid-argument', 'Token megadása kötelező');
  }

  console.log(`[verifyPreRegistration] Verifying token: ${token.substring(0, 8)}...`);

  // Find pre-registration by token
  const snapshot = await db.collection('preRegistrations')
    .where('token', '==', token.trim())
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn(`[verifyPreRegistration] Token not found: ${token.substring(0, 8)}...`);
    throw new HttpsError('not-found', 'Érvénytelen vagy lejárt előregisztrációs link');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  // Check status
  if (data.status === 'completed') {
    console.warn(`[verifyPreRegistration] Token already used: ${doc.id}`);
    throw new HttpsError('failed-precondition', 'Ez az előregisztráció már fel lett használva');
  }

  if (data.status === 'expired') {
    console.warn(`[verifyPreRegistration] Token expired (marked): ${doc.id}`);
    throw new HttpsError('failed-precondition', 'Ez az előregisztrációs link lejárt');
  }

  // Check expiration date
  const now = new Date();
  const expiresAt = data.expiresAt?.toDate();

  if (expiresAt && expiresAt < now) {
    // Mark as expired
    await doc.ref.update({ status: 'expired' });
    console.warn(`[verifyPreRegistration] Token expired (date check): ${doc.id}`);
    throw new HttpsError('failed-precondition', 'Ez az előregisztrációs link lejárt');
  }

  console.log(`[verifyPreRegistration] Token valid for ${data.email}`);

  return {
    valid: true,
    preRegistrationId: doc.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    companyName: data.companyName,
  };
});

/**
 * Mark a pre-registration as completed
 * Called internally after successful registration
 */
export async function markPreRegistrationCompleted(
  preRegistrationId: string,
  userId: string
): Promise<void> {
  try {
    await db.collection('preRegistrations').doc(preRegistrationId).update({
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
      completedUserId: userId,
    });
    console.log(`[markPreRegistrationCompleted] Pre-registration ${preRegistrationId} marked as completed for user ${userId}`);
  } catch (error: any) {
    console.error(`[markPreRegistrationCompleted] Failed to update pre-registration ${preRegistrationId}:`, error);
    // Don't throw - this is a non-critical operation
  }
}
