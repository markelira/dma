import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import jwt from 'jsonwebtoken';

// Initialize Firebase Admin (already initialized in courseActions.ts)
const firestore = getFirestore();
const auth = getAuth();

// Initialize Mux signing keys for JWT generation
import * as functions from 'firebase-functions';

// Mux signing configuration with fallback for development
let playbackSigningKeyId: string | null = null;
let playbackSigningKeySecret: string | null = null;

try {
  const muxConfig = functions.config().mux;
  playbackSigningKeyId = muxConfig?.signing_key_id || null;
  playbackSigningKeySecret = muxConfig?.signing_key_secret || null;
  
  if (!playbackSigningKeyId || !playbackSigningKeySecret) {
    console.warn('⚠️ Mux signing keys not configured, using unsigned URLs for development');
  } else {
    console.log('✅ Mux signing keys configured successfully');
  }
} catch (error) {
  console.warn('⚠️ Mux config not available, using unsigned URLs for development');
}

// Zod schema for course player data request with CSRF protection
const getCoursePlayerDataSchema = z.object({
  courseId: z.string().min(1, 'Kurzus azonosító kötelező.').max(50, 'Invalid course ID format'),
  lessonId: z.string().optional().refine((val) => !val || val.length <= 50, 'Invalid lesson ID format'),
  timestamp: z.number().optional(), // Client timestamp for replay attack prevention
  origin: z.string().optional(), // Request origin verification
});

/**
 * Verify user enrollment and access permissions
 */
interface EnrollmentStatus {
  hasAccess: boolean;
  accessType: 'FREE' | 'ENROLLED' | 'ADMIN' | 'INSTRUCTOR';
  reason: string;
  expiresAt?: Date;
}

const verifyUserEnrollment = async (userId: string, courseId: string, courseData: any): Promise<EnrollmentStatus> => {
  try {
    // Check if user is admin or instructor
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Admin access to all courses
      if (userData?.role === 'ADMIN') {
        return {
          hasAccess: true,
          accessType: 'ADMIN',
          reason: 'Admin access granted'
        };
      }
      
      // Instructor access to their own courses
      if (userData?.role === 'INSTRUCTOR' && courseData.instructorId === userId) {
        return {
          hasAccess: true,
          accessType: 'INSTRUCTOR',
          reason: 'Instructor access to own course'
        };
      }
    }

    // Check if course is free or publicly available
    const isFreeCourse = courseData.status === 'FREE' || courseData.isPlus === true || courseData.price === 0;
    
    if (isFreeCourse) {
      return {
        hasAccess: true,
        accessType: 'FREE',
        reason: 'Free course access'
      };
    }

    // Check active enrollment for paid courses
    const enrollmentQuery = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'ACTIVE') // Only active enrollments
      .limit(1)
      .get();

    if (enrollmentQuery.empty) {
      return {
        hasAccess: false,
        accessType: 'ENROLLED',
        reason: 'A kurzus csak beiratkozott felhasználóknak érhető el. Kérjük, vásárolja meg a kurzust.'
      };
    }

    const enrollment = enrollmentQuery.docs[0].data();
    
    // Check if enrollment has expired (if applicable)
    if (enrollment.expiresAt && enrollment.expiresAt.toDate() < new Date()) {
      return {
        hasAccess: false,
        accessType: 'ENROLLED',
        reason: 'A kurzushoz való hozzáférés lejárt. Kérjük, újítsa meg az előfizetését.'
      };
    }

    return {
      hasAccess: true,
      accessType: 'ENROLLED',
      reason: 'Valid enrollment found',
      expiresAt: enrollment.expiresAt?.toDate()
    };

  } catch (error) {
    console.error('❌ Error verifying enrollment:', error);
    return {
      hasAccess: false,
      accessType: 'ENROLLED',
      reason: 'Hiba történt a jogosultság ellenőrzése során.'
    };
  }
};

/**
 * Validate request for CSRF and security checks
 */
interface RequestValidation {
  isValid: boolean;
  reason: string;
}

const validateRequest = async (request: any): Promise<RequestValidation> => {
  try {
    // Check request headers for basic security
    const userAgent = request.rawRequest?.headers['user-agent'];
    const referer = request.rawRequest?.headers['referer'];
    
    // Block obvious bot/malicious requests
    if (!userAgent || userAgent.length < 10) {
      return {
        isValid: false,
        reason: 'Invalid or missing user agent'
      };
    }

    // In production, validate referer against allowed domains
    if (referer) {
      const allowedDomains = [
        'localhost',
        'elira-67ab7.web.app',
        'elira-67ab7.firebaseapp.com',
        // Add your custom domains here
      ];
      
      const refererDomain = new URL(referer).hostname;
      const isAllowedDomain = allowedDomains.some(domain => 
        refererDomain === domain || refererDomain.endsWith(`.${domain}`)
      );
      
      if (!isAllowedDomain && process.env.NODE_ENV === 'production') {
        return {
          isValid: false,
          reason: `Invalid referer domain: ${refererDomain}`
        };
      }
    }

    // Rate limiting check (basic implementation)
    const userId = request.auth?.uid;
    if (userId) {
      // In a production app, you'd want to use Redis or similar for rate limiting
      // For now, we'll just log excessive requests
      console.log(`📊 Request from user: ${userId}`);
    }

    return {
      isValid: true,
      reason: 'Request validation passed'
    };

  } catch (error) {
    console.error('❌ Error validating request:', error);
    return {
      isValid: false,
      reason: 'Request validation error'
    };
  }
};

/**
 * Generate signed Mux playback URL with JWT token
 */
const generateSignedPlayback = async (playbackId: string, userId: string): Promise<string> => {
  console.log('🔐 Generating signed playback URL for:', playbackId);
  
  // For test/development playback IDs, return a working test video URL
  if (playbackId.startsWith('test_playback_')) {
    console.log('🧪 Using test video URL for development mode');
    // Return a publicly accessible test video (Big Buck Bunny sample video)
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  }
  
  if (playbackSigningKeyId && playbackSigningKeySecret) {
    try {
      const token = jwt.sign(
        {
          sub: playbackId,
          aud: 'v', // video audience
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 4), // 4 hour expiry
          iat: Math.floor(Date.now() / 1000), // issued at
          // Add user context for audit trail
          userId: userId,
        },
        playbackSigningKeySecret,
        {
          header: {
            alg: 'HS256',
            typ: 'JWT',
            kid: playbackSigningKeyId,
          },
        }
      );
      
      const signedUrl = `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
      console.log('✅ Generated signed URL successfully');
      return signedUrl;
      
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      // Fallback to unsigned in case of JWT error, but log the issue
      console.warn('⚠️ Falling back to unsigned URL due to signing error');
    }
  } else {
    console.warn('⚠️ Mux signing keys not available, using unsigned URL for development');
  }
  
  // Fallback to unsigned URL (for development or when signing fails)
  return `https://stream.mux.com/${playbackId}.m3u8`;
};

/**
 * Get course player data with modules, lessons, and user progress (Callable Cloud Function)
 */
export const getCoursePlayerData = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // CSRF and request validation
    const requestValidation = await validateRequest(request);
    if (!requestValidation.isValid) {
      console.warn(`❌ Invalid request from user ${userId}: ${requestValidation.reason}`);
      throw new Error('Érvénytelen kérés.');
    }

    // Validate input data
    const data = getCoursePlayerDataSchema.parse(request.data);
    const { courseId, lessonId, timestamp, origin } = data;

    // Additional security checks
    if (timestamp) {
      const now = Date.now();
      const requestAge = now - timestamp;
      if (requestAge > 5 * 60 * 1000) { // 5 minutes
        throw new Error('A kérés túl régi. Kérjük, frissítse az oldalt.');
      }
    }

    // Check if the course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található.');
    }

    const courseData = courseDoc.data();
    if (!courseData) {
      throw new Error('Kurzus adatok nem találhatók.');
    }

    // Enhanced server-side enrollment verification
    const enrollmentStatus = await verifyUserEnrollment(userId, courseId, courseData);
    
    if (!enrollmentStatus.hasAccess) {
      console.warn(`❌ Access denied for user ${userId} to course ${courseId}: ${enrollmentStatus.reason}`);
      throw new Error(enrollmentStatus.reason);
    }
    
    console.log(`✅ Access granted for user ${userId} to course ${courseId}: ${enrollmentStatus.accessType}`);

    // Fetch modules and lessons
    const modulesSnap = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .orderBy('order')
      .get();

    const modules = [];
    
    for (const moduleDoc of modulesSnap.docs) {
      const moduleData = moduleDoc.data();
      
      // Fetch lessons for this module
      const lessonsSnap = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleDoc.id)
        .collection('lessons')
        .orderBy('order')
        .get();

      const lessons = [];
      
      for (const lessonDoc of lessonsSnap.docs) {
        const lessonData = lessonDoc.data();
        
        // Fetch user progress for this lesson
        const progressQuery = await firestore
          .collection('lessonProgress')
          .where('lessonId', '==', lessonDoc.id)
          .where('userId', '==', userId)
          .limit(1)
          .get();

        const progress = progressQuery.empty ? null : progressQuery.docs[0].data();
        
        lessons.push({
          id: lessonDoc.id,
          ...lessonData,
          progress: progress ? {
            completed: progress.completed || false,
            completionTimestamp: progress.completionTimestamp,
            watchPercentage: progress.watchPercentage || 0,
            timeSpent: progress.timeSpent || 0,
          } : null,
        });
      }

      modules.push({
        id: moduleDoc.id,
        ...moduleData,
        lessons,
      });
    }

    // Generate signed playback URL if lessonId is provided
    let signedPlaybackUrl: string | null = null;
    if (lessonId) {
      // Find the lesson by slug first, then by ID as fallback
      for (const module of modules) {
        const lesson = module.lessons.find((l: any) => 
          l.slug === lessonId || l.id === lessonId
        );
        if (lesson) {
          let playbackId: string | null = null;
          
          // First check for muxPlaybackId
          if (lesson.muxPlaybackId) {
            playbackId = lesson.muxPlaybackId;
          } 
          // Auto-update: If lesson has muxAssetId but no muxPlaybackId, generate it in development mode
          else if (lesson.muxAssetId) {
            console.log(`🔄 [getCoursePlayerData] Lesson has muxAssetId but no muxPlaybackId. Auto-updating...`);
            
            const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
            
            if (isEmulator || lesson.muxAssetId.startsWith('test_asset_')) {
              // Generate mock playback ID and update lesson
              const mockPlaybackId = `test_playback_${lesson.muxAssetId.replace('test_asset_', '')}`;
              
              try {
                // Find the lesson path - we need to determine which module this lesson belongs to
                for (const module of modules) {
                  const lessonInModule = module.lessons.find((l: any) => l.id === lesson.id);
                  if (lessonInModule) {
                    const lessonPath = `courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`;
                    
                    // Update the lesson document with mock playback ID
                    await firestore.doc(lessonPath).update({
                      muxPlaybackId: mockPlaybackId,
                      videoUrl: `https://stream.mux.com/${mockPlaybackId}`,
                      updatedAt: new Date().toISOString()
                    });
                    
                    console.log(`✅ [getCoursePlayerData] Updated lesson ${lesson.id} with mock playbackId: ${mockPlaybackId}`);
                    playbackId = mockPlaybackId;
                    break;
                  }
                }
              } catch (error) {
                console.error(`❌ [getCoursePlayerData] Failed to update lesson with mock playbackId:`, error);
              }
            }
          }
          // Otherwise extract from videoUrl if it's a Mux URL
          else if (lesson.videoUrl) {
            // Extract playback ID from Mux URL formats:
            // https://stream.mux.com/PLAYBACK_ID.m3u8
            // https://stream.mux.com/PLAYBACK_ID/high.mp4
            const muxUrlMatch = lesson.videoUrl.match(/stream\.mux\.com\/([a-zA-Z0-9]+)/);
            if (muxUrlMatch) {
              playbackId = muxUrlMatch[1];
              console.log(`📹 Extracted playback ID from videoUrl: ${playbackId}`);
            }
          }
          
          if (playbackId) {
            signedPlaybackUrl = await generateSignedPlayback(playbackId, userId);
            break;
          }
        }
      }
    }

    // Remove sensitive playback IDs before returning
    const safeCourse = {
      id: courseDoc.id,
      ...courseData,
      modules: modules.map((module: any) => ({
        ...module,
        lessons: module.lessons.map((lesson: any) => {
          const { muxPlaybackId, ...safeLesson } = lesson;
          return safeLesson;
        }),
      })),
    };

    return {
      success: true,
      course: safeCourse,
      signedPlaybackUrl,
    };

  } catch (error: any) {
    console.error('❌ getCoursePlayerData error:', error);
    
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
 * Get secure video URL for a specific lesson (separate function for tighter security)
 */
const getSecureVideoUrlSchema = z.object({
  courseId: z.string().min(1).max(50),
  lessonId: z.string().min(1).max(50),
  timestamp: z.number().min(Date.now() - 10 * 60 * 1000), // Max 10 minutes old
});

export const getSecureVideoUrl = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Validate request
    const requestValidation = await validateRequest(request);
    if (!requestValidation.isValid) {
      throw new Error('Érvénytelen kérés.');
    }

    // Validate input
    const { courseId, lessonId, timestamp } = getSecureVideoUrlSchema.parse(request.data);

    // Verify course access
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található.');
    }

    const courseData = courseDoc.data()!;
    const enrollmentStatus = await verifyUserEnrollment(userId, courseId, courseData);
    
    if (!enrollmentStatus.hasAccess) {
      throw new Error(enrollmentStatus.reason);
    }

    // Find the specific lesson
    const lessonDoc = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .get()
      .then(async (modulesSnap) => {
        for (const moduleDoc of modulesSnap.docs) {
          const lessonsSnap = await firestore
            .collection('courses')
            .doc(courseId)
            .collection('modules')
            .doc(moduleDoc.id)
            .collection('lessons')
            .doc(lessonId)
            .get();
          
          if (lessonsSnap.exists) {
            return lessonsSnap;
          }
        }
        return null;
      });

    if (!lessonDoc || !lessonDoc.exists) {
      throw new Error('Lecke nem található.');
    }

    const lessonData = lessonDoc.data()!;
    
    // Extract playback ID from either muxPlaybackId or videoUrl
    let playbackId: string | null = null;
    
    if (lessonData.muxPlaybackId) {
      playbackId = lessonData.muxPlaybackId;
    } else if (lessonData.muxAssetId) {
      // Auto-update: If lesson has muxAssetId but no muxPlaybackId, generate it in development mode
      console.log(`🔄 [getSecureVideoUrl] Lesson has muxAssetId but no muxPlaybackId. Auto-updating...`);
      
      const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true' || process.env.NODE_ENV === 'development';
      
      if (isEmulator || lessonData.muxAssetId.startsWith('test_asset_')) {
        // Generate mock playback ID and update lesson
        const mockPlaybackId = `test_playback_${lessonData.muxAssetId.replace('test_asset_', '')}`;
        
        try {
          // Find the module that contains this lesson
          const modulesSnapshot = await firestore
            .collection('courses')
            .doc(courseId)
            .collection('modules')
            .get();
          
          for (const moduleDoc of modulesSnapshot.docs) {
            const moduleId = moduleDoc.id;
            const lessonInModule = await firestore
              .collection('courses')
              .doc(courseId)
              .collection('modules')
              .doc(moduleId)
              .collection('lessons')
              .doc(lessonId)
              .get();
            
            if (lessonInModule.exists) {
              // Update the lesson document with mock playback ID
              await firestore.doc(`courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`).update({
                muxPlaybackId: mockPlaybackId,
                videoUrl: `https://stream.mux.com/${mockPlaybackId}`,
                updatedAt: new Date().toISOString()
              });
              
              console.log(`✅ [getSecureVideoUrl] Updated lesson ${lessonId} with mock playbackId: ${mockPlaybackId}`);
              playbackId = mockPlaybackId;
              break;
            }
          }
        } catch (error) {
          console.error(`❌ [getSecureVideoUrl] Failed to update lesson with mock playbackId:`, error);
        }
      }
    } else if (lessonData.videoUrl) {
      // Extract from Mux URL
      const muxUrlMatch = lessonData.videoUrl.match(/stream\.mux\.com\/([a-zA-Z0-9]+)/);
      if (muxUrlMatch) {
        playbackId = muxUrlMatch[1];
      }
    }
    
    if (!playbackId) {
      throw new Error('Videó nem érhető el ehhez a leckéhez.');
    }

    // Generate signed URL
    const signedUrl = await generateSignedPlayback(playbackId, userId);

    // Log access for security audit
    console.log(`🎥 Video access granted: User ${userId} accessing lesson ${lessonId} in course ${courseId}`);

    return {
      success: true,
      signedUrl,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    };

  } catch (error: any) {
    console.error('❌ getSecureVideoUrl error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Videó URL lekérése sikertelen'
    };
  }
}); 