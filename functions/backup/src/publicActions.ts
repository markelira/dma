import { onCall } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only if not already initialized
if (getApps().length === 0) {
  initializeApp();
}
const firestore = getFirestore();

/**
 * Get public university data by slug
 */
export const getPublicUniversity = onCall(async (request) => {
  try {
    const { slug } = request.data;

    if (!slug) {
      throw new Error('Egyetem slug kötelező.');
    }

    // Find university by slug
    const universityQuery = await firestore
      .collection('universities')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (universityQuery.empty) {
      throw new Error('Az egyetem nem található.');
    }

    const universityDoc = universityQuery.docs[0];
    const universityData = universityDoc.data();

    // Get courses for this university
    const coursesSnapshot = await firestore
      .collection('courses')
      .where('universityId', '==', universityDoc.id)
      .where('status', '==', 'PUBLISHED')
      .get();

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      slug: doc.data().slug,
      thumbnailUrl: doc.data().thumbnailUrl,
    }));

    // Get enrollment count for this university
    const enrollmentsSnapshot = await firestore
      .collection('enrollments')
      .where('universityId', '==', universityDoc.id)
      .get();

    const totalEnrollments = enrollmentsSnapshot.size;

    // Get unique student count
    const uniqueStudents = new Set();
    enrollmentsSnapshot.docs.forEach(doc => {
      uniqueStudents.add(doc.data().userId);
    });

    const studentCount = uniqueStudents.size;

    return {
      success: true,
      id: universityDoc.id,
      name: universityData.name,
      logoUrl: universityData.logoUrl,
      description: universityData.description,
      website: universityData.website,
      phone: universityData.phone,
      address: universityData.address,
      courseCount: courses.length,
      studentCount,
      totalEnrollments,
      courses,
      // Premium fields with defaults
      backgroundImageUrl: universityData.backgroundImageUrl || null,
      videoUrl: universityData.videoUrl || null,
      foundedYear: universityData.foundedYear || 1995,
      rating: universityData.rating || 4.5,
      accreditationCount: universityData.accreditationCount || 8,
      employmentRate: universityData.employmentRate || 92,
      internationalStudents: universityData.internationalStudents || 150,
      successRate: universityData.successRate || 87,
      trendingPrograms: universityData.trendingPrograms || [
        "Adattudomány és AI",
        "Digitális marketing", 
        "Környezettudományok",
        "UX/UI tervezés",
        "Fenntartható energetika"
      ]
    };

  } catch (error: any) {
    console.error('❌ getPublicUniversity error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
}); 