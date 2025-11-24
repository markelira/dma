import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface InviteTeamMemberInput {
  teamId: string
  email: string
}

interface InviteTeamMemberResponse {
  success: boolean
  memberId?: string
  message?: string
  error?: string
}

interface RemoveTeamMemberInput {
  teamId: string
  memberId: string
}

interface RemoveTeamMemberResponse {
  success: boolean
  message?: string
  error?: string
}

interface ResendTeamInviteInput {
  teamId: string
  memberId: string
}

interface ResendTeamInviteResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Hook for inviting a new team member
 */
export function useInviteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation<InviteTeamMemberResponse, Error, InviteTeamMemberInput>({
    mutationFn: async ({ teamId, email }) => {
      const inviteTeamMember = httpsCallable<InviteTeamMemberInput, InviteTeamMemberResponse>(
        functions,
        'inviteTeamMember'
      )

      const result = await inviteTeamMember({ teamId, email })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült elküldeni a meghívót')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate team dashboard to refetch members
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
    },
  })
}

/**
 * Hook for removing a team member
 */
export function useRemoveTeamMember() {
  const queryClient = useQueryClient()

  return useMutation<RemoveTeamMemberResponse, Error, RemoveTeamMemberInput>({
    mutationFn: async ({ teamId, memberId }) => {
      const removeTeamMember = httpsCallable<RemoveTeamMemberInput, RemoveTeamMemberResponse>(
        functions,
        'removeTeamMember'
      )

      const result = await removeTeamMember({ teamId, memberId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült eltávolítani a tagot')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate team dashboard to refetch members
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
    },
  })
}

/**
 * Hook for resending a team invite
 */
export function useResendTeamInvite() {
  const queryClient = useQueryClient()

  return useMutation<ResendTeamInviteResponse, Error, ResendTeamInviteInput>({
    mutationFn: async ({ teamId, memberId }) => {
      const resendTeamInvite = httpsCallable<ResendTeamInviteInput, ResendTeamInviteResponse>(
        functions,
        'resendTeamInvite'
      )

      const result = await resendTeamInvite({ teamId, memberId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült újraküldeni a meghívót')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate team dashboard to refetch members
      queryClient.invalidateQueries({ queryKey: ['team-dashboard'] })
    },
  })
}

// ============================================
// Team Course Enrollment
// ============================================

interface EnrollTeamInCourseInput {
  teamId: string
  courseId: string
}

interface EnrollTeamInCourseResponse {
  success: boolean
  enrolledCount?: number
  alreadyEnrolledCount?: number
  message?: string
  error?: string
}

interface TeamEnrolledCourse {
  id: string
  title: string
  thumbnail?: string
  description?: string
  duration?: string
  lessonCount: number
  enrolledAt: string | null
  memberCount: number
}

interface GetTeamEnrolledCoursesResponse {
  success: boolean
  courses?: TeamEnrolledCourse[]
  error?: string
}

/**
 * Hook for enrolling all team members in a course
 */
export function useEnrollTeamInCourse() {
  const queryClient = useQueryClient()

  return useMutation<EnrollTeamInCourseResponse, Error, EnrollTeamInCourseInput>({
    mutationFn: async ({ teamId, courseId }) => {
      const enrollTeamInCourse = httpsCallable<EnrollTeamInCourseInput, EnrollTeamInCourseResponse>(
        functions,
        'enrollTeamInCourse'
      )

      const result = await enrollTeamInCourse({ teamId, courseId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült beiratkoztatni a csapatot')
      }

      return result.data
    },
    onSuccess: () => {
      // Invalidate team enrolled courses
      queryClient.invalidateQueries({ queryKey: ['team-enrolled-courses'] })
    },
  })
}

/**
 * Hook for fetching team's enrolled courses
 */
export function useTeamEnrolledCourses(teamId: string | undefined) {
  return useQuery<TeamEnrolledCourse[], Error>({
    queryKey: ['team-enrolled-courses', teamId],
    queryFn: async () => {
      if (!teamId) return []

      const getTeamEnrolledCourses = httpsCallable<{ teamId: string }, GetTeamEnrolledCoursesResponse>(
        functions,
        'getTeamEnrolledCourses'
      )

      const result = await getTeamEnrolledCourses({ teamId })

      if (!result.data.success) {
        throw new Error(result.data.error || 'Nem sikerült lekérni a tartalmakat')
      }

      return result.data.courses || []
    },
    enabled: !!teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}
