'use client'

import { CourseCardProps, EnrolledCourse, CourseState } from '@/types'
import { UniversalCourseCard } from '@/components/ui/UniversalCourseCard'

/**
 * Dashboard Course Card Component
 * Uses Universal Course Card with dashboard context for enrolled courses
 */

export function CourseCard({ 
  course, 
  onContinue, 
  onStart, 
  onViewCertificate, 
  onRate,
  className = "" 
}: CourseCardProps) {

  // Handle course actions based on state
  const handleCourseAction = (action: string, courseData: any) => {
    switch (action) {
      case 'continue':
        onContinue?.(course.courseId)
        break
      case 'start':
        onStart?.(course.courseId)
        break
      case 'details':
        window.location.href = `/courses/${course.slug || course.courseId}`
        break
      case 'certificate':
        if (course.certificateUrl) {
          onViewCertificate?.(course.certificateUrl)
        }
        break
      case 'rate':
        onRate?.(course.courseId)
        break
      default:
        console.log(`Unhandled dashboard action: ${action}`)
    }
  }

  // Transform enrolled course data to Universal format
  const instructorParts = course.instructorName ? course.instructorName.split(' ') : ['Ismeretlen', 'Oktató'];
  const universalCourse = {
    id: course.courseId,
    title: course.title,
    slug: course.slug || course.courseId, // Use actual slug or courseId as fallback
    thumbnailUrl: course.thumbnailUrl,
    description: course.description,
    instructor: {
      firstName: instructorParts[0] || 'Ismeretlen',
      lastName: instructorParts[1] || 'Oktató',
      title: 'Oktató'
    },
    rating: course.averageRating,
    ratingCount: course.reviewCount,
    enrollmentCount: undefined, // Not relevant for enrolled courses
    duration: course.estimatedHours,
    difficulty: course.difficulty === 'BEGINNER' ? 'Kezdő' :
                course.difficulty === 'INTERMEDIATE' ? 'Középhaladó' :
                course.difficulty === 'ADVANCED' ? 'Haladó' : 'Szakértő',
    category: course.category,
    price: undefined, // Already enrolled
    isFeatured: false,
    hasVideo: true,
    certificateType: course.certificateUrl ? 'Tanúsítvány' : undefined,
    progress: course.completionPercentage,
    isEnrolled: true,
    isBookmarked: false,
    createdAt: course.enrollmentDate,
    updatedAt: course.lastAccessedAt
  }

  // Determine actions and elements based on course state
  const getStateConfig = () => {
    switch (course.courseState) {
      case CourseState.NOT_STARTED:
        return {
          actions: ['start', 'details'] as const,
          showElements: ['rating', 'duration', 'difficulty'] as const,
          variant: 'default' as const
        }
      
      case CourseState.ACTIVE_PROGRESS:
        return {
          actions: ['continue', 'details'] as const,
          showElements: ['progress', 'duration', 'rating'] as const,
          variant: 'default' as const
        }
      
      case CourseState.STALE_PROGRESS:
        return {
          actions: ['continue', 'details'] as const,
          showElements: ['progress', 'duration', 'rating'] as const,
          variant: 'default' as const
        }
      
      case CourseState.COMPLETED:
        return {
          actions: course.certificateUrl 
            ? ['certificate', 'rate', 'details'] as const
            : ['rate', 'details'] as const,
          showElements: ['rating', 'duration', 'progress'] as const,
          variant: 'default' as const
        }
      
      default:
        return {
          actions: ['start', 'details'] as const,
          showElements: ['rating', 'duration'] as const,
          variant: 'default' as const
        }
    }
  }

  const stateConfig = getStateConfig()

  return (
    <UniversalCourseCard
      course={universalCourse}
      variant={stateConfig.variant}
      context="dashboard"
      actions={stateConfig.actions}
      showElements={stateConfig.showElements}
      onAction={handleCourseAction}
      className={className}
    />
  )
}