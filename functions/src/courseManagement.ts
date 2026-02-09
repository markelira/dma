/**
 * Course Management Functions
 * Handles creating and updating courses with marketing content
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as z from 'zod';
import { sendNewContentAvailableEmail } from './email/templates/newContentAvailable';
import { maskEmail } from './utils/maskPii';
import { slugify } from './utils/slugify';

const firestore = admin.firestore();

// Validation schema for course data
const CourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Category is required"),
  categoryIds: z.array(z.string()).min(1, "At least one category is required").optional(), // NEW: Multiple categories support
  instructorId: z.string().min(1, "Instructor is required"),
  instructorIds: z.array(z.string()).min(1, "At least one instructor is required").optional(), // NEW: Multiple instructors support

  // NEW: Course type field (REQUIRED)
  courseType: z.enum(['ACADEMIA', 'WEBINAR', 'MASTERCLASS', 'PODCAST'], {
    required_error: "Course type is required",
    invalid_type_error: "Course type must be ACADEMIA, WEBINAR, MASTERCLASS, or PODCAST"
  }),

  // Content creation date (YYYY-MM-DD) - when the content was originally recorded/produced
  contentCreatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Content creation date must be in YYYY-MM-DD format"),

  language: z.string().nullish().default('hu'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).nullish().default('BEGINNER'),
  certificateEnabled: z.boolean().nullish().default(false),
  thumbnailUrl: z.string().nullish().default(''),
  learningObjectives: z.string().nullish().default(''),

  // Marketing fields - all optional with defaults (nullish handles both null and undefined)
  whatYouWillLearn: z.array(z.string()).nullish().default([]),
  requirements: z.array(z.string()).nullish().default([]),
  targetAudience: z.array(z.string()).nullish().default([]),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string()
  })).nullish().default([]),

  // Optional fields
  price: z.number().nullish().default(0),
  published: z.boolean().nullish().default(false),
  featured: z.boolean().nullish().default(false),
}).passthrough(); // Allow extra fields

/**
 * Create a new course
 */
export const createCourse = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user has permission (ADMIN or INSTRUCTOR)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || !['ADMIN', 'INSTRUCTOR'].includes(userData.role)) {
      throw new Error('Nincs jogosultságod kurzus létrehozásához');
    }

    // Validate input data
    const validatedData = CourseSchema.parse(request.data);

    // Generate slug from title
    const slug = slugify(validatedData.title);

    // Check if slug already exists
    const existingSlugQuery = await firestore
      .collection('courses')
      .where('slug', '==', slug)
      .limit(1)
      .get();

    let finalSlug = slug;
    if (!existingSlugQuery.empty) {
      // Add timestamp to make it unique
      finalSlug = `${slug}-${Date.now()}`;
    }

    // Check if thumbnailUrl is a base64 data URL (too large for Firestore)
    let thumbnailUrl = validatedData.thumbnailUrl || '';
    if (thumbnailUrl.startsWith('data:')) {
      // Base64 data URLs are too large for Firestore, skip them
      logger.warn('Base64 data URL detected in thumbnailUrl, skipping...');
      thumbnailUrl = '';
    }

    // Prepare course data
    const courseData = {
      // Basic info
      title: validatedData.title,
      description: validatedData.description,
      categoryId: validatedData.categoryId,
      categoryIds: validatedData.categoryIds || [validatedData.categoryId], // NEW: Multiple categories
      instructorId: validatedData.instructorId,
      instructorIds: validatedData.instructorIds || [validatedData.instructorId], // NEW: Multiple instructors
      courseType: validatedData.courseType, // NEW: Course type
      contentCreatedAt: validatedData.contentCreatedAt, // Content creation date (YYYY-MM-DD)
      language: validatedData.language || 'hu',
      difficulty: validatedData.difficulty || 'BEGINNER',
      certificateEnabled: validatedData.certificateEnabled || false,
      thumbnailUrl: thumbnailUrl,
      learningObjectives: validatedData.learningObjectives,

      // Marketing fields
      whatYouWillLearn: validatedData.whatYouWillLearn || [],
      requirements: validatedData.requirements || [],
      targetAudience: validatedData.targetAudience || [],
      faq: validatedData.faq || [],

      // System fields
      slug: finalSlug,
      price: validatedData.price || 0,
      published: validatedData.published || false,
      status: 'DRAFT', // Default to draft, will be set to PUBLISHED when published
      visibility: 'PUBLIC', // Default visibility
      isPlus: false, // Default to free course
      featured: validatedData.featured || false,
      enrollmentCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    };

    // Create course document
    const courseRef = await firestore.collection('courses').add(courseData);
    const courseId = courseRef.id;

    logger.info(`Course created: ${courseId} by user ${userId} with type ${validatedData.courseType}`);

    return {
      success: true,
      courseId,
      slug: finalSlug,
      message: 'Kurzus sikeresen létrehozva'
    };

  } catch (error: any) {
    logger.error('Create course error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    throw new Error(error.message || 'Hiba történt a kurzus létrehozása során');
  }
});

/**
 * Update an existing course
 */
export const updateCourse = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  // Diagnostic logging for CORS debugging
  logger.info('🔍 updateCourse called', {
    hasAuth: !!request.auth,
    hasData: !!request.data,
    rawRequest: request.rawRequest ? {
      method: request.rawRequest.method,
      origin: request.rawRequest.headers.origin,
      headers: Object.keys(request.rawRequest.headers)
    } : 'no rawRequest'
  });

  try {
    const { courseId, ...updateData } = request.data || {};

    // Check authentication
    if (!request.auth) {
      logger.warn('❌ updateCourse: No authentication');
      throw new Error('Hitelesítés szükséges');
    }

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }

    const userId = request.auth.uid;

    // Get course document
    const courseRef = firestore.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található');
    }

    const courseData = courseDoc.data();

    // Check permissions
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const isAdmin = userData?.role === 'ADMIN';
    const isOwner = courseData?.instructorId === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Nincs jogosultságod a kurzus szerkesztéséhez');
    }

    // Prepare update object (only update provided fields)
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Basic fields
    if (updateData.title !== undefined) updates.title = updateData.title;
    if (updateData.description !== undefined) updates.description = updateData.description;
    if (updateData.categoryId !== undefined) updates.categoryId = updateData.categoryId;
    if (updateData.categoryIds !== undefined) updates.categoryIds = updateData.categoryIds;
    if (updateData.instructorId !== undefined) updates.instructorId = updateData.instructorId;
    if (updateData.instructorIds !== undefined) updates.instructorIds = updateData.instructorIds;
    if (updateData.contentCreatedAt !== undefined) updates.contentCreatedAt = updateData.contentCreatedAt;
    if (updateData.language !== undefined) updates.language = updateData.language;
    if (updateData.difficulty !== undefined) updates.difficulty = updateData.difficulty;
    if (updateData.certificateEnabled !== undefined) updates.certificateEnabled = updateData.certificateEnabled;
    if (updateData.thumbnailUrl !== undefined) {
      // Skip base64 data URLs (too large for Firestore)
      if (updateData.thumbnailUrl.startsWith('data:')) {
        logger.warn('Base64 data URL detected in thumbnailUrl update, skipping...');
      } else {
        updates.thumbnailUrl = updateData.thumbnailUrl;
      }
    }
    if (updateData.learningObjectives !== undefined) updates.learningObjectives = updateData.learningObjectives;

    // Marketing fields
    if (updateData.whatYouWillLearn !== undefined) updates.whatYouWillLearn = updateData.whatYouWillLearn;
    if (updateData.requirements !== undefined) updates.requirements = updateData.requirements;
    if (updateData.targetAudience !== undefined) updates.targetAudience = updateData.targetAudience;
    if (updateData.faq !== undefined) updates.faq = updateData.faq;

    // Optional fields
    if (updateData.price !== undefined) updates.price = updateData.price;
    if (updateData.published !== undefined) updates.published = updateData.published;
    if (updateData.featured !== undefined) updates.featured = updateData.featured;

    // Update slug if title changed
    if (updateData.title && updateData.title !== courseData?.title) {
      const newSlug = slugify(updateData.title);

      // Check if new slug already exists
      const existingSlugQuery = await firestore
        .collection('courses')
        .where('slug', '==', newSlug)
        .limit(1)
        .get();

      if (existingSlugQuery.empty || existingSlugQuery.docs[0].id === courseId) {
        updates.slug = newSlug;
      } else {
        updates.slug = `${newSlug}-${Date.now()}`;
      }
    }

    // Perform update
    await courseRef.update(updates);

    logger.info(`Course updated: ${courseId} by user ${userId}`);

    return {
      success: true,
      courseId,
      message: 'Kurzus sikeresen frissítve'
    };

  } catch (error: any) {
    logger.error('Update course error:', error);
    throw new Error(error.message || 'Hiba történt a kurzus frissítése során');
  }
});

/**
 * Publish a course (set published = true)
 */
export const publishCourse = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  try {
    const { courseId } = request.data || {};

    // Check authentication
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }

    const userId = request.auth.uid;

    // Get course document
    const courseRef = firestore.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található');
    }

    const courseData = courseDoc.data();

    // Check permissions (only admin or owner)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const isAdmin = userData?.role === 'ADMIN';
    const isOwner = courseData?.instructorId === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Nincs jogosultságod a kurzus publikálásához');
    }

    // Auto-generate slug if not exists
    let slug = courseData?.slug;
    if (!slug || slug.trim() === '') {
      slug = slugify(courseData?.title || 'course');

      // Check for uniqueness
      const existingSlugQuery = await firestore
        .collection('courses')
        .where('slug', '==', slug)
        .limit(1)
        .get();

      if (!existingSlugQuery.empty && existingSlugQuery.docs[0].id !== courseId) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Auto-generate meta description from course description
    const metaDescription = courseData?.description
      ? courseData.description.substring(0, 160)
      : '';

    // Publish the course with defaults
    await courseRef.update({
      published: true,
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      slug: slug,
      metaDescription: metaDescription,
      publishedAt: new Date().toISOString(),
      publishedBy: userId,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Course published: ${courseId} by user ${userId}`);

    // Notify all registered users about new content
    const courseTitle = courseData?.title || 'Új tartalom';
    try {
      const usersSnapshot = await firestore.collection('users').get();
      const emailPromises: Promise<{ success: boolean; error?: string }>[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (userData.email) {
          const firstName = userData.firstName || userData.displayName?.split(' ')[0] || 'Felhasználó';

          emailPromises.push(
            sendNewContentAvailableEmail({
              firstName,
              email: userData.email,
              courseTitle,
              courseId,
            }).catch((err) => {
              logger.warn(`Error sending new content email to ${maskEmail(userData.email)}:`, err.message);
              return { success: false, error: err.message };
            })
          );
        }
      }

      // Wait for all emails to complete (with individual error handling)
      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      logger.info(`New content notification: ${successCount} sent, ${failCount} failed for course ${courseId}`);
    } catch (notifyError: any) {
      // Don't fail the publish if notifications fail
      logger.error('Error sending new content notifications:', notifyError.message);
    }

    return {
      success: true,
      message: 'Kurzus sikeresen publikálva'
    };

  } catch (error: any) {
    logger.error('Publish course error:', error);
    throw new Error(error.message || 'Hiba történt a kurzus publikálása során');
  }
});

/**
 * Delete a course (HARD delete - removes course and all related data)
 */
export const deleteCourse = onCall({
  cors: true,
  region: 'europe-west1',
}, async (request) => {
  try {
    const { courseId } = request.data || {};

    // Check authentication
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező');
    }

    const userId = request.auth.uid;

    // Get course document
    const courseRef = firestore.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található');
    }

    const courseData = courseDoc.data();

    // Check permissions (only admin or owner)
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const isAdmin = userData?.role === 'ADMIN';
    const isOwner = courseData?.instructorId === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Nincs jogosultságod a kurzus törléséhez');
    }

    // HARD DELETE: Remove all related data

    // 1) Delete flat lessons subcollection (courses/{courseId}/lessons)
    const lessonsSnapshot = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('lessons')
      .get();

    const lessonDeletePromises = lessonsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(lessonDeletePromises);
    logger.info(`Deleted ${lessonsSnapshot.size} lessons for course ${courseId}`);

    // 2) Delete modules and their lessons subcollections
    const modulesSnapshot = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .get();

    for (const moduleDoc of modulesSnapshot.docs) {
      // Delete lessons within module
      const moduleLessonsSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleDoc.id)
        .collection('lessons')
        .get();

      const moduleLessonDeletePromises = moduleLessonsSnapshot.docs.map(doc => doc.ref.delete());
      await Promise.all(moduleLessonDeletePromises);

      // Delete module itself
      await moduleDoc.ref.delete();
    }
    logger.info(`Deleted ${modulesSnapshot.size} modules for course ${courseId}`);

    // 3) Delete enrollments for this course
    const enrollmentsSnapshot = await firestore
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .get();

    const enrollmentDeletePromises = enrollmentsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(enrollmentDeletePromises);
    logger.info(`Deleted ${enrollmentsSnapshot.size} enrollments for course ${courseId}`);

    // 4) Delete lesson progress records for this course
    const progressSnapshot = await firestore
      .collection('lessonProgress')
      .where('courseId', '==', courseId)
      .get();

    const progressDeletePromises = progressSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(progressDeletePromises);
    logger.info(`Deleted ${progressSnapshot.size} progress records for course ${courseId}`);

    // 5) Delete the course document itself
    await courseRef.delete();

    logger.info(`Course HARD DELETED: ${courseId} by user ${userId}`);

    return {
      success: true,
      message: 'Kurzus és összes kapcsolódó adat sikeresen törölve'
    };

  } catch (error: any) {
    logger.error('Delete course error:', error);
    throw new Error(error.message || 'Hiba történt a kurzus törlése során');
  }
});
