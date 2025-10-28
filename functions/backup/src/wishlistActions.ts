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
 * Get user's wishlist
 */
export const getWishlist = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Get user's wishlist items
    const wishlistSnapshot = await firestore
      .collection('wishlist')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const wishlistItems = [];

    for (const wishlistDoc of wishlistSnapshot.docs) {
      const wishlistData = wishlistDoc.data();
      const courseId = wishlistData.courseId;

      // Get course data
      const courseDoc = await firestore.collection('courses').doc(courseId).get();
      if (!courseDoc.exists) continue;

      const courseData = courseDoc.data();

      // Get instructor data
      let instructor = null;
      if (courseData.instructorId) {
        const instructorDoc = await firestore.collection('users').doc(courseData.instructorId).get();
        if (instructorDoc.exists) {
          const instructorData = instructorDoc.data();
          instructor = {
            id: instructorData.id,
            firstName: instructorData.firstName,
            lastName: instructorData.lastName,
            profilePictureUrl: instructorData.avatar,
          };
        }
      }

      // Get category data
      let category = null;
      if (courseData.categoryId) {
        const categoryDoc = await firestore.collection('categories').doc(courseData.categoryId).get();
        if (categoryDoc.exists) {
          const categoryData = categoryDoc.data();
          category = {
            id: categoryData.id,
            name: categoryData.name,
          };
        }
      }

      wishlistItems.push({
        id: wishlistDoc.id,
        courseId,
        createdAt: wishlistData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        course: {
          id: courseId,
          title: courseData.title,
          description: courseData.description,
          thumbnailUrl: courseData.thumbnailUrl,
          status: courseData.status,
          instructor,
          category,
        },
      });
    }

    return {
      success: true,
      wishlist: wishlistItems,
    };

  } catch (error: any) {
    console.error('❌ getWishlist error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Check if course is in user's wishlist
 */
export const getWishlistStatus = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { courseId } = request.data;

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező.');
    }

    // Check if course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('A kurzus nem található.');
    }

    // Check if course is in wishlist
    const wishlistQuery = await firestore
      .collection('wishlist')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    const isInWishlist = !wishlistQuery.empty;

    return {
      success: true,
      isInWishlist,
    };

  } catch (error: any) {
    console.error('❌ getWishlistStatus error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Add course to wishlist
 */
export const addToWishlist = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { courseId } = request.data;

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező.');
    }

    // Check if course exists
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('A kurzus nem található.');
    }

    // Check if already in wishlist
    const existingWishlistQuery = await firestore
      .collection('wishlist')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (!existingWishlistQuery.empty) {
      throw new Error('A kurzus már a kívánságlistában van.');
    }

    // Add to wishlist
    await firestore.collection('wishlist').add({
      userId,
      courseId,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: 'Kurzus sikeresen hozzáadva a kívánságlistához.',
    };

  } catch (error: any) {
    console.error('❌ addToWishlist error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Remove course from wishlist
 */
export const removeFromWishlist = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { courseId } = request.data;

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező.');
    }

    // Find and delete wishlist item
    const wishlistQuery = await firestore
      .collection('wishlist')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .limit(1)
      .get();

    if (wishlistQuery.empty) {
      throw new Error('A kurzus nem található a kívánságlistában.');
    }

    const wishlistDoc = wishlistQuery.docs[0];
    await wishlistDoc.ref.delete();

    return {
      success: true,
      message: 'Kurzus sikeresen eltávolítva a kívánságlistából.',
    };

  } catch (error: any) {
    console.error('❌ removeFromWishlist error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
}); 