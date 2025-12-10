'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Play, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: string;
  lessons?: number;
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST';
  instructorName?: string;
}

interface CourseHoverPopupProps {
  course: Course;
  isVisible: boolean;
  position: 'left' | 'center' | 'right';
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const getCourseTypeLabel = (courseType?: string) => {
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
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'WEBINAR':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' };
    case 'MASTERCLASS':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'PODCAST':
      return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    default:
      return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' };
  }
};

const getCtaText = (courseType?: string) => {
  switch (courseType) {
    case 'WEBINAR': return 'Webinár indítása';
    case 'ACADEMIA': return 'Akadémia indítása';
    case 'MASTERCLASS': return 'Masterclass indítása';
    case 'PODCAST': return 'Podcast indítása';
    default: return 'Tartalom indítása';
  }
};

export function CourseHoverPopup({
  course,
  isVisible,
  position,
  onMouseEnter,
  onMouseLeave
}: CourseHoverPopupProps) {
  const router = useRouter();
  const typeColors = getCourseTypeColor(course.courseType);
  const typeLabel = getCourseTypeLabel(course.courseType);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/courses/${course.id}`);
  };

  // Position styling based on card position in carousel
  const getPositionStyle = () => {
    switch (position) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      default:
        return 'left-1/2 -translate-x-1/2';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`absolute ${getPositionStyle()} top-full mt-2 z-50 w-[340px] bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700`}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gray-800">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover"
                sizes="340px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
                <BookOpen className="w-12 h-12 text-gray-600" />
              </div>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
              <button
                onClick={handlePlay}
                className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Course Type Badge */}
            {typeLabel && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors.bg} ${typeColors.text} ${typeColors.border} border`}>
                  {typeLabel}
                </span>
              </div>
            )}

            {/* Title */}
            <h3 className="text-lg font-bold text-white line-clamp-2">
              {course.title}
            </h3>

            {/* Description */}
            {course.description && (
              <p className="text-sm text-gray-400 line-clamp-2">
                {course.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {course.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
              )}
              {course.lessons && course.lessons > 0 && (
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{course.lessons} lecke</span>
                </div>
              )}
            </div>

            {/* Instructor */}
            {course.instructorName && (
              <p className="text-sm text-gray-500">
                {course.instructorName}
              </p>
            )}

            {/* CTA Button */}
            <Button
              onClick={handlePlay}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold"
            >
              <Play className="w-4 h-4 mr-2" fill="currentColor" />
              {getCtaText(course.courseType)}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
