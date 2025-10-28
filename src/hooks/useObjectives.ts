import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export interface Objective {
  id: string
  title: string
  slug: string
}

export const useObjectives = () => {
  return useQuery<Objective[]>({
    queryKey: ['objectives'],
    queryFn: async () => {
      const getObjectives = httpsCallable(functions, 'getObjectives')
      const result = await getObjectives()
      return result.data.objectives
    },
  })
} 