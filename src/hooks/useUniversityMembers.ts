import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { toast } from 'sonner'

export interface UniversityMember {
  userId: string
  universityId: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
  }
}

export function useUniversityMembers(universityId: string | undefined) {
  return useQuery<UniversityMember[], Error>({
    queryKey: ['universityMembers', universityId],
    queryFn: async () => {
      if (!universityId) return []
      const getUniversityMembers = httpsCallable(functions, 'getUniversityMembers')
      const result: any = await getUniversityMembers({ universityId })
      return result.data.members || []
    },
    enabled: !!universityId,
  })
}

export function useAddUniversityMember(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { userId: string; role: 'OWNER' | 'EDITOR' | 'VIEWER' }) => {
      const addUniversityMember = httpsCallable(functions, 'addUniversityMember')
      await addUniversityMember({ 
        universityId, 
        memberUserId: payload.userId, 
        role: payload.role 
      })
    },
    onSuccess: () => {
      toast.success('Tag hozzáadva')
      qc.invalidateQueries({ queryKey: ['universityMembers', universityId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba a tag hozzáadásakor')
    },
  })
}

export function useUpdateMemberRole(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'OWNER' | 'EDITOR' | 'VIEWER' }) => {
      const updateMemberRole = httpsCallable(functions, 'updateMemberRole')
      await updateMemberRole({ universityId, memberUserId: userId, role })
    },
    onSuccess: () => {
      toast.success('Szerepkör frissítve')
      qc.invalidateQueries({ queryKey: ['universityMembers', universityId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba a szerepkör frissítésekor')
    },
  })
}

export function useRemoveMember(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const removeUniversityMember = httpsCallable(functions, 'removeUniversityMember')
      await removeUniversityMember({ universityId, memberUserId: userId })
    },
    onSuccess: () => {
      toast.success('Tag eltávolítva')
      qc.invalidateQueries({ queryKey: ['universityMembers', universityId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba a tag eltávolításakor')
    },
  })
} 