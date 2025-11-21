import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions/v2';

const firestore = getFirestore();

/**
 * Delete all courses from the database (Admin only)
 * WARNING: This is a destructive operation!
 * Used for migrating to the new 3-tier course type system
 */
export const deleteAllCourses = onCall({
  region: 'us-central1',
  maxInstances: 1,
}, async (request) => {
  const uid = request.auth?.uid;

  // Authentication check
  if (!uid) {
    logger.warn('Unauthenticated deleteAllCourses attempt');
    throw new Error('Authentication required');
  }

  // Permission check - ADMIN only
  const userDoc = await firestore.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (!userData || userData.role !== 'ADMIN') {
    logger.warn(`Unauthorized deleteAllCourses attempt by user ${uid} with role ${userData?.role}`);
    throw new Error('Admin access required');
  }

  logger.info(`Admin ${uid} initiated deleteAllCourses operation`);

  let deletedCourses = 0;
  let deletedModules = 0;
  let deletedLessons = 0;

  try {
    // Get all courses
    const coursesSnapshot = await firestore.collection('courses').get();
    logger.info(`Found ${coursesSnapshot.size} courses to delete`);

    // Delete each course and its subcollections
    for (const courseDoc of coursesSnapshot.docs) {
      const courseId = courseDoc.id;

      // Delete modules and their lessons
      const modulesSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .get();

      for (const moduleDoc of modulesSnapshot.docs) {
        const moduleId = moduleDoc.id;

        // Delete lessons in this module
        const lessonsSnapshot = await firestore
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleId)
          .collection('lessons')
          .get();

        for (const lessonDoc of lessonsSnapshot.docs) {
          await lessonDoc.ref.delete();
          deletedLessons++;
        }

        // Delete the module
        await moduleDoc.ref.delete();
        deletedModules++;
      }

      // Delete the course
      await courseDoc.ref.delete();
      deletedCourses++;

      // Log progress every 10 courses
      if (deletedCourses % 10 === 0) {
        logger.info(`Progress: ${deletedCourses} courses deleted`);
      }
    }

    // Create audit log entry
    await firestore.collection('auditLogs').add({
      userId: uid,
      userEmail: userData.email || '',
      userName: userData.displayName || userData.email || 'Admin',
      action: 'DELETE_ALL_COURSES',
      resource: 'Course',
      resourceId: 'ALL',
      details: JSON.stringify({
        deletedCourses,
        deletedModules,
        deletedLessons,
        reason: 'Migration to 3-tier course type system',
      }),
      severity: 'HIGH',
      ipAddress: request.rawRequest.ip || 'N/A',
      userAgent: request.rawRequest.headers['user-agent'] || 'N/A',
      createdAt: FieldValue.serverTimestamp(),
    });

    logger.info(`✅ Successfully deleted ${deletedCourses} courses, ${deletedModules} modules, ${deletedLessons} lessons`);

    return {
      success: true,
      message: 'All courses deleted successfully',
      deletedCourses,
      deletedModules,
      deletedLessons,
    };

  } catch (error) {
    logger.error('Error deleting courses:', error);
    throw new Error(`Failed to delete courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

/**
 * Restore soft-deleted courses by removing deletedAt field (Admin only)
 */
export const restoreSoftDeletedCourses = onCall({
  region: 'us-central1',
  maxInstances: 1,
}, async (request) => {
  const uid = request.auth?.uid;

  // Authentication check
  if (!uid) {
    logger.warn('Unauthenticated restoreSoftDeletedCourses attempt');
    throw new Error('Authentication required');
  }

  // Permission check - ADMIN only
  const userDoc = await firestore.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (!userData || userData.role !== 'ADMIN') {
    logger.warn(`Unauthorized restoreSoftDeletedCourses attempt by user ${uid}`);
    throw new Error('Admin access required');
  }

  logger.info(`Admin ${uid} initiated restoreSoftDeletedCourses operation`);

  try {
    const coursesSnapshot = await firestore.collection('courses').get();
    let restoredCount = 0;

    for (const courseDoc of coursesSnapshot.docs) {
      const data = courseDoc.data();
      if (data.deletedAt) {
        await courseDoc.ref.update({
          deletedAt: FieldValue.delete()
        });
        restoredCount++;
        logger.info(`Restored course: ${courseDoc.id} - ${data.title}`);
      }
    }

    logger.info(`✅ Restored ${restoredCount} soft-deleted courses`);

    return {
      success: true,
      message: `Restored ${restoredCount} courses`,
      restoredCount,
    };

  } catch (error) {
    logger.error('Error restoring courses:', error);
    throw new Error(`Failed to restore courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});
