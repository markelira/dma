import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const onProgressUpdate = onDocumentUpdated('lessonProgress/{progressId}', async (event) => {
  const change = event.data;
  if (!change) return;
  
  try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Check if the lesson was just completed (isCompleted changed from false to true)
      if (beforeData.isCompleted === false && afterData.isCompleted === true) {
        const userId = afterData.userId;
        const courseId = afterData.courseId;
        const lessonId = afterData.lessonId;
        
        console.log(`User ${userId} completed lesson ${lessonId} in course ${courseId}`);
        
        // Get all lessons for this course
        const lessonsSnapshot = await admin.firestore()
          .collection('courses')
          .doc(courseId)
          .collection('modules')
          .get();
        
        let totalLessons = 0;
        const modulePromises = lessonsSnapshot.docs.map(async (moduleDoc) => {
          const lessonsInModule = await moduleDoc.ref.collection('lessons').get();
          totalLessons += lessonsInModule.size;
        });
        
        await Promise.all(modulePromises);
        
        // Get all completed lessons for this user in this course
        const completedLessonsSnapshot = await admin.firestore()
          .collection('lessonProgress')
          .where('userId', '==', userId)
          .where('courseId', '==', courseId)
          .where('isCompleted', '==', true)
          .get();
        
        const completedLessonsCount = completedLessonsSnapshot.size;
        
        console.log(`Course ${courseId}: ${completedLessonsCount}/${totalLessons} lessons completed`);
        
        // Check if user has completed 100% of the course
        if (completedLessonsCount === totalLessons) {
          console.log(`🎉 User ${userId} has completed course ${courseId}! Certificate generation should start now.`);
          
                // Create certificate document
      await admin.firestore()
        .collection('certificates')
        .add({
          userId: userId,
          courseId: courseId,
          status: 'PENDING',
          completedAt: new Date(),
          createdAt: new Date()
        });
          
          console.log(`✅ Certificate document created for user ${userId} and course ${courseId}`);
        }
      }
    } catch (error) {
      console.error('Error in onProgressUpdate trigger:', error);
      throw error;
    }
  }); 