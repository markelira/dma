import { useQuery } from '@tanstack/react-query'
import jobRoles from '@/data/jobRoles.json'

export interface JobRole {
  id: string;
  title: string;
}

export const useJobRoles = () => {
  return useQuery<JobRole[]>({
    queryKey: ['jobRoles'],
    queryFn: async () => {
      // Map JSON to minimal JobRole type
      return (jobRoles as any[]).map(r => ({ id: r.id, title: r.title }))
    },
  })
} 