'use client';

import { motion } from "motion/react";
import { BookOpen, Clock, Star, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cardStyles, buttonStyles } from "@/lib/design-tokens";

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId?: string; // Reference to instructor
  instructorName?: string; // Legacy field
  category?: string; // Category name (optional, might be categoryId)
  categoryId?: string; // Category ID from Firestore
  level: string;
  duration: string;
  rating?: number;
  students?: number;
  enrollmentCount?: number;
  price?: number;
  thumbnailUrl?: string;
  lessons?: number;
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

  // Get category display name
  // Courses store categoryId in Firestore, so we need to map it to the category name
  const getCategoryName = () => {
    // First check if category name is directly available
    if (course.category && typeof course.category === 'string') {
      return course.category;
    }
    // Otherwise, look up the category name from categoryId
    if (course.categoryId && categories) {
      const category = categories.find(cat => cat.id === course.categoryId);
      return category?.name || null;
    }
    return null;
  };

  // Get instructor name
  // Courses store instructorId in Firestore, so we need to map it to the instructor name
  const getInstructorName = () => {
    // First check if instructor name is directly available (legacy field)
    if (course.instructorName) {
      return course.instructorName;
    }
    // Otherwise, look up the instructor name from instructorId
    if (course.instructorId && instructors) {
      const instructor = instructors.find(inst => inst.id === course.instructorId);
      return instructor?.name || null;
    }
    return null;
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

  const levelColors = getLevelColor(course.level);

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
        className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg hover:shadow-xl overflow-hidden h-full flex flex-col group cursor-pointer transition-all duration-300"
        onClick={() => router.push(`/courses/${course.id}`)}
      >
        {/* Course Image */}
        <div className="relative aspect-video bg-gray-100 overflow-hidden">
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
              <BookOpen className="w-12 h-12 text-[#466C95]  opacity-40" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-5">
          {/* Category and Level Badges */}
          <div className="flex items-center justify-between mb-3">
            {getCategoryName() && (
              <div className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50/80 border border-blue-200/50 text-blue-600">
                {getCategoryName()}
              </div>
            )}
            {course.level && (
              <div
                className="px-2.5 py-1 rounded-md text-xs font-medium"
                style={{
                  background: levelColors.bg,
                  border: `1px solid ${levelColors.border}`,
                  color: levelColors.text
                }}
              >
                {course.level}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {course.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
            {course.description}
          </p>

          {/* Instructor */}
          {getInstructorName() && (
            <p className="text-xs text-gray-500 mb-3">
              Oktató: <span className="font-medium">{getInstructorName()}</span>
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100">
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
            className="btn w-full bg-gradient-to-t from-blue-600 to-blue-500 text-white shadow-sm hover:shadow-md transition-all !rounded-lg !py-2.5 text-sm flex items-center justify-center gap-2"
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
