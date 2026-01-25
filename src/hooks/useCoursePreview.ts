'use client';

import { useQuery } from '@tanstack/react-query';
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
function getPreviewVideo(course: Course): { playbackId: string; startTime: number } | null {
  // Check flat lessons array first (preferred structure)
  if (course.lessons && course.lessons.length > 0) {
    const videoLessons = course.lessons
      .filter((l: Lesson) => l.status === 'PUBLISHED' && l.muxPlaybackId)
      .sort((a: Lesson, b: Lesson) => a.order - b.order);

    if (videoLessons.length > 0) {
      return { playbackId: videoLessons[0].muxPlaybackId!, startTime: 0 };
    }
  }

  // Fallback: check modules (legacy structure)
  if (course.modules && course.modules.length > 0) {
    const sortedModules = [...course.modules].sort((a: Module, b: Module) => a.order - b.order);
    for (const module of sortedModules) {
      if (module.lessons && module.lessons.length > 0) {
        const videoLesson = module.lessons
          .filter((l: Lesson) => l.status === 'PUBLISHED' && l.muxPlaybackId)
          .sort((a: Lesson, b: Lesson) => a.order - b.order)[0];

        if (videoLesson) {
          return { playbackId: videoLesson.muxPlaybackId!, startTime: 0 };
        }
      }
    }
  }

  return null;
}

/**
 * Calculate course stats from lessons
 */
function calculateStats(course: Course): CoursePreviewData['stats'] {
  let allLessons: Lesson[] = [];

  if (course.lessons && course.lessons.length > 0) {
    allLessons = course.lessons.filter((l: Lesson) => l.status === 'PUBLISHED');
  } else if (course.modules && course.modules.length > 0) {
    allLessons = course.modules.flatMap((m: Module) =>
      (m.lessons || []).filter((l: Lesson) => l.status === 'PUBLISHED')
    );
  }

  const totalDuration = allLessons.reduce((sum, lesson) => {
    return sum + (lesson.muxDuration || lesson.duration || 0);
  }, 0);

  return {
    totalLessons: allLessons.length,
    totalDuration,
    moduleCount: course.modules?.length || 1,
  };
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

  const course = { id: courseDoc.id, ...courseDoc.data() } as Course;

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
      where('course.id', '==', courseId),
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
    console.warn('Could not fetch reviews:', error);
  }

  // Get preview video info
  const previewVideo = getPreviewVideo(course);

  // Calculate stats
  const stats = calculateStats(course);

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
  const queryClient = require('@tanstack/react-query').useQueryClient();

  return (courseId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['course-preview', courseId],
      queryFn: () => fetchCoursePreview(courseId),
      staleTime: 5 * 60 * 1000,
    });
  };
}
