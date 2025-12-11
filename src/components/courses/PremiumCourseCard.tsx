'use client';

import { useState } from 'react';
import { motion } from "motion/react";
import { BookOpen, Bookmark, BookmarkCheck, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cardStyles, buttonStyles } from "@/lib/design-tokens";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";
import { useEnrollInCourse } from "@/hooks/useCourseQueries";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { toast } from "sonner";

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

interface PremiumCourseCardProps {
  course: Course;
  index: number;
  categories?: Array<{ id: string; name: string }>;
  instructors?: Instructor[]; // Optional instructors array
}

export function PremiumCourseCard({ course, index, categories, instructors }: PremiumCourseCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: enrollmentStatus } = useEnrollmentStatus(course.id);
  const { data: subscription } = useSubscriptionStatus();
  const enrollMutation = useEnrollInCourse();
  const [imageError, setImageError] = useState(false);

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

    // Check for multiple categories first (new system)
    if (course.categoryIds && course.categoryIds.length > 0 && categories) {
      course.categoryIds.forEach(catId => {
        const cat = categories.find(c => c.id === catId);
        if (cat) names.push(cat.name);
      });
      if (names.length > 0) return names;
    }

    // Fallback to single category
    if (course.category && typeof course.category === 'string') {
      return [course.category];
    }

    if (course.categoryId && categories) {
      const category = categories.find(cat => cat.id === course.categoryId);
      if (category) return [category.name];
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
      whileHover={{ scale: 1.03, y: -4 }}
      className="origin-center"
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl h-full flex flex-col group cursor-pointer transition-all duration-300"
        onClick={handleCardClick}
      >
        {/* Course Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-t-xl">
          {course.thumbnailUrl && !imageError ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
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

          {/* Centered Play Icon */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Play className="w-16 h-16 text-white drop-shadow-lg" fill="white" fillOpacity={0.9} />
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

          {/* Progress Bar */}
          {course.progress !== undefined && course.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0">
              <div className="w-full bg-gray-800/80 h-1">
                <div
                  className="bg-brand-secondary h-1 transition-all duration-300"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-5">
          {/* Title */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-secondary transition-colors duration-200 mb-3">
            {course.title}
          </h3>

          {/* Course Type and Category Badges - Centered */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Course Type Badge */}
            {getCourseTypeLabel(course.courseType) && (
              <div
                className="px-2.5 py-1 rounded-md text-xs font-normal"
                style={{
                  background: courseTypeColors.bg,
                  border: `1px solid ${courseTypeColors.border}`,
                  color: courseTypeColors.text
                }}
              >
                {getCourseTypeLabel(course.courseType)}
              </div>
            )}
            {/* Category Badges */}
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
