import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { toast } from 'sonner'

export interface SimpleCourse {
  id: string
  title: string
  slug: string
  status: string
}

export function useUniversityCourses(universityId: string) {
  return useQuery<SimpleCourse[]>({
    queryKey: ['universityCourses', universityId],
    queryFn: async () => {
      const getUniversityCourses = httpsCallable(functions, 'getUniversityCourses')
      const result: any = await getUniversityCourses({ universityId })
      return result.data.courses || []
    },
    enabled: !!universityId,
  })
}

export function useAddCoursesToUniversity(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseIds: string[]) => {
      const addCoursesToUniversity = httpsCallable(functions, 'addCoursesToUniversity')
      await addCoursesToUniversity({ universityId, courseIds })
    },
    onSuccess: () => {
      toast.success('Tartalmak hozzárendelve')
      qc.invalidateQueries({ queryKey: ['universityCourses', universityId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba a hozzárendeléskor')
    },
  })
}

export function useRemoveCourseFromUniversity(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (courseId: string) => {
      const removeCourseFromUniversity = httpsCallable(functions, 'removeCourseFromUniversity')
      await removeCourseFromUniversity({ universityId, courseId })
    },
    onSuccess: () => {
      toast.success('Tartalom eltávolítva')
      qc.invalidateQueries({ queryKey: ['universityCourses', universityId] })
    },
    onError: () => toast.error('Hiba a tartalom eltávolításakor'),
  })
} 