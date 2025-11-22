/**
 * Instructor CRUD Operations
 * Instructors are separate entities (not users), managed through admin dashboard
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { z } from 'zod';

const firestore = admin.firestore();

// Valid instructor roles
const VALID_INSTRUCTOR_ROLES = ['MENTOR', 'SZEREPLŐ'] as const;
type InstructorRole = typeof VALID_INSTRUCTOR_ROLES[number];

// Zod schema for instructor creation
const createInstructorSchema = z.object({
  name: z.string().min(1, 'A név kötelező.'),
  title: z.string().optional(),
  bio: z.string().optional(),
  profilePictureUrl: z.string().url('Érvényes URL szükséges.').optional().or(z.literal('')),
  role: z.enum(VALID_INSTRUCTOR_ROLES).default('MENTOR'),
});

// Zod schema for instructor update
const updateInstructorSchema = z.object({
  id: z.string().min(1, 'Az oktató azonosító kötelező.'),
  name: z.string().min(1, 'A név kötelező.'),
  title: z.string().optional(),
  bio: z.string().optional(),
  profilePictureUrl: z.string().url('Érvényes URL szükséges.').optional().or(z.literal('')),
  role: z.enum(VALID_INSTRUCTOR_ROLES).optional(),
});

// Zod schema for instructor deletion
const deleteInstructorSchema = z.object({
  id: z.string().min(1, 'Az oktató azonosító kötelező.'),
});

/**
 * Get all instructors (Public - no authentication required)
 */
export const getInstructors = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[getInstructors] Called');

    // Get all instructors ordered by creation date (newest first)
    const snapshot = await firestore
      .collection('instructors')
      .orderBy('createdAt', 'desc')
      .get();

    const instructors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    logger.info(`[getInstructors] Found ${instructors.length} instructors`);

    return {
      success: true,
      instructors,
    };
  } catch (error: any) {
    logger.error('[getInstructors] Error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt az oktatók lekérésekor.');
  }
});

/**
 * Create a new instructor (Admin only)
 */
export const createInstructor = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[createInstructor] Called');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges oktató létrehozásához.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod oktató létrehozásához. Csak adminisztrátorok hozhatnak létre oktatókat.');
    }

    // Validate input data
    const data = createInstructorSchema.parse(request.data);

    // Check if instructor with same name already exists
    const existingInstructorQuery = await firestore
      .collection('instructors')
      .where('name', '==', data.name)
      .limit(1)
      .get();

    if (!existingInstructorQuery.empty) {
      throw new Error('Már létezik oktató ezzel a névvel.');
    }

    // Create instructor
    const instructorData = {
      name: data.name,
      title: data.title || null,
      bio: data.bio || null,
      profilePictureUrl: data.profilePictureUrl || null,
      role: data.role || 'MENTOR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const instructorRef = await firestore.collection('instructors').add(instructorData);

    logger.info(`[createInstructor] Created instructor: ${instructorRef.id} with role: ${instructorData.role}`);

    return {
      success: true,
      message: 'Oktató sikeresen létrehozva.',
      instructor: { id: instructorRef.id, ...instructorData }
    };

  } catch (error: any) {
    logger.error('[createInstructor] Error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt az oktató létrehozásakor.'
    };
  }
});

/**
 * Update an existing instructor (Admin only)
 */
export const updateInstructor = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[updateInstructor] Called');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges oktató frissítéséhez.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod oktató frissítéséhez.');
    }

    // Validate input data
    const data = updateInstructorSchema.parse(request.data);

    // Check if instructor exists
    const instructorRef = firestore.collection('instructors').doc(data.id);
    const instructorDoc = await instructorRef.get();

    if (!instructorDoc.exists) {
      throw new Error('Az oktató nem található.');
    }

    // Check if another instructor with same name exists (excluding current one)
    const existingInstructorQuery = await firestore
      .collection('instructors')
      .where('name', '==', data.name)
      .limit(2)
      .get();

    const duplicates = existingInstructorQuery.docs.filter(doc => doc.id !== data.id);
    if (duplicates.length > 0) {
      throw new Error('Már létezik másik oktató ezzel a névvel.');
    }

    // Update instructor
    const updateData: Record<string, unknown> = {
      name: data.name,
      title: data.title || null,
      bio: data.bio || null,
      profilePictureUrl: data.profilePictureUrl || null,
      updatedAt: new Date().toISOString(),
    };

    // Only update role if provided
    if (data.role) {
      updateData.role = data.role;
    }

    await instructorRef.update(updateData);

    const updatedDoc = await instructorRef.get();

    logger.info(`[updateInstructor] Updated instructor: ${data.id}`);

    return {
      success: true,
      message: 'Oktató sikeresen frissítve.',
      instructor: { id: data.id, ...updatedDoc.data() }
    };

  } catch (error: any) {
    logger.error('[updateInstructor] Error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt az oktató frissítésekor.'
    };
  }
});

/**
 * Delete an instructor (Admin only)
 * Prevents deletion if instructor is assigned to any courses
 */
export const deleteInstructor = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    logger.info('[deleteInstructor] Called');

    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges oktató törléséhez.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultságod oktató törléséhez.');
    }

    // Validate input data
    const data = deleteInstructorSchema.parse(request.data);

    // Check if instructor exists
    const instructorRef = firestore.collection('instructors').doc(data.id);
    const instructorDoc = await instructorRef.get();

    if (!instructorDoc.exists) {
      throw new Error('Az oktató nem található.');
    }

    // Check if instructor is assigned to any courses
    const coursesSnapshot = await firestore
      .collection('courses')
      .where('instructorId', '==', data.id)
      .limit(1)
      .get();

    if (!coursesSnapshot.empty) {
      const courseCount = coursesSnapshot.size;
      throw new Error(
        `Ez az oktató ${courseCount} kurzushoz van hozzárendelve. ` +
        'Először rendelje át vagy törölje ezeket a kurzusokat.'
      );
    }

    // Delete instructor
    await instructorRef.delete();

    logger.info(`[deleteInstructor] Deleted instructor: ${data.id}`);

    return {
      success: true,
      message: 'Oktató sikeresen törölve.'
    };

  } catch (error: any) {
    logger.error('[deleteInstructor] Error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt az oktató törlésekor.'
    };
  }
});
