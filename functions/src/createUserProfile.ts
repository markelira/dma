/**
 * Create User Profile Cloud Function
 *
 * Creates a user document in Firestore with initial data including emailVerified: false
 * Called during registration to ensure user has a complete profile
 *
 * Also automatically links the user to a company if they have a pending invite
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as z from 'zod';
import { linkEmployeeByEmail } from './company/linkEmployeeByEmail';

const firestore = admin.firestore();

// Input validation schema
const CreateUserProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional(),
});

/**
 * Create user profile in Firestore
 */
export const createUserProfile = onCall({
  cors: true,
  region: 'us-central1',
  invoker: 'public', // Allow allUsers IAM permission for Cloud Run
}, async (request) => {
  logger.info('🔵 [createUserProfile] Function invoked', {
    hasAuth: !!request.auth,
    origin: request.rawRequest?.headers?.origin,
    method: request.rawRequest?.method,
    timestamp: new Date().toISOString()
  });

  try {
    // Input validation
    const validatedData = CreateUserProfileSchema.parse(request.data);

    const { uid, email, firstName, lastName, role } = validatedData;

    logger.info(`Creating user profile for uid: ${uid}, email: ${email}`);

    // Check if user document already exists
    const existingUser = await firestore.collection('users').doc(uid).get();
    if (existingUser.exists) {
      logger.info(`User profile already exists for uid: ${uid}`);
      return {
        success: true,
        message: 'User profile already exists',
        user: existingUser.data()
      };
    }

    // Create user document with emailVerified: false
    const userData = {
      id: uid,
      uid: uid,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'STUDENT',
      emailVerified: false, // CRITICAL: Set to false initially
      profilePictureUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await firestore.collection('users').doc(uid).set(userData);

    logger.info(`User profile created successfully for uid: ${uid}`);

    // 🔗 Check if this user has a pending company invite and auto-link
    let companyLinkResult = null;
    try {
      companyLinkResult = await linkEmployeeByEmail(uid, email);
      if (companyLinkResult.linked) {
        logger.info(`🎉 User ${uid} automatically linked to company ${companyLinkResult.companyId}`);
      }
    } catch (linkError: any) {
      logger.error('Error checking/linking employee invite:', linkError);
      // Don't throw - user profile was created successfully
    }

    return {
      success: true,
      message: 'User profile created successfully',
      user: userData,
      companyLink: companyLinkResult,
    };

  } catch (error: any) {
    logger.error('Create user profile error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Érvénytelen paraméterek',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Felhasználói profil létrehozása sikertelen'
    };
  }
});
