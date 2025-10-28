import { onCall } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp();
}
const firestore = getFirestore();
const auth = getAuth();

/**
 * Get a single lesson by ID - searches through course module structure
 */
export const getLesson = onCall(async (request) => {
  try {
    console.log('🔍 [getLesson] Called with:', { lessonId: request.data?.lessonId, courseId: request.data?.courseId });
    
    // Verify authentication
    if (!request.auth) {
      console.error('❌ [getLesson] No authentication');
      throw new Error('Bejelentkezés szükséges.');
    }

    const { lessonId, courseId } = request.data;

    if (!lessonId) {
      throw new Error('Lecke azonosító kötelező.');
    }

    let lessonData = null;
    let foundModuleId = null;
    let foundCourseId = courseId;
    let foundLessonId = lessonId;

    // If courseId is provided, search within that course first
    if (courseId) {
      const modulesSnap = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .get();

      for (const moduleDoc of modulesSnap.docs) {
        // First try to find by slug
        let lessonQuery = await firestore
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .doc(moduleDoc.id)
          .collection('lessons')
          .where('slug', '==', lessonId)
          .limit(1)
          .get();

        let lessonDoc: any = lessonQuery.empty ? null : lessonQuery.docs[0];

        // If not found by slug, try by document ID (fallback)
        if (!lessonDoc) {
          const directDoc = await firestore
            .collection('courses')
            .doc(courseId)
            .collection('modules')
            .doc(moduleDoc.id)
            .collection('lessons')
            .doc(lessonId)
            .get();
          
          if (directDoc.exists) {
            lessonDoc = directDoc;
          }
        }

        if (lessonDoc && lessonDoc.exists) {
          lessonData = lessonDoc.data();
          foundModuleId = moduleDoc.id;
          foundLessonId = lessonDoc.id; // Use actual document ID, not search term
          console.log('🔍 [getLesson] Found lesson in course:', courseId, 'module:', moduleDoc.id);
          console.log('🔍 [getLesson] Lesson data keys:', Object.keys(lessonData || {}));
          console.log('🔍 [getLesson] Lesson type:', lessonData?.type);
          console.log('🔍 [getLesson] Lesson title:', lessonData?.title);
          console.log('🔍 [getLesson] Found by:', lessonQuery.empty ? 'document ID' : 'slug');
          console.log('🔍 [getLesson] Actual lesson ID:', lessonDoc.id);
          break;
        }
      }
    }

    // If not found and no courseId provided, search all courses (more expensive)
    if (!lessonData && !courseId) {
      console.log('🔍 Searching all courses for lesson:', lessonId);
      const coursesSnap = await firestore.collection('courses').get();

      for (const courseDoc of coursesSnap.docs) {
        const modulesSnap = await firestore
          .collection('courses')
          .doc(courseDoc.id)
          .collection('modules')
          .get();

        for (const moduleDoc of modulesSnap.docs) {
          // First try to find by slug
          let lessonQuery = await firestore
            .collection('courses')
            .doc(courseDoc.id)
            .collection('modules')
            .doc(moduleDoc.id)
            .collection('lessons')
            .where('slug', '==', lessonId)
            .limit(1)
            .get();

          let lessonDoc: any = lessonQuery.empty ? null : lessonQuery.docs[0];

          // If not found by slug, try by document ID (fallback)
          if (!lessonDoc) {
            const directDoc = await firestore
              .collection('courses')
              .doc(courseDoc.id)
              .collection('modules')
              .doc(moduleDoc.id)
              .collection('lessons')
              .doc(lessonId)
              .get();
            
            if (directDoc.exists) {
              lessonDoc = directDoc;
            }
          }

          if (lessonDoc && lessonDoc.exists) {
            lessonData = lessonDoc.data();
            foundModuleId = moduleDoc.id;
            foundCourseId = courseDoc.id;
            foundLessonId = lessonDoc.id; // Use actual document ID, not search term
            break;
          }
        }
        if (lessonData) break;
      }
    }

    if (!lessonData) {
      console.error('❌ [getLesson] Lesson not found:', lessonId, 'in course:', courseId);
      throw new Error('A megadott lecke nem található.');
    }

    const lesson = {
      id: foundLessonId,
      moduleId: foundModuleId,
      courseId: foundCourseId,
      ...lessonData,
    };
    
    console.log('🔍 [getLesson] Final lesson object:');
    console.log('  - ID:', lesson.id);
    console.log('  - Title:', lesson.title);
    console.log('  - Type:', lesson.type);
    console.log('  - Content length:', lesson.content?.length || 0);
    console.log('  - All keys:', Object.keys(lesson));

    return {
      success: true,
      lesson,
    };

  } catch (error: any) {
    console.error('❌ getLesson error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Get all lessons for a module
 */
export const getLessonsForModule = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const { moduleId } = request.data;

    if (!moduleId) {
      throw new Error('Modul azonosító kötelező.');
    }

    // Check if module exists
    const moduleDoc = await firestore.collection('modules').doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      throw new Error('A megadott modul nem található.');
    }

    // Get lessons for this module
    const lessonsSnapshot = await firestore
      .collection('lessons')
      .where('moduleId', '==', moduleId)
      .orderBy('order', 'asc')
      .get();

    const lessons = lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      success: true,
      lessons,
    };

  } catch (error: any) {
    console.error('❌ getLessonsForModule error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Update lesson progress with cross-device synchronization
 */
export const updateLessonProgress = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { 
      lessonId, 
      watchPercentage, 
      timeSpent, 
      quizScore,
      deviceId,
      sessionId,
      courseId,
      resumePosition 
    } = request.data;

    if (!lessonId) {
      throw new Error('Lecke azonosító kötelező.');
    }

    // Generate device ID if not provided
    const finalDeviceId = deviceId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const now = new Date();

    // Get existing progress for conflict resolution
    const progressRef = firestore.collection('lessonProgress').doc(`${lessonId}_${userId}`);
    const existingProgress = await progressRef.get();
    const existingData = existingProgress.exists ? existingProgress.data() : null;

    // Device-specific progress tracking
    const deviceProgressRef = firestore
      .collection('lessonProgress')
      .doc(`${lessonId}_${userId}`)
      .collection('devices')
      .doc(finalDeviceId);

    // Conflict resolution: take the maximum values for cumulative metrics
    const resolvedWatchPercentage = Math.max(
      watchPercentage || 0,
      existingData?.watchPercentage || 0
    );

    const resolvedTimeSpent = Math.max(
      timeSpent || 0,
      existingData?.timeSpent || 0
    );

    // Main progress document with synchronized data
    const progressData: any = {
      lessonId,
      userId,
      courseId: courseId || existingData?.courseId,
      watchPercentage: resolvedWatchPercentage,
      timeSpent: resolvedTimeSpent,
      updatedAt: now,
      lastDeviceId: finalDeviceId,
      lastSessionId: finalSessionId,
      syncVersion: (existingData?.syncVersion || 0) + 1,
      devices: {
        ...(existingData?.devices || {}),
        [finalDeviceId]: {
          lastAccess: now,
          lastSession: finalSessionId,
          userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown'
        }
      }
    };

    // Handle resume position for videos
    if (resumePosition !== undefined) {
      progressData.resumePosition = resumePosition;
    }

    // Handle quiz scores (take the highest score)
    if (quizScore !== undefined) {
      progressData.quizScore = Math.max(
        quizScore,
        existingData?.quizScore || 0
      );
    }

    // Mark as completed if criteria met
    if (resolvedWatchPercentage >= 95 || (quizScore !== undefined && quizScore >= 80)) {
      progressData.completed = true;
      progressData.completionTimestamp = progressData.completionTimestamp || now;
    }

    // Device-specific progress data
    const deviceProgressData = {
      deviceId: finalDeviceId,
      sessionId: finalSessionId,
      lessonId,
      userId,
      watchPercentage: watchPercentage || 0,
      timeSpent: timeSpent || 0,
      quizScore: quizScore || null,
      resumePosition: resumePosition || null,
      updatedAt: now,
      userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown',
      ipAddress: request.rawRequest?.ip || 'unknown'
    };

    // Use transaction to ensure data consistency
    await firestore.runTransaction(async (transaction) => {
      // Update main progress document
      transaction.set(progressRef, progressData, { merge: true });
      
      // Update device-specific progress
      transaction.set(deviceProgressRef, deviceProgressData, { merge: true });
    });

    console.log(`✅ Progress updated for lesson ${lessonId}, user ${userId}, device ${finalDeviceId}`);

    return {
      success: true,
      message: 'Lecke állapot sikeresen szinkronizálva.',
      progress: progressData,
      deviceId: finalDeviceId,
      sessionId: finalSessionId,
      syncVersion: progressData.syncVersion
    };

  } catch (error: any) {
    console.error('❌ updateLessonProgress error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Get synchronized progress across all devices
 */
export const getSyncedLessonProgress = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { lessonId, courseId } = request.data;

    if (!lessonId) {
      throw new Error('Lecke azonosító kötelező.');
    }

    // Get main progress document
    const progressRef = firestore.collection('lessonProgress').doc(`${lessonId}_${userId}`);
    const progressDoc = await progressRef.get();
    
    if (!progressDoc.exists) {
      return {
        success: true,
        progress: null,
        devices: [],
        message: 'Nincs még mentett haladás ehhez a leckéhez.'
      };
    }

    const progressData = progressDoc.data();

    // Get device-specific progress
    const deviceProgressSnapshot = await progressRef
      .collection('devices')
      .orderBy('updatedAt', 'desc')
      .get();

    const devices = deviceProgressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Find the most recent device for resume recommendations
    const mostRecentDevice = devices.length > 0 ? devices[0] : null;

    return {
      success: true,
      progress: {
        ...progressData,
        id: progressDoc.id,
        devicesCount: devices.length,
        mostRecentDevice: mostRecentDevice ? (mostRecentDevice as any).deviceId : undefined,
        mostRecentAccess: mostRecentDevice ? (mostRecentDevice as any).updatedAt : undefined
      },
      devices,
      syncInfo: {
        lastSyncVersion: progressData?.syncVersion || 0,
        lastSyncDevice: progressData?.lastDeviceId,
        lastSyncTime: progressData?.updatedAt,
        conflictResolution: 'max_values' // Strategy used for conflict resolution
      }
    };

  } catch (error: any) {
    console.error('❌ getSyncedLessonProgress error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Sync progress when switching devices
 */
export const syncProgressOnDeviceSwitch = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { deviceId, courseId } = request.data;

    if (!deviceId) {
      throw new Error('Eszköz azonosító kötelező.');
    }

    // Get all progress for this user in the course
    let progressQuery = firestore.collection('lessonProgress')
      .where('userId', '==', userId);
    
    if (courseId) {
      progressQuery = progressQuery.where('courseId', '==', courseId);
    }
    
    const allProgressSnapshot = await progressQuery.get();

    const syncedProgress = [];

    for (const progressDoc of allProgressSnapshot.docs) {
      const progressData = progressDoc.data();
      
      // Update device access time
      await progressDoc.ref.update({
        [`devices.${deviceId}`]: {
          lastAccess: new Date(),
          lastSession: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown'
        },
        lastDeviceId: deviceId,
        updatedAt: new Date()
      });

      syncedProgress.push({
        lessonId: progressData.lessonId,
        progress: progressData
      });
    }

    console.log(`🔄 Synced ${syncedProgress.length} lesson progress records for device ${deviceId}`);

    return {
      success: true,
      message: `Sikeresen szinkronizálva ${syncedProgress.length} lecke haladása.`,
      syncedLessons: syncedProgress.length,
      deviceId,
      syncTime: new Date()
    };

  } catch (error: any) {
    console.error('❌ syncProgressOnDeviceSwitch error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
}); 