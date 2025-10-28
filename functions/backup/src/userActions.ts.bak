import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { firestore, auth } from './config';

// Course State Enum for adaptive UI
enum CourseState {
  NOT_STARTED = 'not_started',
  ACTIVE_PROGRESS = 'active_progress',
  STALE_PROGRESS = 'stale_progress',
  COMPLETED = 'completed'
}

// Hybrid state detection function
function calculateCourseState(
  completionPercentage: number, 
  daysSinceLastAccess: number,
  certificateEarned: boolean
): CourseState {
  // Completed course
  if (completionPercentage === 100 || certificateEarned) {
    return CourseState.COMPLETED;
  }
  
  // Not started course
  if (completionPercentage === 0) {
    return CourseState.NOT_STARTED;
  }
  
  // In progress - check activity (7-day threshold)
  if (daysSinceLastAccess <= 7) {
    return CourseState.ACTIVE_PROGRESS;
  } else {
    return CourseState.STALE_PROGRESS;
  }
}

// Generate computed activities from recent lesson progress
async function generateComputedActivities(userId: string, since: Date) {
  try {
    const activities: any[] = [];

    // Get recent lesson completions
    const lessonProgressQuery = await firestore
      .collection('lessonProgress')
      .where('userId', '==', userId)
      .where('completedAt', '>=', since.toISOString())
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    for (const progressDoc of lessonProgressQuery.docs) {
      const progress = progressDoc.data();
      
      // Get course and lesson details
      const courseDoc = await firestore.collection('courses').doc(progress.courseId).get();
      const course = courseDoc.data();
      if (!course) continue;

      // Find lesson details in course modules
      let lessonName = `Lecke ${progress.lessonId}`;
      let moduleName = 'Modul';
      
      for (const module of course.modules || []) {
        const lesson = module.lessons?.find((l: any) => l.id === progress.lessonId);
        if (lesson) {
          lessonName = lesson.title;
          moduleName = module.title;
          break;
        }
      }

      activities.push({
        id: `computed_lesson_${progressDoc.id}`,
        type: 'lesson_completed',
        priority: 'low',
        title: `Lecke befejezve: ${lessonName}`,
        description: `Elvégezte a "${lessonName}" leckét a "${course.title}" kurzusban`,
        courseId: progress.courseId,
        courseName: course.title,
        lessonId: progress.lessonId,
        lessonName,
        createdAt: progress.completedAt,
        metadata: {
          moduleName,
          watchPercentage: progress.watchPercentage || 100,
          timeSpent: progress.timeSpent || 900, // 15 min default
        },
        isCritical: false,
      });
    }

    // Generate learning session activities (group by day and course)
    const sessionMap = new Map<string, any>();
    
    for (const activity of activities) {
      const dateKey = new Date(activity.createdAt).toDateString();
      const sessionKey = `${dateKey}_${activity.courseId}`;
      
      if (!sessionMap.has(sessionKey)) {
        sessionMap.set(sessionKey, {
          id: `computed_session_${sessionKey.replace(/\s/g, '_')}`,
          type: 'learning_session',
          priority: 'low',
          title: `Tanulási munkamenet: ${activity.courseName}`,
          description: `Aktív tanulás a "${activity.courseName}" kurzusban`,
          courseId: activity.courseId,
          courseName: activity.courseName,
          createdAt: activity.createdAt,
          metadata: {
            lessonsCompleted: 1,
            totalTimeSpent: activity.metadata.timeSpent || 900,
            date: dateKey,
          },
          isCritical: false,
        });
      } else {
        const session = sessionMap.get(sessionKey);
        session.metadata.lessonsCompleted++;
        session.metadata.totalTimeSpent += activity.metadata.timeSpent || 900;
      }
    }

    // Combine activities and sessions, limit to 15 total
    const allActivities = [...activities, ...Array.from(sessionMap.values())]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 15);

    return allActivities;

  } catch (error) {
    console.error('❌ Error generating computed activities:', error);
    return [];
  }
}

/**
 * Get user progress data (authenticated users only)
 */
export const getUserProgress = onCall(async (request) => {
  try {
    console.log('🔍 getUserProgress called for user:', request.auth?.uid);
    // Check authentication
    if (!request.auth) {
      throw new Error('Felhasználónak be kell jelentkeznie');
    }

    const userId = request.auth.uid;
    console.log('🔍 Step 1: Fetching enrollments for user:', userId);

    // Get user's enrollments
    const enrollmentsSnapshot = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .get();
    console.log('🔍 Step 2: Enrollments count:', enrollmentsSnapshot.docs.length);

    const enrolledCourses = [];
    let totalLessonsCompleted = 0;
    let totalCertificatesEarned = 0;
    let totalHoursLearned = 0;
    let coursesInProgress = 0;
    let coursesCompleted = 0;

    for (const enrollmentDoc of enrollmentsSnapshot.docs) {
      const enrollment = enrollmentDoc.data();
      const courseId = enrollment.courseId;

      // Get course data
      const courseDoc = await firestore.collection('courses').doc(courseId).get();
      if (!courseDoc.exists) continue;

      const course = courseDoc.data();
      
      // Get lesson progress for this course
      const progressSnapshot = await firestore
        .collection('lessonProgress')
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .get();

      const completedLessons = progressSnapshot.docs.length;
      const totalLessons = course?.modules?.reduce((acc: number, module: any) => 
        acc + (module.lessons?.length || 0), 0) || 0;

      // Calculate course completion percentage
      const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      // Track course progress status
      if (completionPercentage === 100) {
        coursesCompleted++;
      } else if (completionPercentage > 0) {
        coursesInProgress++;
      }

      // Estimate learning hours based on lessons completed
      // Assume average lesson is 15 minutes (0.25 hours)
      const courseHours = completedLessons * 0.25;
      totalHoursLearned += courseHours;

      // Check for certificate
      const certificateDoc = await firestore
        .collection('certificates')
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .limit(1)
        .get();

      const certificateEarned = !certificateDoc.empty;
      if (certificateEarned) totalCertificatesEarned++;

      // Calculate activity metrics
      const lastAccessTime = enrollment.lastAccessedAt?.toDate?.()?.getTime() || enrollment.enrolledAt?.toDate?.()?.getTime() || Date.now();
      const daysSinceLastAccess = Math.floor((Date.now() - lastAccessTime) / (1000 * 60 * 60 * 24));
      
      // Calculate course state using hybrid logic
      const courseState = calculateCourseState(completionPercentage, daysSinceLastAccess, certificateEarned);

      // Calculate priority score for "Continue Learning" section
      // Mix of recent access (30%) + progress (70%)
      const daysSinceAccessCapped = Math.min(daysSinceLastAccess, 30);
      const recencyScore = Math.max(0, (30 - daysSinceAccessCapped) / 30 * 100);
      const priorityScore = (0.7 * completionPercentage) + (0.3 * recencyScore);

      // Estimate remaining time (placeholder calculation)
      const estimatedTotalMinutes = totalLessons * 15; // 15 min per lesson
      const completedMinutes = completedLessons * 15;
      const remainingMinutes = estimatedTotalMinutes - completedMinutes;
      const estimatedTimeRemaining = remainingMinutes > 60 
        ? `${Math.ceil(remainingMinutes / 60)}h`
        : `${remainingMinutes}m`;

      // Get instructor info (if available)
      const instructorName = course?.instructor?.firstName && course?.instructor?.lastName
        ? `${course.instructor.firstName} ${course.instructor.lastName}`
        : course?.instructorName || 'ELIRA';

      // Get next lesson info for in-progress courses
      const nextLesson = completionPercentage < 100 && completionPercentage > 0 ? {
        id: `lesson-${completedLessons + 1}`,
        title: `${completedLessons + 1}. lecke`,
        moduleTitle: course?.modules?.[Math.floor(completedLessons / (totalLessons / (course?.modules?.length || 1)))]?.title || 'Modul',
        estimatedDuration: 15 // minutes
      } : null;

      // Get completion date for completed courses
      const completionDate = certificateEarned ? 
        (certificateDoc.docs[0]?.data()?.issuedAt?.toDate?.()?.toISOString() || null) : null;

      enrolledCourses.push({
        courseId,
        title: course?.title || 'Ismeretlen kurzus',
        courseTitle: course?.title || 'Ismeretlen kurzus', // Alias for component compatibility
        thumbnailUrl: course?.thumbnailUrl,
        totalLessons,
        completedLessons,
        completionPercentage,
        lastAccessedAt: enrollment.lastAccessedAt?.toDate?.()?.toISOString() || enrollment.enrolledAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        certificateEarned,
        certificateId: certificateDoc.docs[0]?.id,
        certificateUrl: certificateEarned ? `/certificates/${certificateDoc.docs[0]?.id}` : null,
        estimatedHours: courseHours,
        priorityScore: Math.round(priorityScore),
        estimatedTimeRemaining,
        instructorName,
        // Enhanced fields for MyCoursesSection
        courseState,
        daysSinceLastAccess,
        nextLesson,
        completionDate,
        // Additional fields for better UX
        difficulty: course?.difficulty || 'BEGINNER',
        category: course?.category?.name || 'Általános',
        enrolledAt: enrollment.enrolledAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        // Course metadata
        description: course?.description || '',
        language: course?.language || 'hu',
        averageRating: course?.averageRating || 0,
        reviewCount: course?.reviewCount || 0,
      });

      totalLessonsCompleted += completedLessons;
    }

    // Round total hours to nearest half hour for better display
    totalHoursLearned = Math.round(totalHoursLearned * 2) / 2;

    // Sort enrolled courses by priority score for "Continue Learning" optimization
    const sortedEnrolledCourses = enrolledCourses.sort((a, b) => b.priorityScore - a.priorityScore);

    // Generate computed recent activities (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const computedActivities = await generateComputedActivities(userId, sevenDaysAgo);

    console.log('🔍 Step 6: Generated computed activities:', computedActivities.length);
    console.log('🔍 Step 7: Returning success with enrolledCourses:', enrolledCourses.length);
    return {
      success: true,
      enrolledCourses: sortedEnrolledCourses,
      // Dashboard stats data
      totalCoursesEnrolled: enrolledCourses.length,
      totalLessonsCompleted,
      totalCertificatesEarned,
      totalHoursLearned,
      coursesInProgress,
      coursesCompleted,
      // Additional analytics
      overallCompletionRate: enrolledCourses.length > 0 ? 
        Math.round(enrolledCourses.reduce((acc, course) => acc + course.completionPercentage, 0) / enrolledCourses.length) : 0,
      // Recent activities for dashboard
      recentActivities: computedActivities,
    };

  } catch (error: any) {
    console.error('❌ getUserProgress error stack:', error.stack);
    throw new HttpsError('internal', error.message || 'Hiba történt a felhasználói adatok lekérése során');
  }
});

/**
 * Get user subscription status
 */
export const getSubscriptionStatus = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Felhasználónak be kell jelentkeznie');
    }

    const userId = request.auth.uid;

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    const userData = userDoc.data();

    // Check for active subscription
    const subscriptionQuery = await firestore
      .collection('subscriptions')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    const hasActiveSubscription = !subscriptionQuery.empty;
    const subscription = hasActiveSubscription ? subscriptionQuery.docs[0].data() : null;

    return {
      success: true,
      hasActiveSubscription,
      subscription,
      user: {
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        profilePictureUrl: userData.avatar,
        subscriptionActive: hasActiveSubscription,
      },
    };

  } catch (error: any) {
    console.error('❌ getSubscriptionStatus error:', error);
    throw new Error(error.message || 'Hiba történt az előfizetési állapot lekérése során');
  }
});

/**
 * Get all users (Admin only)
 */
export const getUsers = onCall(async (request) => {
  try {
    // Check authentication and admin role
    if (!request.auth) {
      throw new Error('Felhasználónak be kell jelentkeznie');
    }

    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság felhasználók lekéréséhez');
    }

    const usersSnapshot = await firestore.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      users
    };

  } catch (error: any) {
    console.error('❌ getUsers error:', error);
    throw new Error(error.message || 'Hiba történt a felhasználók lekérése során');
  }
});

/**
 * Update user role (Admin only)
 */
export const updateUserRole = onCall(async (request) => {
  try {
    // Check authentication and admin role
    if (!request.auth) {
      throw new Error('Felhasználónak be kell jelentkeznie');
    }

    const adminDoc = await firestore.collection('users').doc(request.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság felhasználói szerepkör módosításához');
    }

    const { userId, role } = z.object({
      userId: z.string().min(1, 'Felhasználó ID kötelező'),
      role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN'])
    }).parse(request.data);

    await firestore.collection('users').doc(userId).update({
      role,
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Felhasználói szerepkör sikeresen frissítve'
    };

  } catch (error: any) {
    console.error('❌ updateUserRole error:', error);
    if (error instanceof z.ZodError) {
      throw new Error('Validációs hiba: ' + error.errors.map(e => e.message).join(', '));
    }
    throw new Error(error.message || 'Hiba történt a szerepkör frissítése során');
  }
});

/**
 * Get user profile (own profile or admin)
 */
export const getUserProfile = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Felhasználónak be kell jelentkeznie');
    }

    const { userId } = z.object({
      userId: z.string().optional()
    }).parse(request.data);

    const targetUserId = userId || request.auth.uid;
    const userDoc = await firestore.collection('users').doc(targetUserId).get();

    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található');
    }

    // Check if user can access this profile
    const currentUserDoc = await firestore.collection('users').doc(request.auth.uid).get();
    const currentUserData = currentUserDoc.data();
    
    if (targetUserId !== request.auth.uid && currentUserData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság a felhasználói profil megtekintéséhez');
    }

    return {
      success: true,
      user: {
        id: userDoc.id,
        ...userDoc.data()
      }
    };

  } catch (error: any) {
    console.error('❌ getUserProfile error:', error);
    throw new Error(error.message || 'Hiba történt a felhasználói profil lekérése során');
  }
});

/**
 * Get instructors (Admin/Instructor only)
 */
export const getInstructors = onCall(async (request) => {
  try {
    // Auth required
    if (!request.auth) {
      throw new Error('Nincs jogosultság az oktatók lekérdezéséhez.');
    }

    const callerUid = request.auth.uid;
    const callerDoc = await firestore.collection('users').doc(callerUid).get();
    if (!callerDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const callerData = callerDoc.data() as any;
    if (!['ADMIN', 'INSTRUCTOR'].includes(callerData?.role)) {
      throw new Error('Nincs jogosultság az oktatók lekérdezéséhez.');
    }

    const snap = await firestore.collection('users').where('role', '==', 'INSTRUCTOR').get();
    const instructors = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        email: data.email || null,
      };
    });

    return { success: true, instructors };
  } catch (error: any) {
    console.error('❌ getInstructors error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
    };
  }
});

/**
 * Get public instructors for showcase (no authentication required)
 */
export const getInstructorsPublic = onCall(async (request) => {
  try {
    const { limit = 6, verified = true } = request.data || {};

    // Query instructors with role INSTRUCTOR
    let query = firestore.collection('users').where('role', '==', 'INSTRUCTOR');
    
    // Apply limit
    query = query.limit(limit);

    const snapshot = await query.get();
    const instructors = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      
      // Calculate instructor stats (placeholder values for now)
      const averageRating = data.averageRating || 4.5;
      const reviewCount = data.reviewCount || Math.floor(Math.random() * 50) + 10;
      const studentCount = data.studentCount || Math.floor(Math.random() * 200) + 50;
      const courseCount = data.courseCount || Math.floor(Math.random() * 5) + 1;

      return {
        id: doc.id,
        name: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Névtelen oktató',
        title: data.title || data.companyRole || 'Szakértő oktató',
        bio: data.bio || 'Tapasztalt szakértő a saját területén.',
        avatar: data.profilePictureUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        websiteUrl: data.websiteUrl || null,
        averageRating: averageRating,
        reviewCount: reviewCount,
        studentCount: studentCount,
        courseCount: courseCount,
        expertise: data.specialties || data.credentials || ['Szakértő'],
        company: data.institution || data.company || 'Elira',
        isVerified: verified, // For now, all instructors are considered verified
      };
    });

    return {
      success: true,
      instructors: instructors
    };

  } catch (error: any) {
    console.error('❌ getInstructorsPublic error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
      instructors: []
    };
  }
}); 