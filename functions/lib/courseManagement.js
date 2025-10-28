"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourse = exports.publishCourse = exports.updateCourse = exports.createCourse = void 0;
/**
 * Course Management Functions
 * Handles creating and updating courses with marketing content
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const z = __importStar(require("zod"));
const firestore = admin.firestore();
// Validation schema for course data
const CourseSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    categoryId: z.string().min(1, "Category is required"),
    instructorId: z.string().min(1, "Instructor is required"),
    language: z.string().min(1, "Language is required"),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    certificateEnabled: z.boolean().nullish().default(false),
    thumbnailUrl: z.string().nullish().default(''),
    learningObjectives: z.string().min(10, "Learning objectives must be at least 10 characters"),
    // Marketing fields - all optional with defaults (nullish handles both null and undefined)
    shortDescription: z.string().max(160).nullish().default(''),
    whatYouWillLearn: z.array(z.string()).nullish().default([]),
    requirements: z.array(z.string()).nullish().default([]),
    targetAudience: z.array(z.string()).nullish().default([]),
    guaranteeEnabled: z.boolean().nullish().default(false),
    guaranteeText: z.string().nullish().default(''),
    guaranteeDays: z.number().nullish().default(30),
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
exports.createCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
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
        const slug = validatedData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
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
        // Prepare course data
        const courseData = {
            // Basic info
            title: validatedData.title,
            description: validatedData.description,
            categoryId: validatedData.categoryId,
            instructorId: validatedData.instructorId,
            language: validatedData.language,
            difficulty: validatedData.difficulty,
            certificateEnabled: validatedData.certificateEnabled,
            thumbnailUrl: validatedData.thumbnailUrl || '',
            learningObjectives: validatedData.learningObjectives,
            // Marketing fields
            shortDescription: validatedData.shortDescription || '',
            whatYouWillLearn: validatedData.whatYouWillLearn || [],
            requirements: validatedData.requirements || [],
            targetAudience: validatedData.targetAudience || [],
            guaranteeEnabled: validatedData.guaranteeEnabled || false,
            guaranteeText: validatedData.guaranteeText || '',
            guaranteeDays: validatedData.guaranteeDays || 30,
            faq: validatedData.faq || [],
            // System fields
            slug: finalSlug,
            price: validatedData.price || 0,
            published: validatedData.published || false,
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
        v2_1.logger.info(`Course created: ${courseRef.id} by user ${userId}`);
        return {
            success: true,
            courseId: courseRef.id,
            slug: finalSlug,
            message: 'Kurzus sikeresen létrehozva'
        };
    }
    catch (error) {
        v2_1.logger.error('Create course error:', error);
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
exports.updateCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const { courseId, ...updateData } = request.data || {};
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
        // Check permissions
        const userDoc = await firestore.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'ADMIN';
        const isOwner = courseData?.instructorId === userId;
        if (!isAdmin && !isOwner) {
            throw new Error('Nincs jogosultságod a kurzus szerkesztéséhez');
        }
        // Prepare update object (only update provided fields)
        const updates = {
            updatedAt: new Date().toISOString(),
        };
        // Basic fields
        if (updateData.title !== undefined)
            updates.title = updateData.title;
        if (updateData.description !== undefined)
            updates.description = updateData.description;
        if (updateData.categoryId !== undefined)
            updates.categoryId = updateData.categoryId;
        if (updateData.instructorId !== undefined)
            updates.instructorId = updateData.instructorId;
        if (updateData.language !== undefined)
            updates.language = updateData.language;
        if (updateData.difficulty !== undefined)
            updates.difficulty = updateData.difficulty;
        if (updateData.certificateEnabled !== undefined)
            updates.certificateEnabled = updateData.certificateEnabled;
        if (updateData.thumbnailUrl !== undefined)
            updates.thumbnailUrl = updateData.thumbnailUrl;
        if (updateData.learningObjectives !== undefined)
            updates.learningObjectives = updateData.learningObjectives;
        // Marketing fields
        if (updateData.shortDescription !== undefined)
            updates.shortDescription = updateData.shortDescription;
        if (updateData.whatYouWillLearn !== undefined)
            updates.whatYouWillLearn = updateData.whatYouWillLearn;
        if (updateData.requirements !== undefined)
            updates.requirements = updateData.requirements;
        if (updateData.targetAudience !== undefined)
            updates.targetAudience = updateData.targetAudience;
        if (updateData.guaranteeEnabled !== undefined)
            updates.guaranteeEnabled = updateData.guaranteeEnabled;
        if (updateData.guaranteeText !== undefined)
            updates.guaranteeText = updateData.guaranteeText;
        if (updateData.guaranteeDays !== undefined)
            updates.guaranteeDays = updateData.guaranteeDays;
        if (updateData.faq !== undefined)
            updates.faq = updateData.faq;
        // Optional fields
        if (updateData.price !== undefined)
            updates.price = updateData.price;
        if (updateData.published !== undefined)
            updates.published = updateData.published;
        if (updateData.featured !== undefined)
            updates.featured = updateData.featured;
        // Update slug if title changed
        if (updateData.title && updateData.title !== courseData?.title) {
            const newSlug = updateData.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            // Check if new slug already exists
            const existingSlugQuery = await firestore
                .collection('courses')
                .where('slug', '==', newSlug)
                .limit(1)
                .get();
            if (existingSlugQuery.empty || existingSlugQuery.docs[0].id === courseId) {
                updates.slug = newSlug;
            }
            else {
                updates.slug = `${newSlug}-${Date.now()}`;
            }
        }
        // Perform update
        await courseRef.update(updates);
        v2_1.logger.info(`Course updated: ${courseId} by user ${userId}`);
        return {
            success: true,
            courseId,
            message: 'Kurzus sikeresen frissítve'
        };
    }
    catch (error) {
        v2_1.logger.error('Update course error:', error);
        throw new Error(error.message || 'Hiba történt a kurzus frissítése során');
    }
});
/**
 * Publish a course (set published = true)
 */
exports.publishCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
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
        // Publish the course
        await courseRef.update({
            published: true,
            publishedAt: new Date().toISOString(),
            publishedBy: userId,
            updatedAt: new Date().toISOString(),
        });
        v2_1.logger.info(`Course published: ${courseId} by user ${userId}`);
        return {
            success: true,
            message: 'Kurzus sikeresen publikálva'
        };
    }
    catch (error) {
        v2_1.logger.error('Publish course error:', error);
        throw new Error(error.message || 'Hiba történt a kurzus publikálása során');
    }
});
/**
 * Delete a course (soft delete by setting published = false)
 */
exports.deleteCourse = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
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
        // Soft delete - unpublish the course
        await courseRef.update({
            published: false,
            deletedAt: new Date().toISOString(),
            deletedBy: userId,
            updatedAt: new Date().toISOString(),
        });
        v2_1.logger.info(`Course deleted (unpublished): ${courseId} by user ${userId}`);
        return {
            success: true,
            message: 'Kurzus sikeresen törölve'
        };
    }
    catch (error) {
        v2_1.logger.error('Delete course error:', error);
        throw new Error(error.message || 'Hiba történt a kurzus törlése során');
    }
});
//# sourceMappingURL=courseManagement.js.map