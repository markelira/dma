'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { BookOpen, Bookmark, BookmarkCheck, Play, CheckCircle, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEnrollInCourse } from "@/hooks/useCourseQueries";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { calculateCourseDuration, formatDurationHungarian } from "@/lib/carouselUtils";
import { CoursePreviewModal } from "@/components/course-preview";
import { getCourseUrl, getCoursePlayerUrl } from '@/lib/routing';

// Move utility functions OUTSIDE component to prevent recreation on every render
const getCourseTypeLabel = (courseType?: string): string | null => {
  switch (courseType) {
    case 'ACADEMIA': return 'Akadémia';
    case 'WEBINAR': return 'Webinár';
    case 'MASTERCLASS': return 'Masterclass';
    case 'PODCAST': return 'Podcast';
    default: return null;
  }
};

const getCourseTypeColor = (courseType?: string) => {
  switch (courseType) {
    case 'ACADEMIA':
      return { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3B82F6' };
    case 'WEBINAR':
      return { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.3)', text: '#A855F7' };
    case 'MASTERCLASS':
      return { bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.3)', text: '#14B8A6' };
    case 'PODCAST':
      return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', text: '#22C55E' };
    default:
      return { bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.3)', text: '#6B7280' };
  }
};

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string; // Reference to instructor
  instructorIds?: string[]; // NEW: Multiple instructors
  instructorName?: string; // Legacy field
  category?: string; // Category name (optional, might be categoryId)
  categoryId?: string; // Category ID from Firestore
  categoryIds?: string[]; // NEW: Multiple categories
  level: string;
  duration: string;
  rating?: number;
  students?: number;
  enrollmentCount?: number;
  price?: number;
  thumbnailUrl?: string;
  lessons?: number;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  contentCreatedAt?: string; // Content creation date (YYYY-MM-DD)
  progress?: number; // 0-100, user's progress in the course
}

interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
}

interface Enrollment {
  courseId: string;
  courseName: string;
  courseInstructor?: string;
  progress: number;
  status: string;
  thumbnailUrl?: string;
  courseType?: string;
  duration?: string;
  currentLessonId?: string;
  firstLessonId?: string;
  userId?: string;
}

interface PremiumCourseCardProps {
  course: Course;
  index: number;
  categories?: Array<{ id: string; name: string }>;
  instructors?: Instructor[]; // Optional instructors array
  enrollments?: Enrollment[]; // Array of enrollments for checking enrollment status
  enrollment?: Enrollment; // Explicit enrollment data for this course
  showProgress?: boolean; // Force show progress bar
  userId?: string; // User ID for enrollment detection
  priority?: boolean; // LCP optimization - prioritize loading for above-fold images
  isSubscribed?: boolean; // Subscription status passed from parent (performance optimization)
}

// Wrap in React.memo with custom comparison for performance
export const PremiumCourseCard = React.memo(function PremiumCourseCard({
  course,
  index,
  categories,
  instructors,
  enrollments,
  enrollment,
  showProgress,
  userId,
  priority = false,
  isSubscribed = false
}: PremiumCourseCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const enrollMutation = useEnrollInCourse();
  const [imageError, setImageError] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Check if user is enrolled (NEW: Universal enrollment detection)
  const userEnrollment = useMemo(() => {
    // If explicit enrollment provided, use it
    if (enrollment) return enrollment;
    // Otherwise check enrollments array
    if (!enrollments || !userId) return null;
    return enrollments.find(e => e.courseId === course.id && e.userId === userId);
  }, [enrollment, enrollments, userId, course.id]);

  const isEnrolledUniversal = !!userEnrollment;
  // Fix: Use course.progress as fallback when enrollment data not available
  const enrollmentProgress = userEnrollment?.progress || course.progress || 0;
  const enrollmentStatusValue = userEnrollment?.status;

  // Get total duration - prefer course-level field, fallback to calculating from lessons
  const totalDuration = useMemo(() => {
    // First check for pre-computed course-level totalDuration (from migration)
    if ((course as any).totalDuration && (course as any).totalDuration > 0) {
      return (course as any).totalDuration;
    }

    // Fallback: Calculate from lessons array if available
    let allLessons: any[] = [];

    if (course.lessons && Array.isArray(course.lessons)) {
      allLessons = course.lessons;
    } else if (course.modules && Array.isArray(course.modules)) {
      allLessons = course.modules.flatMap(m => m.lessons || []);
    }

    if (allLessons.length === 0) return 0;

    // Map lessons to duration, prioritizing muxDuration over duration
    const lessonsWithDuration = allLessons.map(lesson => ({
      duration: lesson.muxDuration || lesson.duration || 0
    }));

    return calculateCourseDuration(lessonsWithDuration); // Returns seconds
  }, [(course as any).totalDuration, course.lessons, course.modules]);

  const durationText = totalDuration > 0 ? formatDurationHungarian(totalDuration) : null;

  // Course type detection for badge display
  const isSinglePartContent = course.courseType === 'WEBINAR' || course.courseType === 'PODCAST';
  const isMultiPartContent = course.courseType === 'ACADEMIA' || course.courseType === 'MASTERCLASS';

  // Get published lesson count - prefer course-level field, fallback to calculating from lessons
  const publishedLessonCount = useMemo(() => {
    // First check for pre-computed course-level publishedLessonCount (from migration)
    if ((course as any).publishedLessonCount && (course as any).publishedLessonCount > 0) {
      return (course as any).publishedLessonCount;
    }

    // Fallback: Calculate from lessons array if available
    let allLessons: any[] = [];

    if (course.lessons && Array.isArray(course.lessons)) {
      allLessons = course.lessons;
    } else if ((course as any).modules && Array.isArray((course as any).modules)) {
      allLessons = (course as any).modules.flatMap((m: any) => m.lessons || []);
    }

    if (allLessons.length === 0) return 0;

    // Filter for PUBLISHED lessons only (treat missing status as published for legacy data)
    return allLessons.filter(lesson =>
      lesson.status === 'PUBLISHED' || !lesson.status
    ).length;
  }, [(course as any).publishedLessonCount, course.lessons, (course as any).modules]);

  // Format duration for badge display (single-part content)
  const formatDurationBadge = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} perc`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} óra`;
    }
    return `${hours} óra ${remainingMinutes} perc`;
  };

  const durationBadgeText = totalDuration > 0 ? formatDurationBadge(totalDuration) : null;

  // Use enrollment data from props instead of per-card API calls
  const isEnrolled = isEnrolledUniversal || enrollments?.some(e => e.courseId === course.id) || false;
  const isEnrolling = enrollMutation.isPending;
  const isSubscriber = isSubscribed; // Use prop from parent instead of per-card hook
  const currentLessonId = userEnrollment?.currentLessonId || enrollment?.currentLessonId;
  const hasStarted = currentLessonId || (course.progress && course.progress > 0);

  // Handle card click - subscribers with started courses go to player
  const handleCardClick = () => {
    if (isSubscriber && hasStarted && currentLessonId) {
      router.push(getCoursePlayerUrl(course, currentLessonId));
    } else {
      router.push(getCourseUrl(course));
    }
  };

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation

    if (!user) {
      router.push('/bejelentkezes');
      return;
    }

    if (isEnrolled) return;

    try {
      await enrollMutation.mutateAsync(course.id);
      toast.success('Sikeresen elmentetted a saját listádra!');
    } catch (error) {
      toast.error('Hiba történt a beiratkozáskor');
    }
  };

  // Handle Play button click - go directly to player
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lessonId = currentLessonId || enrollment?.firstLessonId;
    if (lessonId) {
      router.push(getCoursePlayerUrl(course, lessonId));
    } else {
      // No lesson ID available, go to course detail page
      router.push(getCourseUrl(course));
    }
  };

  // Handle More Info / Preview button click
  const handleOpenPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreviewModal(true);
  };

  // Memoize category names to prevent recalculation on every render
  const categoryNames = useMemo(() => {
    // Check for multiple categories first (new system)
    if (course.categoryIds && course.categoryIds.length > 0 && categories && categories.length > 0) {
      const names = course.categoryIds
        .map(catId => categories.find(c => c.id === catId)?.name)
        .filter((name): name is string => !!name);
      if (names.length > 0) return names;
    }

    // Fallback to single category ID
    if (course.categoryId && categories && categories.length > 0) {
      const category = categories.find(cat => cat.id === course.categoryId);
      if (category?.name) return [category.name];
    }

    // Fallback to category object (embedded category with name)
    if (course.category && typeof course.category === 'object' && (course.category as any).name) {
      return [(course.category as any).name];
    }

    // Fallback to category string (legacy)
    if (course.category && typeof course.category === 'string') {
      return [course.category];
    }

    return [];
  }, [categories, course.categoryIds, course.categoryId, course.category]);

  // Use module-level utility functions (no recreation per render)
  const courseTypeColors = getCourseTypeColor(course.courseType);

  return (
    // Removed Framer Motion animation for performance - using CSS transitions only
    <div className="origin-center overflow-visible">
      <div className="overflow-visible">
        <div
          className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 h-full flex flex-col group cursor-pointer transition-all duration-300 overflow-hidden"
          onClick={handleCardClick}
        >
        {/* Course Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-t-xl">
          {course.thumbnailUrl && !imageError ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 280px, 320px"
              priority={priority}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(70, 108, 149, 0.1) 0%, rgba(70, 108, 149, 0.05) 100%)'
              }}
            >
              <BookOpen className="w-12 h-12 text-[#466C95] opacity-40" />
            </div>
          )}

          {/* Course Type + Duration/Part Count Badge - Top Left */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            {getCourseTypeLabel(course.courseType) && (
              <div className="px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                {getCourseTypeLabel(course.courseType)}
              </div>
            )}
            {/* Duration badge for WEBINAR/PODCAST (single-part content) */}
            {isSinglePartContent && durationBadgeText && (
              <div className="px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                {durationBadgeText}
              </div>
            )}
            {/* Part count badge for ACADEMIA/MASTERCLASS (multi-part content) */}
            {isMultiPartContent && publishedLessonCount > 0 && (
              <div className="px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                {publishedLessonCount} rész
              </div>
            )}
          </div>

          {/* Hover Action Bar - Netflix style */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-12 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {/* Play button - navigate to first lesson */}
            <button
              onClick={handlePlay}
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              title="Lejátszás"
              aria-label="Kurzus indítása"
            >
              <Play className="w-5 h-5 text-gray-900 ml-0.5 fill-gray-900" />
            </button>

            {/* More Info button - open preview modal */}
            <button
              onClick={handleOpenPreview}
              className="w-10 h-10 rounded-full border-2 border-white/70 hover:border-white bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all hover:scale-110"
              title="Részletek"
              aria-label="Részletek megtekintése"
            >
              <ChevronDown className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Enrollment Button */}
          {user && (
            <div className="absolute top-3 right-3">
              <button
                onClick={handleEnroll}
                disabled={isEnrolling || isEnrolled}
                className={`p-2 rounded-full transition-all duration-200
                  ${isEnrolled
                    ? 'bg-brand-secondary text-white shadow-lg'
                    : 'bg-white/90 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-brand-secondary hover:text-white shadow-md'
                  }
                  ${isEnrolling ? 'cursor-wait animate-pulse' : ''}
                `}
                title={isEnrolled ? 'Elmentve a listámra' : 'Mentés a saját listámra'}
              >
                {isEnrolled ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Progress Bar (NEW: Shows for enrolled users) */}
          {(isEnrolledUniversal || showProgress || (course.progress !== undefined && course.progress > 0)) && enrollmentProgress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
              <div
                className="h-full bg-brand-secondary transition-all"
                style={{ width: `${enrollmentProgress}%` }}
              />
            </div>
          )}

          {/* Completed Badge (NEW) */}
          {(isEnrolledUniversal || showProgress) && (enrollmentStatusValue === 'COMPLETED' || enrollmentProgress === 100) && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Befejezve
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 min-h-[100px]">
          {/* Title (NEW: Smaller text size) */}
          <h3 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-brand-secondary transition-colors">
            {course.title}
          </h3>

          {/* Progress Percentage - Shows for enrolled users (NEW: Universal enrollment support) */}
          {(isEnrolledUniversal || showProgress || (course.progress !== undefined && course.progress > 0)) && enrollmentProgress > 0 && (
            <div className="text-sm font-medium text-brand-secondary mb-2">
              {Math.round(enrollmentProgress)}% befejezve
            </div>
          )}

          {/* Category Badges - Left Aligned, max 2 with overflow indicator */}
          <div className="flex items-center gap-2 mt-auto">
            {categoryNames.slice(0, 2).map((catName, idx) => (
              <div key={idx} className="px-2.5 py-1 rounded-md text-xs font-normal bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary truncate max-w-[120px]">
                {catName}
              </div>
            ))}
            {categoryNames.length > 2 && (
              <div className="px-2 py-1 rounded-md text-xs font-normal bg-gray-100 text-gray-500">
                +{categoryNames.length - 2}
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Course Preview Modal */}
      <CoursePreviewModal
        courseId={course.id}
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        isEnrolled={isEnrolled}
        currentLessonId={currentLessonId}
        firstLessonId={enrollment?.firstLessonId}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if essential props changed
  return (
    prevProps.course.id === nextProps.course.id &&
    prevProps.course.progress === nextProps.course.progress &&
    prevProps.enrollment?.progress === nextProps.enrollment?.progress &&
    prevProps.isSubscribed === nextProps.isSubscribed &&
    prevProps.priority === nextProps.priority
  );
});
