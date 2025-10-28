import * as functions from 'firebase-functions';
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { RoleManager, UserRole } from './auth/roleManager';
import { requireAuth, requireRole } from './middleware/authMiddleware';
import { emailService } from './services/emailService';

// Initialize Firebase Admin only if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const auth = admin.auth();
const firestore = admin.firestore();

// Zod schemas
const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, 'ID token kötelező.'),
});

const registerSchema = z.object({
  email: z.string().email('Érvénytelen email cím.'),
  password: z.string().min(6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie.'),
  firstName: z.string().min(1, 'A keresztnév kötelező.'),
  lastName: z.string().min(1, 'A vezetéknév kötelező.'),
});

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

const passwordResetSchema = z.object({
  email: z.string().email('Érvénytelen email cím.'),
});

const setUserRoleSchema = z.object({
  userId: z.string().min(1, 'Felhasználó ID kötelező.'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Érvénytelen szerepkör.' }) }),
});

const impersonateUserSchema = z.object({
  userId: z.string().min(1, 'Felhasználó ID kötelező.'),
});

const createUserProfileSchema = z.object({
  uid: z.string().min(1, 'User ID kötelező.'),
  email: z.string().email('Érvénytelen email cím.'),
  firstName: z.string().min(1, 'Keresztnév kötelező.').optional(),
  lastName: z.string().min(1, 'Vezetéknév kötelező.').optional(),
  photoURL: z.string().url('Érvénytelen kép URL.').optional(),
  role: z.nativeEnum(UserRole).optional(),
  universityId: z.string().optional(),
  departmentId: z.string().optional()
});

/**
 * Firebase login - exchange Firebase ID token for backend JWT
 */
export const firebaseLogin = onCall(async (request) => {
  try {
    // Validate input data
    const data = firebaseLoginSchema.parse(request.data);
    const { idToken } = data;

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await firestore.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    
    if (!userData) {
      throw new Error('Felhasználói adatok nem találhatók.');
    }
    
    // Create a custom JWT token for the backend (optional - you can use Firebase ID token directly)
    const customToken = await auth.createCustomToken(uid);

    return {
      success: true,
      user: {
        id: uid,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'STUDENT',
        avatar: userData.avatar || null,
        bio: userData.bio || null,
        createdAt: userData.createdAt || null,
        updatedAt: userData.updatedAt || null,
      },
      accessToken: customToken,
    };

  } catch (error: any) {
    console.error('❌ firebaseLogin error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Register new user
 */
export const register = onCall(async (request) => {
  try {
    // Validate input data
    const data = registerSchema.parse(request.data);
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUserQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      throw new Error('Már létezik felhasználó ezzel az email címmel.');
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Create user document in Firestore
    const userData = {
      id: userRecord.uid,
      email,
      firstName,
      lastName,
      role: 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestore.collection('users').doc(userRecord.uid).set(userData);

    // Send welcome email (don't fail registration if email fails)
    try {
      await emailService.sendWelcomeEmail({
        email: email,
        displayName: firstName
      });
      console.log('✅ Welcome email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail signup if email fails
    }

    // Create custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    return {
      success: true,
      user: userData,
      accessToken: customToken,
    };

  } catch (error: any) {
    console.error('❌ register error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Update user profile
 */
export const updateProfile = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Validate input data
    const data = updateProfileSchema.parse(request.data);

    // Update user document in Firestore
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await firestore.collection('users').doc(userId).update(updateData);

    // Get updated user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('Felhasználói adatok nem találhatók.');
    }

    return {
      success: true,
      user: {
        id: userId,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'STUDENT',
        avatar: userData.avatar || null,
        bio: userData.bio || null,
        createdAt: userData.createdAt || null,
        updatedAt: userData.updatedAt || null,
      },
    };

  } catch (error: any) {
    console.error('❌ updateProfile error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Send password reset email via auth service
 */
export const sendAuthPasswordReset = onCall(async (request) => {
  try {
    // Validate input data
    const data = passwordResetSchema.parse(request.data);
    const { email } = data;

    // Check if user exists in Firestore
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      throw new Error('Nem található felhasználó ezzel az email címmel.');
    }

    // Generate password reset link
    const link = await auth.generatePasswordResetLink(email);

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, link);

    console.log('✅ Password reset email sent successfully to:', email);

    return { 
      success: true, 
      message: 'Jelszó visszaállítási email elküldve.' 
    };

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    // Use HttpsError for proper error handling
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Nem sikerült elküldeni a jelszó visszaállítási emailt.'
    );
  }
});

/**
 * Set user role (admin only)
 * This is the exact implementation from DAY 3 Step 3 roadmap
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  try {
    // Require admin role
    await requireRole(context, [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]);
    
    // Validate input data
    const validatedData = setUserRoleSchema.parse(data);
    const { userId, role } = validatedData;
    
    // Validate role change
    const requestorRole = await RoleManager.getUserRole(context.auth!.uid);
    
    if (!RoleManager.canChangeRole(requestorRole!, role)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot assign this role'
      );
    }
    
    // Set the role
    await RoleManager.setUserRole(userId, role);
    
    // Log the action
    await admin.firestore().collection('auditLogs').add({
      action: 'ROLE_CHANGE',
      performedBy: context.auth!.uid,
      targetUser: userId,
      newRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Role updated successfully' };
    
  } catch (error: any) {
    console.error('Set user role error:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Validációs hiba',
        error.errors
      );
    }
    
    throw error;
  }
});

/**
 * Get current user profile with role
 * This is the exact implementation from DAY 3 Step 3 roadmap
 */
export const getCurrentUser = functions.https.onCall(async (data, context) => {
  try {
    const auth = await requireAuth(context);
    
    // Get user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(auth.uid)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found'
      );
    }
    
    const userData = userDoc.data();
    
    return {
      uid: auth.uid,
      email: auth.email,
      role: auth.role,
      ...userData,
      // Don't send sensitive fields
      password: undefined,
      resetToken: undefined
    };
    
  } catch (error: any) {
    console.error('Get current user error:', error);
    throw error;
  }
});

/**
 * Impersonate user (admin only, for support)
 * This is the exact implementation from DAY 3 Step 3 roadmap
 */
export const impersonateUser = functions.https.onCall(async (data, context) => {
  try {
    await requireRole(context, [UserRole.ADMIN]);
    
    // Validate input data
    const validatedData = impersonateUserSchema.parse(data);
    const { userId } = validatedData;
    
    // Create custom token for impersonation
    const customToken = await admin.auth().createCustomToken(userId, {
      impersonatedBy: context.auth!.uid,
      impersonationExpiry: Date.now() + 3600000 // 1 hour
    });
    
    // Log impersonation
    await admin.firestore().collection('auditLogs').add({
      action: 'IMPERSONATION_START',
      performedBy: context.auth!.uid,
      targetUser: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, token: customToken };
    
  } catch (error: any) {
    console.error('Impersonate user error:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Validációs hiba',
        error.errors
      );
    }
    
    throw error;
  }
});

/**
 * Create user profile (for new registrations)
 * This function is called by the AuthContext during registration
 */
export const createUserProfile = functions.https.onCall(async (data, context) => {
  try {
    // Validate input data
    const validatedData = createUserProfileSchema.parse(data);
    const { uid, email, firstName, lastName, photoURL, role, universityId, departmentId } = validatedData;

    // Set default role if not provided
    const userRole = role || UserRole.STUDENT;

    // Create user document in Firestore
    const userData = {
      uid,
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      displayName: firstName && lastName ? `${firstName} ${lastName}` : email.split('@')[0],
      photoURL: photoURL || null,
      role: userRole,
      universityId: universityId || null,
      departmentId: departmentId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      emailVerified: false,
      isActive: true,
      onboardingCompleted: false
    };

    // Create user document
    await admin.firestore().collection('users').doc(uid).set(userData);

    // Set user role in custom claims
    await RoleManager.setUserRole(uid, userRole, {
      universityId,
      departmentId
    });

    // Send welcome email
    if (emailService && emailService.sendWelcomeEmail) {
      try {
        await emailService.sendWelcomeEmail(
          email,
          firstName || email.split('@')[0]
        );
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail user creation if email fails
      }
    }

    // Log user creation
    await admin.firestore().collection('auditLogs').add({
      action: 'USER_CREATED',
      targetUser: uid,
      userEmail: email,
      role: userRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: 'registration'
    });

    console.log(`✅ User profile created successfully: ${uid} (${email})`);

    return {
      success: true,
      message: 'User profile created successfully',
      user: {
        uid,
        email,
        role: userRole,
        displayName: userData.displayName
      }
    };

  } catch (error: any) {
    console.error('Create user profile error:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Validációs hiba',
        error.errors
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Felhasználói profil létrehozása sikertelen',
      error.message
    );
  }
}); 