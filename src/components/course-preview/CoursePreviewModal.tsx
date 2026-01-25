'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, BookOpen, Award, Globe, Star, Play, Heart, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
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
import { COURSE_TYPE_LABELS } from '@/types';

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
 * Get difficulty label in Hungarian
 */
function getDifficultyLabel(difficulty?: string): string {
  switch (difficulty) {
    case 'BEGINNER': return 'Kezdő';
    case 'INTERMEDIATE': return 'Középhaladó';
    case 'ADVANCED': return 'Haladó';
    case 'EXPERT': return 'Szakértő';
    default: return '';
  }
}

/**
 * CoursePreviewModal - Netflix-style course preview modal
 * Shows video preview, course details, curriculum, instructor, and reviews
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
        .filter((l: any) => l.status === 'PUBLISHED')
        .sort((a: any, b: any) => a.order - b.order);
      return sorted[0]?.id || null;
    }
    if (course.modules?.length > 0) {
      const sortedModules = [...course.modules].sort((a: any, b: any) => a.order - b.order);
      for (const module of sortedModules) {
        if (module.lessons?.length > 0) {
          const sorted = [...module.lessons]
            .filter((l: any) => l.status === 'PUBLISHED')
            .sort((a: any, b: any) => a.order - b.order);
          if (sorted[0]) return sorted[0].id;
        }
      }
    }
    return null;
  };

  const isEnrolled = isEnrolledProp || enrollMutation.isSuccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-white">
        {/* Hidden title for accessibility */}
        <DialogTitle className="sr-only">
          {data?.course?.title || 'Kurzus előnézet'}
        </DialogTitle>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20 px-6">
            <p className="text-red-500 font-medium">Hiba történt a betöltéskor</p>
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
                onStartCourse={handleStartCourse}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors z-10"
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
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {COURSE_TYPE_LABELS[data.course.courseType] || data.course.courseType}
                    </span>
                  )}
                  {data.course.averageRating && data.course.averageRating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      {data.course.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {data.course.title}
                </h2>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleStartCourse}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                  >
                    <Play className="w-5 h-5" />
                    {currentLessonId ? 'Folytatás' : 'Kezdés'}
                  </button>

                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolled || enrollMutation.isPending}
                    className={`flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors border ${
                      isEnrolled
                        ? 'bg-green-50 border-green-200 text-green-700 cursor-default'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
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

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 py-4 border-y border-gray-100">
                {data.stats.totalDuration > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(data.stats.totalDuration)}</span>
                  </div>
                )}
                {data.stats.totalLessons > 0 && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>{data.stats.totalLessons} lecke</span>
                  </div>
                )}
                {data.course.difficulty && (
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    <span>{getDifficultyLabel(data.course.difficulty)}</span>
                  </div>
                )}
                {data.course.language && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    <span>{data.course.language}</span>
                  </div>
                )}
                {data.course.certificateEnabled && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <Award className="w-4 h-4" />
                    <span>Tanúsítvány</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {data.course.description && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">A kurzusról</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {data.course.description}
                  </p>
                </section>
              )}

              {/* Curriculum */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tematika</h3>
                <PreviewCurriculum
                  lessons={data.course.lessons}
                  modules={data.course.modules}
                  maxLessonsInitial={5}
                />
              </section>

              {/* Instructor */}
              {data.instructors.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {data.course.courseType === 'PODCAST' ? 'Szereplő' : 'Mentor'}
                  </h3>
                  <PreviewInstructor
                    instructors={data.instructors}
                    courseType={data.course.courseType}
                  />
                </section>
              )}

              {/* Reviews */}
              {(data.reviews.length > 0 || (data.course.averageRating && data.course.averageRating > 0)) && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Értékelések {data.course.reviewCount ? `(${data.course.reviewCount})` : ''}
                  </h3>
                  <PreviewReviews
                    reviews={data.reviews}
                    averageRating={data.course.averageRating}
                    reviewCount={data.course.reviewCount}
                  />
                </section>
              )}

              {/* View full details link */}
              <div className="pt-4 border-t border-gray-100 text-center">
                <button
                  onClick={handleViewDetails}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  Teljes kurzus oldal megtekintése
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
