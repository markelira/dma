import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { RoleManager, UserRole } from '../auth/roleManager';

export interface AuthContext {
  uid: string;
  email: string;
  role: UserRole;
  universityId?: string;
}

/**
 * Middleware to check authentication
 * This is the exact implementation from the DAY 3 roadmap
 */
export async function requireAuth(
  context: functions.https.CallableContext
): Promise<AuthContext> {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const role = await RoleManager.getUserRole(context.auth.uid);
  
  if (!role) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User role not found'
    );
  }

  // Get university context if applicable
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();
  
  const userData = userDoc.data();

  return {
    uid: context.auth.uid,
    email: context.auth.token.email || '',
    role,
    universityId: userData?.universityId
  };
}

/**
 * Middleware to check specific permission
 * This is the exact implementation from the DAY 3 roadmap
 */
export async function requirePermission(
  context: functions.https.CallableContext,
  resource: string,
  action: string
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  if (!RoleManager.hasPermission(auth.role, resource, action)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User lacks permission for ${action} on ${resource}`
    );
  }

  return auth;
}

/**
 * Middleware to require specific role
 * This is the exact implementation from the DAY 3 roadmap
 */
export async function requireRole(
  context: functions.https.CallableContext,
  requiredRoles: UserRole[]
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  if (!requiredRoles.includes(auth.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User role ${auth.role} is not authorized`
    );
  }

  return auth;
}

/**
 * Middleware for instructor-owned resources
 * This is the exact implementation from the DAY 3 roadmap
 */
export async function requireOwnership(
  context: functions.https.CallableContext,
  resourceId: string,
  collection: string
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  // Admins bypass ownership check
  if (auth.role === UserRole.ADMIN) {
    return auth;
  }

  // Check ownership
  const doc = await admin.firestore()
    .collection(collection)
    .doc(resourceId)
    .get();
  
  if (!doc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Resource not found'
    );
  }

  const data = doc.data();
  
  if (data?.instructorId !== auth.uid && data?.ownerId !== auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User does not own this resource'
    );
  }

  return auth;
}

/**
 * Middleware for university-scoped resources
 * This is the exact implementation from the DAY 3 roadmap
 */
export async function requireUniversityContext(
  context: functions.https.CallableContext,
  universityId: string
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  // Admins bypass university context
  if (auth.role === UserRole.ADMIN) {
    return auth;
  }

  // Check user belongs to university
  if (auth.universityId !== universityId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User not authorized for this university'
    );
  }

  return auth;
}

// Export enhanced middleware for those who want additional features
export { AuthMiddleware } from '../auth/authMiddleware';