import { useMutation, useQueryClient } from '@tanstack/react-query'
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
