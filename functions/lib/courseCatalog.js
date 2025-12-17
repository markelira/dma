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
 * Helper to chunk array into batches (Firestore 'in' query max is 30)
 */
const chunk = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};
/**
 * Batch fetch instructors and categories for multiple courses
 * Returns maps for O(1) lookup instead of N+1 queries
 */
const batchFetchEnrichmentData = async (courses) => {
    // Collect unique IDs
    const instructorIds = [...new Set(courses.map(c => c.instructorId).filter(Boolean))];
    const categoryIds = [...new Set(courses.map(c => c.categoryId).filter(Boolean))];
    console.log(`📦 Batch fetching: ${instructorIds.length} instructors, ${categoryIds.length} categories`);
    // Batch fetch instructors (max 30 per query due to Firestore 'in' limit)
    const instructorMap = new Map();
    if (instructorIds.length > 0) {
        const instructorBatches = chunk(instructorIds, 30);
        const instructorResults = await Promise.all(instructorBatches.map(batch => firestore.collection('instructors')
            .where(admin.firestore.FieldPath.documentId(), 'in', batch)
            .get()));
        instructorResults.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                instructorMap.set(doc.id, {
                    id: doc.id,
                    firstName: data?.firstName || 'Ismeretlen',
                    lastName: data?.lastName || 'Oktató',
                    profilePictureUrl: data?.profilePictureUrl || undefined,
                });
            });
        });
    }
    // Batch fetch categories
    const categoryMap = new Map();
    if (categoryIds.length > 0) {
        const categoryBatches = chunk(categoryIds, 30);
        const categoryResults = await Promise.all(categoryBatches.map(batch => firestore.collection('categories')
            .where(admin.firestore.FieldPath.documentId(), 'in', batch)
            .get()));
        categoryResults.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                categoryMap.set(doc.id, {
                    id: doc.id,
                    name: data?.name || 'Ismeretlen kategória',
                });
            });
        });
    }
    console.log(`📦 Fetched: ${instructorMap.size} instructors, ${categoryMap.size} categories`);
    return { instructorMap, categoryMap };
};
/**
 * Enrich course with pre-fetched instructor and category data (no DB calls)
 */
const enrichCourseWithMaps = (course, instructorMap, categoryMap) => {
    const instructor = course.instructorId ? instructorMap.get(course.instructorId) : null;
    const category = course.categoryId ? categoryMap.get(course.categoryId) : null;
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
    region: 'europe-west1',
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
        // Batch fetch instructor and category data (fixes N+1 query problem)
        const { instructorMap, categoryMap } = await batchFetchEnrichmentData(filteredCourses);
        // Enrich courses with pre-fetched data (no additional DB calls)
        const enrichedCourses = filteredCourses.map((course) => {
            const enrichedCourse = enrichCourseWithMaps(course, instructorMap, categoryMap);
            // Add enrollment status for authenticated users
            const isEnrolled = userId ? userEnrollments.has(course.id) : false;
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
        });
        console.log(`🔍 [${queryId}] After enrichment:`, enrichedCourses.length);
        // Add recommendation scoring if requested
        if (includeRecommendations && userCategories.size > 0) {
            enrichedCourses.forEach((course) => {
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