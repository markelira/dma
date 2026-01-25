'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, BookOpen, Star, Play, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { PreviewVideoPlayer } from './PreviewVideoPlayer';
import { PreviewCurriculum } from './PreviewCurriculum';
import { PreviewInstructor } from './PreviewInstructor';
import { PreviewReviews } from './PreviewReviews';
import { useCoursePreview } from '@/hooks/useCoursePreview';
import { useEnrollInCourse } from '@/hooks/useCourseQueries';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { COURSE_TYPE_LABELS, CourseType } from '@/types';

interface CoursePreviewModalProps {
  /** Course ID to preview */
  courseId: string | null;
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** Whether user is enrolled in this course */
  isEnrolled?: boolean;
  /** Current lesson ID if enrolled */
  currentLessonId?: string;
  /** First lesson ID for starting course */
  firstLessonId?: string;
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '';

  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours > 0) {
    return remainingMins > 0 ? `${hours} óra ${remainingMins} perc` : `${hours} óra`;
  }
  return `${mins} perc`;
}

/**
 * Get "About" section title based on course type
 */
function getAboutTitle(courseType?: CourseType): string {
  switch (courseType) {
    case 'WEBINAR': return 'A webinárról';
    case 'ACADEMIA': return 'Az akadémiáról';
    case 'MASTERCLASS': return 'A masterclassról';
    case 'PODCAST': return 'A podcastról';
    default: return 'A kurzusról';
  }
}

/**
 * Get lessons section title based on course type
 */
function getLessonsTitle(courseType?: CourseType): string {
  switch (courseType) {
    case 'ACADEMIA':
    case 'MASTERCLASS':
      return 'Videók';
    default:
      return 'Tartalom';
  }
}

/**
 * Get course type label (nominative form)
 */
function getCourseTypeLabel(courseType?: CourseType): string {
  switch (courseType) {
    case 'WEBINAR': return 'webinár';
    case 'ACADEMIA': return 'akadémia';
    case 'MASTERCLASS': return 'masterclass';
    case 'PODCAST': return 'podcast';
    default: return 'kurzus';
  }
}

/**
 * Check if course type should show lessons list
 */
function shouldShowLessons(courseType?: CourseType): boolean {
  return courseType === 'ACADEMIA' || courseType === 'MASTERCLASS';
}

/**
 * CoursePreviewModal - Netflix-style course preview modal
 * Dark mode with brand colors
 */
export function CoursePreviewModal({
  courseId,
  open,
  onOpenChange,
  isEnrolled: isEnrolledProp = false,
  currentLessonId,
  firstLessonId,
}: CoursePreviewModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data, isLoading, error } = useCoursePreview(open ? courseId : null);
  const enrollMutation = useEnrollInCourse();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleStartCourse = () => {
    if (!data?.course) return;

    const lessonId = currentLessonId || firstLessonId || getFirstLessonId(data.course);
    if (lessonId) {
      router.push(`/courses/${data.course.id}/player/${lessonId}`);
      handleClose();
    } else {
      router.push(`/courses/${data.course.id}`);
      handleClose();
    }
  };

  const handleViewDetails = () => {
    if (!data?.course) return;
    router.push(`/courses/${data.course.id}`);
    handleClose();
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!data?.course) return;

    try {
      await enrollMutation.mutateAsync(data.course.id);
      toast.success('Sikeresen elmentetted a saját listádra!');
    } catch (error) {
      toast.error('Hiba történt a mentéskor');
    }
  };

  // Get first lesson ID from course data
  const getFirstLessonId = (course: any): string | null => {
    if (course.lessons?.length > 0) {
      const sorted = [...course.lessons]
        .filter((l: any) => l.status === 'PUBLISHED' || !l.status)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      return sorted[0]?.id || null;
    }
    if (course.modules?.length > 0) {
      const sortedModules = [...course.modules].sort((a: any, b: any) => a.order - b.order);
      for (const module of sortedModules) {
        if (module.lessons?.length > 0) {
          const sorted = [...module.lessons]
            .filter((l: any) => l.status === 'PUBLISHED' || !l.status)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          if (sorted[0]) return sorted[0].id;
        }
      }
    }
    return null;
  };

  const isEnrolled = isEnrolledProp || enrollMutation.isSuccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-[#0a0a0a] border-gray-800">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {data?.course?.title || `${getCourseTypeLabel(data?.course?.courseType).charAt(0).toUpperCase() + getCourseTypeLabel(data?.course?.courseType).slice(1)} előnézet`}
        </DialogTitle>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-secondary" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20 px-6">
            <p className="text-red-400 font-medium">Hiba történt a betöltéskor</p>
            <p className="text-gray-500 text-sm mt-1">Kérjük, próbáld újra később</p>
          </div>
        )}

        {/* Content */}
        {data && (
          <>
            {/* Video section */}
            <div className="relative">
              <PreviewVideoPlayer
                playbackId={data.previewVideo?.playbackId || ''}
                poster={data.course.thumbnailUrl || undefined}
                courseTitle={data.course.title}
                courseType={data.course.courseType}
                onStartCourse={handleStartCourse}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors z-10"
                aria-label="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content section */}
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                {/* Course type badge */}
                <div className="flex items-center gap-2 mb-2">
                  {data.course.courseType && (
                    <span className="px-2.5 py-1 rounded-full bg-brand-secondary/20 text-brand-secondary text-xs font-medium">
                      {COURSE_TYPE_LABELS[data.course.courseType] || data.course.courseType}
                    </span>
                  )}
                  {data.course.averageRating && data.course.averageRating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-gray-400">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {data.course.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-4">
                  {data.course.title}
                </h2>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleStartCourse}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-secondary hover:bg-brand-secondary-hover text-white font-bold rounded-xl transition-colors shadow-lg shadow-brand-secondary/20"
                  >
                    <Play className="w-5 h-5" />
                    {currentLessonId ? 'Folytatás' : 'Kezdés'}
                  </button>

                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolled || enrollMutation.isPending}
                    className={`flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors border ${
                      isEnrolled
                        ? 'bg-brand-secondary/20 border-brand-secondary/30 text-brand-secondary cursor-default'
                        : 'bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    {isEnrolled ? (
                      <>
                        <BookmarkCheck className="w-5 h-5" />
                        Elmentve
                      </>
                    ) : enrollMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Mentés...
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-5 h-5" />
                        Listához adás
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats row - only show duration and lessons */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 py-4 border-y border-gray-800">
                {data.stats.totalDuration > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(data.stats.totalDuration)}</span>
                  </div>
                )}
                {data.stats.totalLessons > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>{data.stats.totalLessons} videó</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {data.course.description && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {getAboutTitle(data.course.courseType)}
                  </h3>
                  <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                    {data.course.description}
                  </p>
                </section>
              )}

              {/* Lessons - only for ACADEMIA and MASTERCLASS */}
              {shouldShowLessons(data.course.courseType) && (data.course.lessons?.length > 0 || data.course.modules?.length > 0) && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {getLessonsTitle(data.course.courseType)}
                  </h3>
                  <PreviewCurriculum
                    lessons={data.course.lessons}
                    modules={data.course.modules}
                    maxLessonsInitial={5}
                    darkMode={true}
                  />
                </section>
              )}

              {/* Instructor */}
              {data.instructors.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {data.course.courseType === 'PODCAST' ? 'Szereplő' : 'Mentor'}
                  </h3>
                  <PreviewInstructor
                    instructors={data.instructors}
                    courseType={data.course.courseType}
                    darkMode={true}
                  />
                </section>
              )}

              {/* Reviews */}
              {(data.reviews.length > 0 || (data.course.averageRating && data.course.averageRating > 0)) && (
                <section>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Értékelések {data.course.reviewCount ? `(${data.course.reviewCount})` : ''}
                  </h3>
                  <PreviewReviews
                    reviews={data.reviews}
                    averageRating={data.course.averageRating}
                    reviewCount={data.course.reviewCount}
                    darkMode={true}
                  />
                </section>
              )}

              {/* View full details link */}
              <div className="pt-4 border-t border-gray-800 text-center">
                <button
                  onClick={handleViewDetails}
                  className="text-brand-secondary hover:text-brand-secondary-hover font-medium text-sm"
                >
                  Teljes {getCourseTypeLabel(data.course.courseType)} oldal megtekintése
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
