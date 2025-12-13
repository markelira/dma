'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from "motion/react";
import { BookOpen, Bookmark, BookmarkCheck, Play, Clock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cardStyles, buttonStyles } from "@/lib/design-tokens";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";
import { useEnrollInCourse } from "@/hooks/useCourseQueries";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { toast } from "sonner";
import { calculateCourseDuration, formatDurationHungarian } from "@/lib/carouselUtils";

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
  enrollments?: Enrollment[]; // NEW: Array of enrollments for checking enrollment status
  enrollment?: Enrollment; // NEW: Explicit enrollment data for this course
  showProgress?: boolean; // NEW: Force show progress bar
  userId?: string; // NEW: User ID for enrollment detection
}

export function PremiumCourseCard({
  course,
  index,
  categories,
  instructors,
  enrollments,
  enrollment,
  showProgress,
  userId
}: PremiumCourseCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: enrollmentStatus } = useEnrollmentStatus(course.id);
  const { data: subscription } = useSubscriptionStatus();
  const enrollMutation = useEnrollInCourse();
  const [imageError, setImageError] = useState(false);

  // Check if user is enrolled (NEW: Universal enrollment detection)
  const userEnrollment = useMemo(() => {
    // If explicit enrollment provided, use it
    if (enrollment) return enrollment;
    // Otherwise check enrollments array
    if (!enrollments || !userId) return null;
    return enrollments.find(e => e.courseId === course.id && e.userId === userId);
  }, [enrollment, enrollments, userId, course.id]);

  const isEnrolledUniversal = !!userEnrollment;
  const enrollmentProgress = userEnrollment?.progress || 0;
  const enrollmentStatusValue = userEnrollment?.status;

  // Calculate total duration from lessons (NEW: Mux duration support)
  const totalDuration = useMemo(() => {
    let allLessons: any[] = [];

    // Check for flat lessons array first
    if (course.lessons && Array.isArray(course.lessons)) {
      allLessons = course.lessons;
    } else if (course.modules && Array.isArray(course.modules)) {
      // Fallback to modules structure
      allLessons = course.modules.flatMap(m => m.lessons || []);
    }

    // Map lessons to duration, prioritizing muxDuration over duration
    const lessonsWithDuration = allLessons.map(lesson => ({
      duration: lesson.muxDuration || lesson.duration || 0
    }));

    return calculateCourseDuration(lessonsWithDuration); // Returns seconds
  }, [course.lessons, course.modules]);

  const durationText = totalDuration > 0 ? formatDurationHungarian(totalDuration) : null;

  // Log when categories are undefined or empty (for debugging)
  useEffect(() => {
    if (!categories || categories.length === 0) {
      console.warn(`[PremiumCourseCard] No categories for course: ${course.title}`, {
        hasCategories: !!categories,
        categoriesLength: categories?.length,
        courseId: course.id,
        courseCategoryId: course.categoryId,
        courseCategoryIds: course.categoryIds
      });
    }
  }, [categories, course.title, course.id, course.categoryId, course.categoryIds]);

  const isEnrolled = enrollmentStatus?.isEnrolled ?? false;
  const isEnrolling = enrollMutation.isPending;
  const isSubscriber = subscription?.isActive ?? false;
  const currentLessonId = (enrollmentStatus as any)?.currentLessonId;
  const hasStarted = currentLessonId || (course.progress && course.progress > 0);

  // Handle card click - subscribers with started courses go to player
  const handleCardClick = () => {
    if (isSubscriber && hasStarted && currentLessonId) {
      router.push(`/courses/${course.id}/player/${currentLessonId}`);
    } else {
      router.push(`/courses/${course.id}`);
    }
  };

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation

    if (!user) {
      router.push('/login');
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

  // Get category display names (supports multiple categories)
  // Courses store categoryId/categoryIds in Firestore, so we need to map to category names
  const getCategoryNames = () => {
    const names: string[] = [];

    // Early return if no categories array provided
    if (!categories || categories.length === 0) {
      return [];
    }

    // Check for multiple categories first (new system)
    if (course.categoryIds && course.categoryIds.length > 0) {
      course.categoryIds.forEach(catId => {
        const cat = categories.find(c => c.id === catId);
        if (cat && cat.name) {
          names.push(cat.name);
        }
      });
      if (names.length > 0) return names;
    }

    // Fallback to single category ID
    if (course.categoryId) {
      const category = categories.find(cat => cat.id === course.categoryId);
      if (category && category.name) {
        return [category.name];
      }
    }

    // Fallback to category string (legacy)
    if (course.category && typeof course.category === 'string') {
      return [course.category];
    }

    return [];
  };

  const getCourseTypeLabel = (courseType?: string) => {
    switch (courseType) {
      case 'ACADEMIA':
        return 'Akadémia';
      case 'WEBINAR':
        return 'Webinár';
      case 'MASTERCLASS':
        return 'Masterclass';
      case 'PODCAST':
        return 'Podcast';
      default:
        return null;
    }
  };

  const getCourseTypeColor = (courseType?: string) => {
    switch (courseType) {
      case 'ACADEMIA':
        return {
          bg: 'rgba(59, 130, 246, 0.1)', // blue-500
          border: 'rgba(59, 130, 246, 0.3)',
          text: '#3B82F6'
        };
      case 'WEBINAR':
        return {
          bg: 'rgba(168, 85, 247, 0.1)', // purple-500
          border: 'rgba(168, 85, 247, 0.3)',
          text: '#A855F7'
        };
      case 'MASTERCLASS':
        return {
          bg: 'rgba(20, 184, 166, 0.1)', // teal-500
          border: 'rgba(20, 184, 166, 0.3)',
          text: '#14B8A6'
        };
      case 'PODCAST':
        return {
          bg: 'rgba(34, 197, 94, 0.1)', // green-500
          border: 'rgba(34, 197, 94, 0.3)',
          text: '#22C55E'
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.1)',
          border: 'rgba(107, 114, 128, 0.3)',
          text: '#6B7280'
        };
    }
  };

  const courseTypeColors = getCourseTypeColor(course.courseType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05, // Stagger effect
        ease: [0.16, 1, 0.3, 1]
      }}
      className="origin-center"
    >
      <div
        className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 h-full flex flex-col group cursor-pointer transition-all duration-300"
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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

          {/* Course Type + Duration Badge - Top Left */}
          <div className="absolute top-2 left-2 flex items-center gap-2">
            {getCourseTypeLabel(course.courseType) && (
              <div className="px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                {getCourseTypeLabel(course.courseType)}
              </div>
            )}
            {durationText && (
              <div className="px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {durationText}
              </div>
            )}
          </div>

          {/* Dark Overlay + Play Button (NEW: Improved hover animation) */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100 duration-300">
              <Play className="w-7 h-7 text-gray-900 ml-1 fill-current" />
            </div>
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
        <div className="flex-1 flex flex-col p-4">
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

          {/* Category Badges - Left Aligned */}
          <div className="flex items-center gap-2 flex-wrap">
            {getCategoryNames().map((catName, idx) => (
              <div key={idx} className="px-2.5 py-1 rounded-md text-xs font-normal bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary">
                {catName}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
