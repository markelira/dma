import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { firestore, auth } from './config';

// Validation schemas
const createQuestionSchema = z.object({
  courseId: z.string().min(1, 'Course ID kötelező'),
  lessonId: z.string().optional(),
  title: z.string().min(1, 'Cím kötelező').max(200, 'Cím maximum 200 karakter lehet'),
  content: z.string().min(1, 'Tartalom kötelező').max(5000, 'Tartalom maximum 5000 karakter lehet'),
  isPublic: z.boolean().default(true),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  tags: z.array(z.string()).optional()
});

const replyQuestionSchema = z.object({
  questionId: z.string().min(1, 'Kérdés ID kötelező'),
  content: z.string().min(1, 'Válasz tartalom kötelező').max(3000, 'Válasz maximum 3000 karakter lehet'),
  isAnswer: z.boolean().default(false)
});

const updateQuestionStatusSchema = z.object({
  questionId: z.string().min(1, 'Kérdés ID kötelező'),
  status: z.enum(['OPEN', 'ANSWERED', 'RESOLVED', 'CLOSED'])
});

/**
 * Create a new question in a course
 */
export const createCourseQuestion = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const validatedData = createQuestionSchema.parse(request.data);

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }
    
    const userData = userDoc.data();
    const userName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Névtelen felhasználó';
    const userRole = userData?.role || 'STUDENT';

    // Verify course access
    const courseDoc = await firestore.collection('courses').doc(validatedData.courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található.');
    }

    // Check if user has access to the course (enrolled or is instructor/admin)
    if (userRole === 'STUDENT') {
      const enrollmentDoc = await firestore
        .collection('enrollments')
        .where('userId', '==', userId)
        .where('courseId', '==', validatedData.courseId)
        .limit(1)
        .get();
      
      if (enrollmentDoc.empty) {
        throw new Error('Nincs jogosultság kérdés feltenni ehhez a kurzushoz.');
      }
    }

    // Create question document
    const questionData = {
      courseId: validatedData.courseId,
      lessonId: validatedData.lessonId || null,
      userId,
      userName,
      userRole,
      title: validatedData.title,
      content: validatedData.content,
      status: 'OPEN' as const,
      priority: validatedData.priority,
      isPublic: validatedData.isPublic,
      isInstructorQuestion: userRole === 'INSTRUCTOR' || userRole === 'ADMIN',
      tags: validatedData.tags || [],
      upvotes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const questionRef = await firestore.collection('courseQuestions').add(questionData);

    console.log(`✅ Question created: ${questionRef.id} by ${userName} (${userRole})`);

    return {
      success: true,
      questionId: questionRef.id,
      message: 'Kérdés sikeresen elküldve.',
      question: {
        id: questionRef.id,
        ...questionData,
        replies: []
      }
    };

  } catch (error: any) {
    console.error('❌ createCourseQuestion error:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Érvénytelen adatok: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw new Error(error.message || 'Ismeretlen hiba történt a kérdés létrehozásakor.');
  }
});

/**
 * Get questions for a course
 */
export const getCourseQuestions = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { courseId, lessonId, status, includePrivate, limit = 50, offset = 0 } = request.data;

    if (!courseId) {
      throw new Error('Course ID kötelező.');
    }

    // Get user role for filtering
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userRole = userDoc.exists ? userDoc.data()?.role : 'STUDENT';

    // Build query
    let query = firestore.collection('courseQuestions')
      .where('courseId', '==', courseId)
      .orderBy('createdAt', 'desc');

    // Filter by lesson if specified
    if (lessonId) {
      query = query.where('lessonId', '==', lessonId);
    }

    // Filter by status if specified
    if (status) {
      query = query.where('status', '==', status);
    }

    // Execute query with pagination
    const questionsSnapshot = await query.limit(limit).offset(offset).get();

    // Process questions
    const questions = [];
    for (const questionDoc of questionsSnapshot.docs) {
      const questionData = questionDoc.data();
      
      // Filter out private questions unless user is owner, instructor, or admin
      if (!questionData.isPublic && 
          questionData.userId !== userId && 
          userRole !== 'INSTRUCTOR' && 
          userRole !== 'ADMIN' && 
          !includePrivate) {
        continue;
      }

      // Get replies
      const repliesSnapshot = await firestore
        .collection('courseQuestions')
        .doc(questionDoc.id)
        .collection('replies')
        .orderBy('createdAt', 'asc')
        .get();

      const replies = repliesSnapshot.docs.map(replyDoc => ({
        id: replyDoc.id,
        ...replyDoc.data()
      }));

      questions.push({
        id: questionDoc.id,
        ...questionData,
        replies
      });
    }

    return {
      success: true,
      questions,
      total: questionsSnapshot.size,
      hasMore: questionsSnapshot.size === limit
    };

  } catch (error: any) {
    console.error('❌ getCourseQuestions error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt a kérdések betöltésekor.');
  }
});

/**
 * Reply to a question
 */
export const replyCourseQuestion = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const validatedData = replyQuestionSchema.parse(request.data);

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }
    
    const userData = userDoc.data();
    const userName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Névtelen felhasználó';
    const userRole = userData?.role || 'STUDENT';

    // Get question to verify access
    const questionDoc = await firestore.collection('courseQuestions').doc(validatedData.questionId).get();
    if (!questionDoc.exists) {
      throw new Error('Kérdés nem található.');
    }

    const questionData = questionDoc.data();

    // Check course access
    if (userRole === 'STUDENT') {
      const enrollmentDoc = await firestore
        .collection('enrollments')
        .where('userId', '==', userId)
        .where('courseId', '==', questionData?.courseId)
        .limit(1)
        .get();
      
      if (enrollmentDoc.empty) {
        throw new Error('Nincs jogosultság válaszolni ehhez a kérdéshez.');
      }
    }

    // Only instructors/admins can mark as official answer
    const isAnswer = validatedData.isAnswer && (userRole === 'INSTRUCTOR' || userRole === 'ADMIN');

    // Create reply
    const replyData = {
      questionId: validatedData.questionId,
      userId,
      userName,
      userRole,
      content: validatedData.content,
      isAnswer,
      upvotes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: []
    };

    const replyRef = await firestore
      .collection('courseQuestions')
      .doc(validatedData.questionId)
      .collection('replies')
      .add(replyData);

    // Update question status if this is an official answer
    if (isAnswer) {
      await firestore.collection('courseQuestions').doc(validatedData.questionId).update({
        status: 'ANSWERED',
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`✅ Reply created: ${replyRef.id} by ${userName} (${userRole}) ${isAnswer ? '(Official Answer)' : ''}`);

    return {
      success: true,
      replyId: replyRef.id,
      message: 'Válasz sikeresen elküldve.',
      reply: {
        id: replyRef.id,
        ...replyData
      }
    };

  } catch (error: any) {
    console.error('❌ replyCourseQuestion error:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Érvénytelen adatok: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw new Error(error.message || 'Ismeretlen hiba történt a válasz küldésekor.');
  }
});

/**
 * Update question status (for instructors/admins)
 */
export const updateQuestionStatus = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const validatedData = updateQuestionStatusSchema.parse(request.data);

    // Get user role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }
    
    const userRole = userDoc.data()?.role || 'STUDENT';

    // Get question
    const questionDoc = await firestore.collection('courseQuestions').doc(validatedData.questionId).get();
    if (!questionDoc.exists) {
      throw new Error('Kérdés nem található.');
    }

    const questionData = questionDoc.data();

    // Only question owner, instructors, or admins can update status
    if (questionData?.userId !== userId && userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      throw new Error('Nincs jogosultság a kérdés státuszának módosítására.');
    }

    // Update status
    await firestore.collection('courseQuestions').doc(validatedData.questionId).update({
      status: validatedData.status,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Question status updated: ${validatedData.questionId} -> ${validatedData.status}`);

    return {
      success: true,
      message: 'Kérdés státusza sikeresen frissítve.',
      status: validatedData.status
    };

  } catch (error: any) {
    console.error('❌ updateQuestionStatus error:', error);
    
    if (error instanceof z.ZodError) {
      throw new Error(`Érvénytelen adatok: ${error.errors.map(e => e.message).join(', ')}`);
    }
    
    throw new Error(error.message || 'Ismeretlen hiba történt a státusz frissítésekor.');
  }
});

/**
 * Upvote a question or reply
 */
export const upvoteQuestion = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { questionId, replyId } = request.data;

    if (!questionId) {
      throw new Error('Kérdés ID kötelező.');
    }

    const targetCollection = replyId 
      ? firestore.collection('courseQuestions').doc(questionId).collection('replies')
      : firestore.collection('courseQuestions');
    
    const targetId = replyId || questionId;
    const targetDoc = await targetCollection.doc(targetId).get();
    
    if (!targetDoc.exists) {
      throw new Error(replyId ? 'Válasz nem található.' : 'Kérdés nem található.');
    }

    // Check if user already upvoted
    const upvoteDoc = await firestore
      .collection('questionUpvotes')
      .where('userId', '==', userId)
      .where('targetId', '==', targetId)
      .where('type', '==', replyId ? 'reply' : 'question')
      .limit(1)
      .get();

    if (!upvoteDoc.empty) {
      // Remove upvote
      await upvoteDoc.docs[0].ref.delete();
      await targetCollection.doc(targetId).update({
        upvotes: (targetDoc.data()?.upvotes || 0) - 1,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        action: 'removed',
        message: 'Szavazat eltávolítva.'
      };
    } else {
      // Add upvote
      await firestore.collection('questionUpvotes').add({
        userId,
        targetId,
        type: replyId ? 'reply' : 'question',
        createdAt: new Date().toISOString()
      });

      await targetCollection.doc(targetId).update({
        upvotes: (targetDoc.data()?.upvotes || 0) + 1,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        action: 'added',
        message: 'Szavazat hozzáadva.'
      };
    }

  } catch (error: any) {
    console.error('❌ upvoteQuestion error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt a szavazás során.');
  }
});