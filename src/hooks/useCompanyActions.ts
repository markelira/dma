import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

// ============================================
// Company Course Enrollment
// ============================================

interface EnrollCompanyInCourseInput {
  companyId: string
  courseId: string
}

interface EnrollCompanyInCourseResponse {
  success: boolean
  enrolledCount?: number
  alreadyEnrolledCount?: number
  message?: string
  error?: string
}

interface CompanyEnrolledCourse {
  id: string
  title: string
  thumbnail?: string
  description?: string
  duration?: string
  lessonCount: number
  enrolledAt: string | null
  employeeCount: number
}

interface GetCompanyEnrolledCoursesResponse {
  success: boolean
  courses?: CompanyEnrolledCourse[]
  error?: string
}

/**
 * Hook for enrolling all company employees in a course
 */
export function useEnrollCompanyInCourse() {
  const queryClient = useQueryClient()

  return useMutation<EnrollCompanyInCourseResponse, Error, EnrollCompanyInCourseInput>({
    mutationFn: async ({ companyId, courseId }) => {
      const enrollCompanyInCourse = httpsCallable<EnrollCompanyInCourseInput, EnrollCompanyInCourseResponse>(
        functions,
        'enrollCompanyInCourse'
      )

      const result = await enrollCompanyInCourse({ companyId, courseId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült beiratkoztatni a vállalatot')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate company enrolled courses
      queryClient.invalidateQueries({ queryKey: ['company-enrolled-courses'] })
    },
  })
}

/**
 * Hook for fetching company's enrolled courses
 */
export function useCompanyEnrolledCourses(companyId: string | undefined) {
  return useQuery<CompanyEnrolledCourse[], Error>({
    queryKey: ['company-enrolled-courses', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const getCompanyEnrolledCourses = httpsCallable<{ companyId: string }, GetCompanyEnrolledCoursesResponse>(
        functions,
        'getCompanyEnrolledCourses'
      )

      const result = await getCompanyEnrolledCourses({ companyId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült lekérni a kurzusokat')
      }

      return result.data.courses || []
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
