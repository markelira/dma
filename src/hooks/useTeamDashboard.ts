import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export interface TeamMember {
  id: string
  teamId: string
  userId?: string
  email: string
  name?: string
  status: 'invited' | 'active' | 'removed'
  inviteToken?: string
  inviteExpiresAt?: string
  invitedAt: string
  invitedBy: string
  joinedAt?: string
  removedAt?: string
  hasSubscriptionAccess: boolean
}

export interface Team {
  id: string
  name: string
  ownerId: string
  ownerEmail: string
  ownerName: string
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  subscriptionPlan: 'monthly' | '6-month' | '12-month'
  memberCount: number
  createdAt: string
  updatedAt: string
}

export interface TeamDashboardData {
  team: Team
  members: TeamMember[]
  owner: {
    id: string
    name: string
    email: string
  }
  stats: {
    totalMembers: number
    activeMembers: number
    invitedMembers: number
  }
  subscription: {
    status: string
    plan: string
    startDate: string
    endDate: string
    isActive: boolean
  }
}

interface GetTeamDashboardResponse {
  success: boolean
  data?: TeamDashboardData
  error?: string
}

/**
 * Hook to fetch team dashboard data
 * Only works for users who are part of a team
 */
export function useTeamDashboard() {
  const { user, loading: authLoading } = useAuth()

  return useQuery<TeamDashboardData | null, Error>({
    queryKey: ['team-dashboard', (user as any)?.teamId],
    queryFn: async () => {
      const getTeamDashboard = httpsCallable<void, GetTeamDashboardResponse>(
        functions,
        'getTeamDashboard'
      )

      const result = await getTeamDashboard()

      if (!result.data.success) {
        throw new Error(result.data.error || 'Failed to fetch team dashboard')
      }

      return result.data.data || null
    },
    enabled: !authLoading && !!(user as any)?.teamId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to check if current user is the team owner
 */
export function useIsTeamOwner(): boolean {
  const { user } = useAuth()
  return (user as any)?.isTeamOwner === true
}
