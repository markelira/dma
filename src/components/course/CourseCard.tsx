"use client"
import React, { useMemo } from 'react'
import { Course } from '@/types'
import { UniversalCourseCard } from '@/components/ui/UniversalCourseCard'
import { useAuthStore } from '@/stores/authStore'
import { useEnrollInCourse } from '@/hooks/useCourseQueries'
import { useEnrollmentStatus } from '@/hooks/useEnrollmentStatus'
import { useInstructors } from '@/hooks/useInstructorQueries'
import { toast } from 'sonner'

interface Props {
  course: Course
  trialMode?: boolean
  showPreview?: boolean
  variant?: 'default' | 'compact' | 'featured' | 'list' | 'minimal'
  context?: 'dashboard' | 'university' | 'search' | 'recommendations' | 'home'
}

export const CourseCard: React.FC<Props> = ({
  course,
  trialMode,
  showPreview = true,
  variant = 'default',
  context = 'home'
}) => {
  const { isAuthenticated, authReady } = useAuthStore()
  const enrollmentMutation = useEnrollInCourse()
  const { data: enrollmentData } = useEnrollmentStatus(course.id)
  const { data: instructors = [] } = useInstructors()

  // Find instructor by ID from instructors collection
  const instructor = useMemo(() => {
    if (!course) return null

    // Try to find instructor by instructorId from instructors collection
    if (course.instructorId && instructors.length > 0) {
      const found = instructors.find(inst => inst.id === course.instructorId)
      if (found) return found
    }

    // Fallback to legacy instructor object if present
    if (course.instructor) {
      return {
        id: course.instructorId || 'legacy',
        name: `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim() || 'Ismeretlen Oktató',
        title: course.instructor.title || null,
        bio: course.instructor.bio || null,
        profilePictureUrl: course.instructor.profilePictureUrl || null,
        createdAt: '',
        updatedAt: ''
      }
    }

    return null
  }, [course, instructors])

  const handleCourseAction = async (action: string, courseData: any) => {
    switch (action) {
      case 'enroll':
      case 'buy':
        await handleEnroll()
        break
      case 'details':
        const urlPath = course.slug ? `/courses/${course.slug}` : `/courses/${course.id}`
        const href = trialMode ? `${urlPath}?trial=true` : urlPath
        window.location.href = href
        break
      case 'bookmark':
        toast.info('Könyvjelző funkció hamarosan elérhető')
        break
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: course.title,
            text: course.description,
            url: window.location.origin + `/courses/${course.slug || course.id}`
          })
        } else {
          toast.info('Megosztás funkció hamarosan elérhető')
        }
        break
      default:
        console.log(`Unhandled action: ${action}`)
    }
  }

  const handleEnroll = async () => {
    if (!authReady) {
      toast.error('Autentikáció inicializálódik, kérjük várjon...')
      return
    }
    
    if (!isAuthenticated) {
      toast.error('Bejelentkezés szükséges')
      // For MVP, we'll use a simple alert instead of navigation
      alert('Bejelentkezés szükséges a tartalomra való feliratkozáshoz')
      return
    }

    try {
      await enrollmentMutation.mutateAsync(course.id)
      toast.success('Sikeresen feliratkozott a tartalomra!')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Beiratkozás sikertelen'
      toast.error(errorMessage)
      console.error('Enrollment failed:', error)
    }
  }

  // Transform course data to Universal format
  const universalCourse = {
    id: course.id,
    title: course.title,
    slug: course.slug,
    thumbnail: course.thumbnailUrl,
    description: course.description,
    instructor: instructor ? {
      // Split name for legacy compatibility with UniversalCourseCard
      firstName: instructor.name.split(' ')[0] || 'Ismeretlen',
      lastName: instructor.name.split(' ').slice(1).join(' ') || 'Oktató',
      title: instructor.title || null,
      imageUrl: instructor.profilePictureUrl || null
    } : undefined,
    rating: 0, // Remove rating display
    ratingCount: 0, // Remove review count display
    enrollmentCount: 0, // Remove student count display
    duration: 8, // MVP: Default duration in hours
    difficulty: '', // Remove difficulty level display
    category: course.category?.name,
    price: 7990, // MVP: Use fixed price from config
    originalPrice: undefined,
    isFeatured: course.enrollmentCount ? course.enrollmentCount > 500 : false,
    hasVideo: true, // Most courses have video content
    certificateType: course.certificateEnabled ? 'Tanúsítvány' : undefined,
    completionRate: course.enrollmentCount ? Math.floor(Math.random() * 20) + 75 : undefined,
    isEnrolled: enrollmentData?.enrolled || false,
    isBookmarked: false, // Would need to check bookmark status
    createdAt: course.publishDate,
    updatedAt: course.updatedAt
  }

  // Determine actions based on enrollment status
  const actions: ("details" | "share" | "enroll" | "continue" | "bookmark")[] = enrollmentData?.enrolled 
    ? ['details', 'bookmark', 'share'] // Already enrolled - no enroll button
    : ['enroll', 'details', 'bookmark', 'share']; // Not enrolled - show enroll button

  return (
    <UniversalCourseCard
      course={universalCourse}
      variant={variant}
      context={context}
      actions={actions}
      showElements={['rating', 'price', 'instructor', 'students', 'category', 'difficulty']}
      onAction={handleCourseAction}
      priority={context === 'home'}
    />
  )
}