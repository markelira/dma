import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';

// Initialize Firebase Admin (already initialized in courseActions.ts)
const firestore = getFirestore();
const auth = getAuth();

// Zod schema for marking lesson as complete
const markLessonAsCompleteSchema = z.object({
  lessonId: z.string().min(1, 'Lecke azonosító kötelező.'),
});

/**
 * Mark a lesson as complete for a user (Callable Cloud Function)
 */
export const markLessonAsComplete = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Validate input data
    const data = markLessonAsCompleteSchema.parse(request.data);
    const { lessonId } = data;

    // Check if the lesson exists
    const lessonDoc = await firestore.collection('lessons').doc(lessonId).get();
    if (!lessonDoc.exists) {
      throw new Error('A megadott lecke nem található.');
    }

    const lessonData = lessonDoc.data();
    const moduleId = lessonData?.moduleId;

    if (!moduleId) {
      throw new Error('A lecke modulja nem található.');
    }

    // Check if the module exists
    const moduleDoc = await firestore.collection('modules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      throw new Error('A lecke modulja nem található.');
    }

    const moduleData = moduleDoc.data();
    const courseId = moduleData?.courseId;

    if (!courseId) {
      throw new Error('A kurzus azonosító nem található.');
    }

    // Check if the user is enrolled in the course that contains this lesson
    const enrollmentQuery = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (enrollmentQuery.empty) {
      throw new Error('Nincs feliratkozva erre a kurzusra.');
    }

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    const userRole = userData?.role;

    // Check if user has appropriate permissions (STUDENT, INSTRUCTOR, or ADMIN)
    if (userRole !== 'STUDENT' && userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      throw new Error('Nincs jogosultság lecke teljesítésének jelöléséhez.');
    }

    // Create or update progress document in lessonProgress collection
    const progressRef = firestore.collection('lessonProgress').doc(`${lessonId}_${userId}`);
    
    await progressRef.set({
      courseId,
      lessonId,
      userId,
      completed: true,
      completionTimestamp: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      message: 'Lecke sikeresen teljesítve.',
      progress: {
        lessonId,
        userId,
        completed: true,
        completionTimestamp: new Date().toISOString()
      }
    };

  } catch (error: any) {
    console.error('❌ markLessonAsComplete error:', error);
    
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