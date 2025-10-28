import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { firestore } from './config';

// Zod schema for review creation
const createReviewSchema = z.object({
  courseId: z.string().min(1, 'Kurzus azonosító kötelező.'),
  rating: z.number().int().min(1).max(5, 'Értékelés 1-5 között kell legyen.'),
  comment: z.string().max(1000, 'Komment maximum 1000 karakter lehet.').optional(),
});

/**
 * Create a new review for a course
 */
export const createReview = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Nincs jogosultság értékelés létrehozásához.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'STUDENT') {
      throw new Error('Csak diákok értékelhetnek kurzust.');
    }

    // Validate input data
    const data = createReviewSchema.parse(request.data);

    // Check if course exists
    const courseDoc = await firestore.collection('courses').doc(data.courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található.');
    }

    // Check if user is enrolled in the course
    const enrollmentDoc = await firestore
      .collection('enrollments')
      .doc(`${userId}_${data.courseId}`)
      .get();

    if (!enrollmentDoc.exists) {
      throw new Error('Csak beiratkozott felhasználók értékelhetnek kurzust.');
    }

    // Check if user already reviewed this course
    const existingReviewQuery = await firestore
      .collection('reviews')
      .where('userId', '==', userId)
      .where('courseId', '==', data.courseId)
      .limit(1)
      .get();

    if (!existingReviewQuery.empty) {
      throw new Error('Már értékelte ezt a kurzust.');
    }

    // Create review
    const reviewData = {
      userId,
      courseId: data.courseId,
      rating: data.rating,
      comment: data.comment || '',
      isApproved: false, // Default: requires approval
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const reviewRef = await firestore.collection('reviews').add(reviewData);

    return {
      success: true,
      message: 'Értékelés sikeresen hozzáadva, jóváhagyásra vár.',
      review: { id: reviewRef.id, ...reviewData },
    };
  } catch (error: any) {
    console.error('❌ createReview error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
    };
  }
});

/**
 * Get all approved reviews with pagination and filtering
 */
export const getAllReviews = onCall(async (request) => {
  try {
    console.log('🔍 getAllReviews called with data:', request.data);

    const {
      limit = 10,
      offset = 0,
      approved = true,
    } = request.data || {};

    // Convert string values to appropriate types
    const limitNum = parseInt(limit) || 10;
    const offsetNum = parseInt(offset) || 0;
    const approvedBool = approved === 'true';

    console.log('🔍 Parsed parameters:', { limitNum, offsetNum, approved, approvedBool });

    // Build query - get all reviews first
    const snapshot = await firestore.collection('reviews').get();
    const total = snapshot.size;

    console.log('🔍 Found', total, 'reviews in database');

    // Filter in memory for now
    const reviews: any[] = [];
    for (const reviewDoc of snapshot.docs) {
      const reviewData = reviewDoc.data();
      console.log('🔍 Review data:', { id: reviewDoc.id, isApproved: reviewData.isApproved, approved, approvedBool });

      // Apply approved filter in memory
      if (approved && reviewData.isApproved !== approved) {
        console.log('🔍 Skipping review due to approved filter');
        continue;
      }

      // Get user data for each review
      const userDoc = await firestore.collection('users').doc(reviewData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      // Get course data for each review
      const courseDoc = await firestore.collection('courses').doc(reviewData.courseId).get();
      const courseData = courseDoc.exists ? courseDoc.data() : null;

      reviews.push({
        id: reviewDoc.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: reviewData.createdAt,
        user: userData
          ? {
              id: userData.id,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              role: userData.role || 'STUDENT',
              companyRole: userData.companyRole || null,
              institution: userData.institution || null,
            }
          : null,
        course: courseData
          ? {
              id: courseData.id,
              title: courseData.title,
            }
          : null,
      });
    }

    // Sort reviews by createdAt in memory
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      reviews,
      total,
    };
  } catch (error: any) {
    console.error('❌ getAllReviews error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
    };
  }
});

/**
 * Get reviews for a specific course
 */
export const getReviewsForCourse = onCall(async (request) => {
  try {
    const { courseId } = request.data;

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező.');
    }

    // Check if course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található.');
    }

    // Get reviews with user data
    const reviewsQuery = await firestore
      .collection('reviews')
      .where('courseId', '==', courseId)
      .where('isApproved', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews: any[] = [];
    for (const reviewDoc of reviewsQuery.docs) {
      const reviewData = reviewDoc.data();

      const userDoc = await firestore.collection('users').doc(reviewData.userId).get();
      const userData = userDoc.exists ? userDoc.data() : null;

      reviews.push({
        id: reviewDoc.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: reviewData.createdAt,
        user: userData
          ? {
              id: userData.id,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              role: userData.role || 'STUDENT',
              companyRole: userData.companyRole || null,
              institution: userData.institution || null,
            }
          : null,
      });
    }

    return {
      success: true,
      reviews,
    };
  } catch (error: any) {
    console.error('❌ getReviewsForCourse error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
    };
  }
}); 