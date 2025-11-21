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
exports.getCoursesWithFilters = void 0;
/**
 * Course Catalog Functions
 * Public endpoints for course discovery and browsing
 */
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore = admin.firestore();
/**
 * Helper function to enrich course data with instructor and category information
 */
const enrichCourse = async (course) => {
    let instructor = null;
    let category = null;
    // Lookup instructor data
    if (course.instructorId) {
        try {
            const instructorDoc = await firestore.collection('instructors').doc(course.instructorId).get();
            if (instructorDoc.exists) {
                const instructorData = instructorDoc.data();
                instructor = {
                    id: instructorDoc.id,
                    firstName: instructorData?.firstName || 'Ismeretlen',
                    lastName: instructorData?.lastName || 'Oktató',
                    profilePictureUrl: instructorData?.profilePictureUrl || undefined,
                };
            }
        }
        catch (error) {
            console.warn(`Failed to lookup instructor ${course.instructorId} for course ${course.id}:`, error);
        }
    }
    // Lookup category data
    if (course.categoryId) {
        try {
            const categoryDoc = await firestore.collection('categories').doc(course.categoryId).get();
            if (categoryDoc.exists) {
                const categoryData = categoryDoc.data();
                category = {
                    id: categoryDoc.id,
                    name: categoryData?.name || 'Ismeretlen kategória',
                };
            }
        }
        catch (error) {
            console.warn(`Failed to lookup category ${course.categoryId} for course ${course.id}:`, error);
        }
    }
    // Return enriched course with safe fallbacks
    return {
        ...course,
        instructor: instructor ?? {
            id: course.instructorId || 'unknown',
            firstName: 'Ismeretlen',
            lastName: 'Oktató',
            profilePictureUrl: undefined,
        },
        category: category ?? {
            id: course.categoryId || 'unknown',
            name: 'Ismeretlen kategória',
        },
    };
};
/**
 * Get courses with advanced filtering for catalog/browse interface
 * Public endpoint with CORS enabled
 */
exports.getCoursesWithFilters = (0, https_1.onCall)({
    cors: true,
    region: 'us-central1',
}, async (request) => {
    try {
        const queryId = Math.random().toString(36).substr(2, 9);
        console.log(`🔍 [${queryId}] getCoursesWithFilters called with data:`, request.data);
        const { sort = 'createdAt', order = 'desc', limit = 10, offset = 0, categoryId, search, status = 'PUBLISHED', universityId, isPlus, difficulty, language, certificateEnabled, includeTrending = false, includeRecommendations = false, excludeEnrolled = false, } = request.data || {};
        console.log(`🔍 [${queryId}] Parsed parameters:`, {
            sort, order, limit, offset, categoryId, search, status,
            universityId, isPlus, difficulty, language, certificateEnabled,
            includeTrending, includeRecommendations, excludeEnrolled
        });
        // Get user ID for enrollment checks and recommendations
        const userId = request.auth?.uid;
        let userEnrollments = new Set();
        let userCategories = new Set();
        // Get user's current enrollments for personalization
        if (userId && (includeRecommendations || excludeEnrolled)) {
            try {
                const enrollmentsQuery = await firestore
                    .collection('enrollments')
                    .where('userId', '==', userId)
                    .get();
                const enrolledCourseIds = enrollmentsQuery.docs.map((doc) => doc.data().courseId);
                userEnrollments = new Set(enrolledCourseIds);
                // Get categories of enrolled courses for recommendations
                if (includeRecommendations && enrolledCourseIds.length > 0) {
                    const enrolledCoursesQuery = await firestore
                        .collection('courses')
                        .where(admin.firestore.FieldPath.documentId(), 'in', enrolledCourseIds.slice(0, 10))
                        .get();
                    enrolledCoursesQuery.docs.forEach((doc) => {
                        const courseData = doc.data();
                        if (courseData.categoryId) {
                            userCategories.add(courseData.categoryId);
                        }
                    });
                }
                console.log(`🔍 [${queryId}] User enrollments: ${userEnrollments.size}, Categories: ${userCategories.size}`);
            }
            catch (error) {
                console.warn(`🔍 [${queryId}] Failed to get user enrollments:`, error);
            }
        }
        // Convert string values to appropriate types
        const limitNum = parseInt(limit) || 10;
        const offsetNum = parseInt(offset) || 0;
        // Build query
        let query = firestore.collection('courses');
        console.log(`🔍 [${queryId}] Starting with base query`);
        // Apply filters
        if (categoryId) {
            query = query.where('categoryId', '==', categoryId);
            console.log(`🔍 [${queryId}] Added categoryId filter:`, categoryId);
        }
        if (status) {
            query = query.where('status', '==', status);
            console.log(`🔍 [${queryId}] Added status filter:`, status);
        }
        if (universityId) {
            query = query.where('universityId', '==', universityId);
            console.log(`🔍 [${queryId}] Added universityId filter:`, universityId);
        }
        if (isPlus !== undefined && isPlus !== null) {
            query = query.where('isPlus', '==', isPlus === 'true');
            console.log(`🔍 [${queryId}] Added isPlus filter:`, isPlus);
        }
        if (difficulty) {
            query = query.where('difficulty', '==', difficulty);
            console.log(`🔍 [${queryId}] Added difficulty filter:`, difficulty);
        }
        if (language) {
            query = query.where('language', '==', language);
            console.log(`🔍 [${queryId}] Added language filter:`, language);
        }
        if (certificateEnabled !== undefined && certificateEnabled !== null) {
            query = query.where('certificateEnabled', '==', certificateEnabled === 'true');
            console.log(`🔍 [${queryId}] Added certificateEnabled filter:`, certificateEnabled);
        }
        // Field mapping for sorting
        const sortFieldMap = {
            'popular': 'enrollmentCount',
            'trending': 'enrollmentCount',
            'rating': 'averageRating',
            'new': 'createdAt',
            'createdAt': 'createdAt',
            'updatedAt': 'updatedAt'
        };
        const firestoreSortField = sortFieldMap[sort] || 'createdAt';
        console.log(`🔍 [${queryId}] Sort field mapping: ${sort} -> ${firestoreSortField}`);
        // Apply sorting
        query = query.orderBy(firestoreSortField, order);
        console.log(`🔍 [${queryId}] Added sorting:`, firestoreSortField, order);
        // Get total count for pagination
        const totalQuery = query;
        const totalSnapshot = await totalQuery.get();
        const total = totalSnapshot.size;
        console.log(`🔍 [${queryId}] Total courses found:`, total);
        // Apply pagination
        query = query.limit(limitNum).offset(offsetNum);
        console.log(`🔍 [${queryId}] Applied pagination:`, limitNum, offsetNum);
        // Execute query
        const snapshot = await query.get();
        console.log(`🔍 [${queryId}] Query executed, docs found:`, snapshot.docs.length);
        const courses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log(`🔍 [${queryId}] Raw courses before enrichment:`, courses.length);
        // Apply search filter if provided
        let filteredCourses = courses;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredCourses = courses.filter((course) => course.title?.toLowerCase().includes(searchLower) ||
                course.description?.toLowerCase().includes(searchLower));
            console.log(`🔍 [${queryId}] After search filter:`, filteredCourses.length);
        }
        // Apply enrollment exclusion filter
        if (excludeEnrolled && userEnrollments.size > 0) {
            filteredCourses = filteredCourses.filter((course) => !userEnrollments.has(course.id));
            console.log(`🔍 [${queryId}] After enrollment exclusion:`, filteredCourses.length);
        }
        // Enrich courses with instructor, category, and enrollment data
        const enrichedCourses = await Promise.all(filteredCourses.map(async (course) => {
            const enrichedCourse = await enrichCourse(course);
            // Add enrollment status for authenticated users
            let isEnrolled = false;
            if (userId) {
                isEnrolled = userEnrollments.has(course.id);
            }
            // Add catalog metadata
            const catalogMetadata = {
                isEnrolled,
                isTrending: (course.enrollmentCount || 0) > 50 && course.averageRating > 4.0,
                isRecommended: includeRecommendations && userCategories.has(course.categoryId),
                enrollmentCount: course.enrollmentCount || 0,
                averageRating: course.averageRating || 0,
                reviewCount: course.reviewCount || 0,
                popularityScore: Math.round(((course.enrollmentCount || 0) * 0.7) + ((course.averageRating || 0) * 0.3 * 20)),
            };
            return {
                ...enrichedCourse,
                ...catalogMetadata
            };
        }));
        console.log(`🔍 [${queryId}] After enrichment:`, enrichedCourses.length);
        // Add recommendation scoring if requested
        if (includeRecommendations && userCategories.size > 0) {
            enrichedCourses.forEach(course => {
                if (userCategories.has(course.category?.id)) {
                    course.recommendationScore = course.popularityScore + 20;
                }
                else {
                    course.recommendationScore = course.popularityScore;
                }
            });
            // Sort by recommendation score
            if (includeRecommendations) {
                enrichedCourses.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
            }
        }
        const result = {
            success: true,
            courses: enrichedCourses,
            total,
            meta: {
                userEnrollmentCount: userEnrollments.size,
                userCategories: Array.from(userCategories),
                hasRecommendations: includeRecommendations && userCategories.size > 0,
                queryId
            }
        };
        console.log(`🔍 [${queryId}] Returning result:`, {
            courseCount: result.courses.length,
            total: result.total,
            meta: result.meta
        });
        return result;
    }
    catch (error) {
        console.error('❌ getCoursesWithFilters error:', error);
        return {
            success: false,
            error: error.message || 'Ismeretlen hiba történt',
            courses: [],
            total: 0
        };
    }
});
//# sourceMappingURL=courseCatalog.js.map