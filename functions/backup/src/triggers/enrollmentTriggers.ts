import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
// Import FieldValue from the modular Firestore package (required since firebase-admin v11)
import { FieldValue } from 'firebase-admin/firestore';

export const onEnrollmentCreate = onDocumentCreated('enrollments/{enrollmentId}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  
  try {
    const enrollmentData = snap.data();
    const courseId = enrollmentData?.courseId;

    if (!courseId) {
      console.error('Enrollment document missing courseId:', enrollmentData);
      return;
    }

    // Get reference to the course document
    const courseRef = admin.firestore().collection('courses').doc(courseId);

    // Increment the enrollmentCount field by 1
    await courseRef.update({
      enrollmentCount: FieldValue.increment(1)
    });

    console.log(`Successfully incremented enrollmentCount for course: ${courseId}`);
  } catch (error) {
    console.error('Error in onEnrollmentCreate trigger:', error);
    throw error;
  }
}); 