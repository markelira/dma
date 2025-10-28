import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';

const firestore = admin.firestore();

// Device info schema
const deviceInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['desktop', 'mobile', 'tablet']),
  browser: z.string(),
  os: z.string(),
  lastSeen: z.date(),
  isActive: z.boolean(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional()
  }).optional()
});

// Progress sync data schema
const progressSyncSchema = z.object({
  userId: z.string(),
  lessonId: z.string(),
  courseId: z.string(),
  contentType: z.enum(['video', 'text', 'quiz', 'pdf', 'audio']),
  completionPercentage: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
  lastPosition: z.number().min(0),
  isCompleted: z.boolean(),
  deviceId: z.string(),
  deviceInfo: deviceInfoSchema,
  syncVersion: z.number(),
  
  // Content-specific progress (optional)
  videoProgress: z.object({
    currentTime: z.number(),
    duration: z.number(),
    playbackRate: z.number(),
    volume: z.number(),
    qualityLevel: z.string(),
    subtitleTrack: z.string().optional(),
    chapters: z.array(z.object({
      id: z.string(),
      completed: z.boolean(),
      timeSpent: z.number()
    })),
    bookmarks: z.array(z.object({
      id: z.string(),
      timestamp: z.number(),
      title: z.string(),
      note: z.string().optional()
    })),
    notes: z.array(z.object({
      id: z.string(),
      timestamp: z.number(),
      content: z.string(),
      title: z.string()
    }))
  }).optional(),
  
  readingProgress: z.object({
    scrollPercentage: z.number(),
    readingTime: z.number(),
    wordsRead: z.number(),
    sectionsCompleted: z.array(z.string()),
    highlights: z.array(z.object({
      id: z.string(),
      text: z.string(),
      position: z.number(),
      color: z.string()
    })),
    notes: z.array(z.object({
      id: z.string(),
      content: z.string(),
      position: z.number()
    }))
  }).optional(),
  
  quizProgress: z.object({
    currentQuestionIndex: z.number(),
    answers: z.record(z.any()),
    attempts: z.number(),
    timeSpent: z.number(),
    hintsUsed: z.array(z.string()),
    score: z.number().optional(),
    completed: z.boolean(),
    mistakes: z.array(z.object({
      questionId: z.string(),
      incorrectAnswer: z.any(),
      correctAnswer: z.any()
    }))
  }).optional()
});

/**
 * Update progress sync data with conflict resolution
 */
export const updateProgressSync = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    
    // Validate input data
    const validatedData = progressSyncSchema.parse(request.data);
    
    // Ensure user can only update their own progress
    if (validatedData.userId !== userId) {
      throw new HttpsError('permission-denied', 'Csak saját haladást módosíthat.');
    }

    const docId = `${userId}_${validatedData.lessonId}`;
    const progressRef = firestore.collection('lessonProgress').doc(docId);
    
    await firestore.runTransaction(async (transaction) => {
      const progressDoc = await transaction.get(progressRef);
      
      if (!progressDoc.exists) {
        // Create new progress document
        const newProgressData = {
          ...validatedData,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          syncHistory: [{
            deviceId: validatedData.deviceId,
            syncVersion: validatedData.syncVersion,
            timestamp: FieldValue.serverTimestamp(),
            changes: Object.keys(validatedData)
          }]
        };
        
        transaction.set(progressRef, newProgressData);
        
        // Update device registry
        await updateDeviceRegistry(userId, validatedData.deviceInfo);
        
        return;
      }

      const existingData = progressDoc.data();
      
      // Check for conflicts
      if (existingData && existingData.syncVersion >= validatedData.syncVersion) {
        // Conflict detected - apply conflict resolution
        const resolvedData = await resolveProgressConflict(
          existingData, 
          validatedData
        );
        
        const updateData = {
          ...resolvedData,
          updatedAt: FieldValue.serverTimestamp(),
          syncHistory: FieldValue.arrayUnion({
            deviceId: validatedData.deviceId,
            syncVersion: resolvedData.syncVersion,
            timestamp: FieldValue.serverTimestamp(),
            conflictResolved: true,
            changes: Object.keys(validatedData)
          })
        };
        
        transaction.update(progressRef, updateData);
      } else {
        // No conflict - simple update
        const updateData = {
          ...validatedData,
          updatedAt: FieldValue.serverTimestamp(),
          syncHistory: FieldValue.arrayUnion({
            deviceId: validatedData.deviceId,
            syncVersion: validatedData.syncVersion,
            timestamp: FieldValue.serverTimestamp(),
            changes: Object.keys(validatedData)
          })
        };
        
        transaction.update(progressRef, updateData);
      }
      
      // Update device registry
      await updateDeviceRegistry(userId, validatedData.deviceInfo);
    });

    console.log(`✅ Progress sync updated for user ${userId}, lesson ${validatedData.lessonId}`);
    
    return {
      success: true,
      message: 'Sync successful',
      timestamp: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('❌ Progress sync error:', error);
    
    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', 'Érvénytelen adatok', error.errors);
    }
    
    throw new HttpsError('internal', error.message || 'Szinkronizálási hiba történt');
  }
});

/**
 * Get synchronized progress for a lesson
 */
export const getSyncedProgress = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
    }

    const { lessonId, courseId } = request.data;
    const userId = request.auth.uid;

    if (!lessonId) {
      throw new HttpsError('invalid-argument', 'Lecke azonosító kötelező.');
    }

    const docId = `${userId}_${lessonId}`;
    const progressDoc = await firestore.collection('lessonProgress').doc(docId).get();
    
    if (!progressDoc.exists) {
      return {
        success: true,
        progress: null,
        devices: [],
        syncInfo: {
          lastSyncVersion: 0,
          lastSyncDevice: null,
          lastSyncTime: null
        }
      };
    }

    const progressData = progressDoc.data();
    
    // Get all devices for this user
    const devicesSnapshot = await firestore
      .collection('userDevices')
      .doc(userId)
      .collection('devices')
      .orderBy('lastSeen', 'desc')
      .get();
    
    const devices = devicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      progress: {
        ...progressData,
        id: progressDoc.id
      },
      devices,
      syncInfo: {
        lastSyncVersion: progressData?.syncVersion || 0,
        lastSyncDevice: progressData?.deviceId,
        lastSyncTime: progressData?.updatedAt,
        totalSyncs: progressData?.syncHistory?.length || 0,
        conflictHistory: progressData?.syncConflicts || []
      }
    };

  } catch (error: any) {
    console.error('❌ Get synced progress error:', error);
    throw new HttpsError('internal', error.message || 'Szinkronizált haladás lekérése sikertelen');
  }
});

/**
 * Get all connected devices for a user
 */
export const getUserDevices = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    
    const devicesSnapshot = await firestore
      .collection('userDevices')
      .doc(userId)
      .collection('devices')
      .orderBy('lastSeen', 'desc')
      .get();
    
    const devices = devicesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastSeen: data.lastSeen?.toDate() || null,
        isActive: data.isActive ?? true,
        type: data.type || 'unknown'
      };
    });

    // Mark devices as inactive if not seen for more than 24 hours
    const now = new Date();
    const batch = firestore.batch();
    let hasUpdates = false;

    devices.forEach(device => {
      if (device.lastSeen && device.isActive) {
        const hoursSinceLastSeen = (now.getTime() - device.lastSeen.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastSeen > 24) {
          const deviceRef = firestore
            .collection('userDevices')
            .doc(userId)
            .collection('devices')
            .doc(device.id);
          batch.update(deviceRef, { isActive: false });
          device.isActive = false;
          hasUpdates = true;
        }
      }
    });

    if (hasUpdates) {
      await batch.commit();
    }

    return {
      success: true,
      devices,
      stats: {
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.isActive).length,
        deviceTypes: devices.reduce((acc, device) => {
          acc[device.type] = (acc[device.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

  } catch (error: any) {
    console.error('❌ Get user devices error:', error);
    throw new HttpsError('internal', error.message || 'Eszközök lekérése sikertelen');
  }
});

/**
 * Remove a device from user's device list
 */
export const removeUserDevice = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges.');
    }

    const { deviceId } = request.data;
    const userId = request.auth.uid;

    if (!deviceId) {
      throw new HttpsError('invalid-argument', 'Eszköz azonosító kötelező.');
    }

    await firestore
      .collection('userDevices')
      .doc(userId)
      .collection('devices')
      .doc(deviceId)
      .delete();

    console.log(`✅ Device ${deviceId} removed for user ${userId}`);

    return {
      success: true,
      message: 'Eszköz eltávolítva'
    };

  } catch (error: any) {
    console.error('❌ Remove device error:', error);
    throw new HttpsError('internal', error.message || 'Eszköz eltávolítása sikertelen');
  }
});

/**
 * Helper function to resolve progress conflicts
 */
async function resolveProgressConflict(existingData: any, newData: any): Promise<any> {
  // Use most progress strategy by default
  const resolvedData = { ...existingData };
  
  // Always use the highest completion percentage
  if (newData.completionPercentage > existingData.completionPercentage) {
    resolvedData.completionPercentage = newData.completionPercentage;
    resolvedData.lastPosition = newData.lastPosition;
    resolvedData.isCompleted = newData.isCompleted;
  }
  
  // Sum time spent from both sources
  resolvedData.timeSpent = Math.max(existingData.timeSpent || 0, newData.timeSpent || 0);
  
  // Merge content-specific progress
  if (newData.videoProgress && existingData.videoProgress) {
    resolvedData.videoProgress = {
      ...existingData.videoProgress,
      // Use furthest video position
      currentTime: Math.max(
        existingData.videoProgress.currentTime || 0,
        newData.videoProgress.currentTime || 0
      ),
      // Keep user preferences from new data
      volume: newData.videoProgress.volume,
      playbackRate: newData.videoProgress.playbackRate,
      qualityLevel: newData.videoProgress.qualityLevel,
      subtitleTrack: newData.videoProgress.subtitleTrack,
      // Merge bookmarks and notes
      bookmarks: mergeArraysById(
        existingData.videoProgress.bookmarks || [],
        newData.videoProgress.bookmarks || []
      ),
      notes: mergeArraysById(
        existingData.videoProgress.notes || [],
        newData.videoProgress.notes || []
      ),
      chapters: mergeChapterProgress(
        existingData.videoProgress.chapters || [],
        newData.videoProgress.chapters || []
      )
    };
  } else if (newData.videoProgress) {
    resolvedData.videoProgress = newData.videoProgress;
  }
  
  if (newData.readingProgress && existingData.readingProgress) {
    resolvedData.readingProgress = {
      ...existingData.readingProgress,
      // Use furthest reading position
      scrollPercentage: Math.max(
        existingData.readingProgress.scrollPercentage || 0,
        newData.readingProgress.scrollPercentage || 0
      ),
      // Sum reading time and words read
      readingTime: Math.max(
        existingData.readingProgress.readingTime || 0,
        newData.readingProgress.readingTime || 0
      ),
      wordsRead: Math.max(
        existingData.readingProgress.wordsRead || 0,
        newData.readingProgress.wordsRead || 0
      ),
      // Merge sections completed
      sectionsCompleted: Array.from(new Set([
        ...(existingData.readingProgress.sectionsCompleted || []),
        ...(newData.readingProgress.sectionsCompleted || [])
      ])),
      // Merge highlights and notes
      highlights: mergeArraysById(
        existingData.readingProgress.highlights || [],
        newData.readingProgress.highlights || []
      ),
      notes: mergeArraysById(
        existingData.readingProgress.notes || [],
        newData.readingProgress.notes || []
      )
    };
  } else if (newData.readingProgress) {
    resolvedData.readingProgress = newData.readingProgress;
  }
  
  if (newData.quizProgress && existingData.quizProgress) {
    // Use quiz progress with better score or more completion
    const existingScore = existingData.quizProgress.score || 0;
    const newScore = newData.quizProgress.score || 0;
    
    if (newScore > existingScore || 
        (newScore === existingScore && newData.quizProgress.currentQuestionIndex > existingData.quizProgress.currentQuestionIndex)) {
      resolvedData.quizProgress = newData.quizProgress;
    } else {
      resolvedData.quizProgress = existingData.quizProgress;
    }
  } else if (newData.quizProgress) {
    resolvedData.quizProgress = newData.quizProgress;
  }
  
  // Increment sync version
  resolvedData.syncVersion = Math.max(existingData.syncVersion || 0, newData.syncVersion || 0) + 1;
  
  // Record conflict resolution
  resolvedData.syncConflicts = [
    ...(existingData.syncConflicts || []),
    {
      field: 'multiple',
      localValue: 'conflict_resolved',
      remoteValue: 'conflict_resolved',
      resolution: 'merged',
      timestamp: FieldValue.serverTimestamp(),
      devices: [existingData.deviceId, newData.deviceId]
    }
  ];
  
  return resolvedData;
}

/**
 * Helper function to merge arrays by ID
 */
function mergeArraysById(array1: any[], array2: any[]): any[] {
  const merged = [...array1];
  
  array2.forEach(item => {
    const existingIndex = merged.findIndex(existing => existing.id === item.id);
    if (existingIndex >= 0) {
      // Update existing item with newer data
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...item,
        // Keep the most recent timestamp if available
        timestamp: item.timestamp || merged[existingIndex].timestamp
      };
    } else {
      // Add new item
      merged.push(item);
    }
  });
  
  return merged;
}

/**
 * Helper function to merge chapter progress
 */
function mergeChapterProgress(existing: any[], newChapters: any[]): any[] {
  const chapterMap = new Map();
  
  // Add existing chapters
  existing.forEach(chapter => {
    chapterMap.set(chapter.id, chapter);
  });
  
  // Merge with new chapters
  newChapters.forEach(chapter => {
    const existingChapter = chapterMap.get(chapter.id);
    if (existingChapter) {
      chapterMap.set(chapter.id, {
        ...existingChapter,
        completed: existingChapter.completed || chapter.completed,
        timeSpent: Math.max(existingChapter.timeSpent || 0, chapter.timeSpent || 0)
      });
    } else {
      chapterMap.set(chapter.id, chapter);
    }
  });
  
  return Array.from(chapterMap.values());
}

/**
 * Helper function to update device registry
 */
async function updateDeviceRegistry(userId: string, deviceInfo: any): Promise<void> {
  const deviceRef = firestore
    .collection('userDevices')
    .doc(userId)
    .collection('devices')
    .doc(deviceInfo.id);
    
  await deviceRef.set({
    ...deviceInfo,
    lastSeen: FieldValue.serverTimestamp(),
    isActive: true
  }, { merge: true });
}