import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export interface PublicCourse {
  id: string
  title: string
  slug?: string
  thumbnailUrl?: string | null
}

export interface PublicUniversity {
  id: string
  name: string
  logoUrl?: string | null
  description?: string | null
  website?: string | null
  phone?: string | null
  address?: string | null
  courseCount: number
  studentCount: number
  totalEnrollments: number
  courses: PublicCourse[]
}

export function usePublicUniversity(slug: string) {
  return useQuery<PublicUniversity, Error>({
    queryKey: ['public-university', slug],
    queryFn: async () => {
      const getPublicUniversity = httpsCallable(functions, 'getPublicUniversity')
      const result: any = await getPublicUniversity({ slug })
      return result.data as PublicUniversity
    },
    enabled: !!slug,
  })
} 