'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course, Instructor, Review, Lesson, Module } from '@/types';

export interface CoursePreviewData {
  course: Course;
  instructors: Instructor[];
  reviews: Review[];
  previewVideo: {
    playbackId: string;
    startTime: number;
  } | null;
  stats: {
    totalLessons: number;
    totalDuration: number; // in seconds
    moduleCount: number;
  };
}

/**
 * Get the first video lesson for preview
 * Follows the priority: first lesson with muxPlaybackId
 */
function getPreviewVideo(lessons: Lesson[]): { playbackId: string; startTime: number } | null {
  if (!lessons || lessons.length === 0) return null;

  const videoLessons = lessons
    .filter((l: Lesson) => (l.status === 'PUBLISHED' || !l.status) && l.muxPlaybackId)
    .sort((a: Lesson, b: Lesson) => (a.order || 0) - (b.order || 0));

  if (videoLessons.length > 0) {
    return { playbackId: videoLessons[0].muxPlaybackId!, startTime: 0 };
  }

  return null;
}

/**
 * Calculate course stats from lessons
 */
function calculateStats(lessons: Lesson[], moduleCount: number): CoursePreviewData['stats'] {
  const publishedLessons = lessons.filter((l: Lesson) => l.status === 'PUBLISHED' || !l.status);

  const totalDuration = publishedLessons.reduce((sum, lesson) => {
    return sum + (lesson.muxDuration || lesson.duration || 0);
  }, 0);

  return {
    totalLessons: publishedLessons.length,
    totalDuration,
    moduleCount: moduleCount || 1,
  };
}

/**
 * Fetch lessons from subcollection
 */
async function fetchLessonsFromSubcollection(courseId: string): Promise<Lesson[]> {
  try {
    const lessonsQuery = query(
      collection(db, 'courses', courseId, 'lessons'),
      orderBy('order', 'asc')
    );
    const lessonsSnapshot = await getDocs(lessonsQuery);
    return lessonsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Lesson[];
  } catch (error) {
    console.warn('Could not fetch lessons from subcollection:', error);
    return [];
  }
}

/**
 * Fetch modules from subcollection (for ACADEMIA courses)
 */
async function fetchModulesFromSubcollection(courseId: string): Promise<Module[]> {
  try {
    const modulesQuery = query(
      collection(db, 'courses', courseId, 'modules'),
      orderBy('order', 'asc')
    );
    const modulesSnapshot = await getDocs(modulesQuery);

    const modules: Module[] = [];
    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleData = moduleDoc.data();

      // Check if lessons are embedded in module or in subcollection
      let lessons: Lesson[] = moduleData.lessons || [];

      if (lessons.length === 0) {
        // Try fetching from subcollection
        const lessonsQuery = query(
          collection(db, 'courses', courseId, 'modules', moduleDoc.id, 'lessons'),
          orderBy('order', 'asc')
        );
        const lessonsSnapshot = await getDocs(lessonsQuery);
        lessons = lessonsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Lesson[];
      }

      modules.push({
        id: moduleDoc.id,
        ...moduleData,
        lessons
      } as Module);
    }

    return modules;
  } catch (error) {
    console.warn('Could not fetch modules from subcollection:', error);
    return [];
  }
}

/**
 * Fetch full course data for preview modal
 */
async function fetchCoursePreview(courseId: string): Promise<CoursePreviewData> {
  // Fetch course document
  const courseRef = doc(db, 'courses', courseId);
  const courseDoc = await getDoc(courseRef);

  if (!courseDoc.exists()) {
    throw new Error('Course not found');
  }

  const courseData = courseDoc.data();
  const course = { id: courseDoc.id, ...courseData } as Course;

  // Determine lessons - check embedded first, then subcollections
  let allLessons: Lesson[] = [];
  let moduleCount = 1;

  // 1. Check embedded lessons array (flat structure)
  if (course.lessons && course.lessons.length > 0) {
    allLessons = course.lessons;
    moduleCount = 1;
  }
  // 2. Check embedded modules array (legacy structure)
  else if (course.modules && course.modules.length > 0) {
    allLessons = course.modules.flatMap((m: Module) => m.lessons || []);
    moduleCount = course.modules.length;
  }
  // 3. Fetch from lessons subcollection (WEBINAR, PODCAST, MASTERCLASS)
  else {
    const subcollectionLessons = await fetchLessonsFromSubcollection(courseId);
    if (subcollectionLessons.length > 0) {
      allLessons = subcollectionLessons;
      // Update course object with fetched lessons for display
      course.lessons = subcollectionLessons;
    }
    // 4. Fetch from modules subcollection (ACADEMIA)
    else {
      const subcollectionModules = await fetchModulesFromSubcollection(courseId);
      if (subcollectionModules.length > 0) {
        allLessons = subcollectionModules.flatMap((m: Module) => m.lessons || []);
        moduleCount = subcollectionModules.length;
        // Update course object with fetched modules for display
        course.modules = subcollectionModules;
      }
    }
  }

  // Fetch instructors if instructorIds exist
  let instructors: Instructor[] = [];
  const instructorIds = course.instructorIds || (course.instructorId ? [course.instructorId] : []);

  if (instructorIds.length > 0) {
    const instructorPromises = instructorIds.map(async (id: string) => {
      const instructorDoc = await getDoc(doc(db, 'instructors', id));
      if (instructorDoc.exists()) {
        return { id: instructorDoc.id, ...instructorDoc.data() } as Instructor;
      }
      return null;
    });

    const results = await Promise.all(instructorPromises);
    instructors = results.filter((i): i is Instructor => i !== null);
  }

  // Fetch approved reviews (limited to 5 for preview)
  let reviews: Review[] = [];
  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('courseId', '==', courseId),
      where('approved', '==', true),
      orderBy('createdAt', 'desc')
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    reviews = reviewsSnapshot.docs.slice(0, 5).map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Review[];
  } catch (error) {
    // Reviews collection might not exist or have different structure
    // Try alternative query structure
    try {
      const reviewsQuery2 = query(
        collection(db, 'reviews'),
        where('course.id', '==', courseId),
        where('approved', '==', true)
      );
      const reviewsSnapshot2 = await getDocs(reviewsQuery2);
      reviews = reviewsSnapshot2.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];
    } catch {
      // Silently fail - reviews are optional
    }
  }

  // Get preview video info
  const previewVideo = getPreviewVideo(allLessons);

  // Calculate stats
  const stats = calculateStats(allLessons, moduleCount);

  return {
    course,
    instructors,
    reviews,
    previewVideo,
    stats,
  };
}

/**
 * Hook for fetching course preview data
 * Only fetches when courseId is provided (lazy loading)
 */
export function useCoursePreview(courseId: string | null) {
  return useQuery({
    queryKey: ['course-preview', courseId],
    queryFn: () => fetchCoursePreview(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}

/**
 * Prefetch course preview data (for hover intent)
 */
export function usePrefetchCoursePreview() {
  const queryClient = useQueryClient();

  return (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['course-preview', courseId],
      queryFn: () => fetchCoursePreview(courseId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
