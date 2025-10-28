import { onCall } from 'firebase-functions/v2/https';
import { firestore } from './config';

export const testFirestoreConnection = onCall(async () => {
  try {
    console.log('🔍 Testing Firestore connection...');
    console.log('FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
    
    // Try to get a document from courses collection
    const coursesSnapshot = await firestore.collection('courses').get();
    console.log('✅ Found', coursesSnapshot.size, 'courses');
    
    // Try to get a document from categories collection
    const categoriesSnapshot = await firestore.collection('categories').get();
    console.log('✅ Found', categoriesSnapshot.size, 'categories');
    
    // Try to get a document from universities collection
    const universitiesSnapshot = await firestore.collection('universities').get();
    console.log('✅ Found', universitiesSnapshot.size, 'universities');
    
    // Try to get a document from reviews collection
    const reviewsSnapshot = await firestore.collection('reviews').get();
    console.log('✅ Found', reviewsSnapshot.size, 'reviews');
    
    return {
      success: true,
      message: 'Firestore connection test completed',
      stats: {
        courses: coursesSnapshot.size,
        categories: categoriesSnapshot.size,
        universities: universitiesSnapshot.size,
        reviews: reviewsSnapshot.size,
      }
    };
  } catch (error: any) {
    console.error('❌ Firestore connection test failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

export const testReviews = onCall(async (request) => {
  try {
    console.log('🔍 Testing reviews...');
    
    const snapshot = await firestore.collection('reviews').get();
    console.log('🔍 Found', snapshot.size, 'reviews');
    
    const reviews = [];
    for (const reviewDoc of snapshot.docs) {
      const reviewData = reviewDoc.data();
      console.log('🔍 Review:', { id: reviewDoc.id, isApproved: reviewData.isApproved });
      
      reviews.push({
        id: reviewDoc.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        isApproved: reviewData.isApproved,
      });
    }
    
    return {
      success: true,
      reviews,
      total: reviews.length
    };
  } catch (error: any) {
    console.error('❌ Test reviews failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}); 