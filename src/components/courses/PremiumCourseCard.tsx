'use client';

import { motion } from "motion/react";
import { BookOpen, Clock, Star, Play, UserPlus, CheckCircle2, Bookmark, BookmarkCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cardStyles, buttonStyles } from "@/lib/design-tokens";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";
import { useEnrollInCourse } from "@/hooks/useCourseQueries";
import { useAuthStore } from "@/stores/authStore";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "sonner";

// Helper function to format date in Hungarian locale
const formatHungarianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
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
  const enrollMutation = useEnrollInCourse();
  const { isInWatchlist, toggleWatchlist, isToggling } = useWatchlist();

  const isEnrolled = enrollmentStatus?.isEnrolled ?? false;
  const isEnrolling = enrollMutation.isPending;
  const inWatchlist = isInWatchlist(course.id);

  const handleEnroll = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation

    if (!user) {
      router.push('/login');
      return;
    }

    if (isEnrolled) return;

    try {
      await enrollMutation.mutateAsync(course.id);
      toast.success('Sikeresen beiratkoztál a kurzusra!');
    } catch (error) {
      toast.error('Hiba történt a beiratkozáskor');
    }
  };

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation

    if (!user) {
      router.push('/login');
      return;
    }

    toggleWatchlist(course.id);
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

  // Get instructor names (supports multiple instructors)
  // Courses store instructorId/instructorIds in Firestore, so we need to map to instructor names
  const getInstructorNames = () => {
    const names: string[] = [];

    // Check for multiple instructors first (new system)
    if (course.instructorIds && course.instructorIds.length > 0 && instructors) {
      course.instructorIds.forEach(instId => {
        const inst = instructors.find(i => i.id === instId);
        if (inst) names.push(inst.name);
      });
      if (names.length > 0) return names;
    }

    // Fallback to single instructor
    if (course.instructorName) {
      return [course.instructorName];
    }

    if (course.instructorId && instructors) {
      const instructor = instructors.find(inst => inst.id === course.instructorId);
      if (instructor) return [instructor.name];
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

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
      case 'kezdő':
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#10B981'
        };
      case 'intermediate':
      case 'középhaladó':
        return {
          bg: 'rgba(251, 191, 36, 0.1)',
          border: 'rgba(251, 191, 36, 0.3)',
          text: '#F59E0B'
        };
      case 'advanced':
      case 'haladó':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#EF4444'
        };
      default:
        return {
          bg: 'rgba(107, 114, 128, 0.1)',
          border: 'rgba(107, 114, 128, 0.3)',
          text: '#6B7280'
        };
    }
  };

  // Level badge removed - levelColors no longer needed
  // const levelColors = getLevelColor(course.level);
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
      whileHover={{ y: -4 }}
    >
      <div
        className="bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl overflow-hidden h-full flex flex-col group cursor-pointer transition-all duration-300"
        onClick={() => router.push(`/courses/${course.id}`)}
      >
        {/* Course Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden rounded-t-xl">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

          {/* Action Buttons */}
          {user && (
            <div className="absolute top-3 right-3 flex gap-2">
              {/* Watchlist Button */}
              <button
                onClick={handleToggleWatchlist}
                disabled={isToggling}
                className={`p-2 rounded-full transition-all duration-200
                  ${inWatchlist
                    ? 'bg-brand-secondary text-white shadow-lg'
                    : 'bg-white/90 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-brand-secondary hover:text-white shadow-md'
                  }
                  ${isToggling ? 'cursor-wait animate-pulse' : ''}
                `}
                title={inWatchlist ? 'Eltávolítás a listámból' : 'Hozzáadás a listámhoz'}
              >
                {inWatchlist ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>

              {/* Enrollment Button */}
              <button
                onClick={handleEnroll}
                disabled={isEnrolling || isEnrolled}
                className={`p-2 rounded-full transition-all duration-200
                  ${isEnrolled
                    ? 'bg-green-500 text-white shadow-lg cursor-default'
                    : 'bg-white/90 text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-brand-secondary hover:text-white shadow-md'
                  }
                  ${isEnrolling ? 'cursor-wait animate-pulse' : ''}
                `}
                title={isEnrolled ? 'Beiratkozva' : 'Beiratkozás'}
              >
                {isEnrolled ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-5">
          {/* Course Type and Category Badges */}
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* Left: Course Type Badge */}
            <div className="flex items-center gap-2 flex-wrap">
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
            </div>
            {/* Right: Category Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {getCategoryNames().map((catName, idx) => (
                <div key={idx} className="px-2.5 py-1 rounded-md text-xs font-normal bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary">
                  {catName}
                </div>
              ))}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-brand-secondary transition-colors duration-200">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm font-normal text-gray-600 line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>

          {/* Mentor(s) - supports multiple */}
          {getInstructorNames().length > 0 && (
            <p className="text-xs font-normal text-gray-500 mb-3">
              {getInstructorNames().length > 1 ? 'Mentorok' : 'Mentor'}: <span className="font-medium">{getInstructorNames().join(', ')}</span>
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
            {course.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{course.duration}</span>
              </div>
            )}
            {(course.lessons ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{course.lessons} lecke</span>
              </div>
            )}
            {(course.rating ?? 0) > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            className="btn w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 text-white shadow-sm hover:shadow-md transition-all !rounded-lg !py-2.5 text-sm font-medium flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/courses/${course.id}`);
            }}
          >
            <Play className="w-4 h-4" />
            <span>Megtekintés</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
