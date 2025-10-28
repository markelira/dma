import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { University } from '@/types'

// Hook to fetch available universities for filtering
export const useUniversities = () => {
  return useQuery<University[], Error>({
    queryKey: ['universities'],
    queryFn: async () => {
      // Development mode: Use mock data instead of Cloud Functions
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: using mock universities data');
        
        const mockUniversities: University[] = [
          {
            id: 'uni-1',
            name: 'Budapest Műszaki Egyetem',
            slug: 'bme',
            description: 'Magyarország vezető műszaki egyeteme',
            logoUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'uni-2',
            name: 'Corvinus Egyetem',
            slug: 'corvinus',
            description: 'Gazdaság és menedzsment képzések',
            logoUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'uni-3',
            name: 'ELTE',
            slug: 'elte',
            description: 'Eötvös Loránd Tudományegyetem',
            logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        return mockUniversities;
      }

      const fn = httpsCallable(functions, 'getUniversities') as any;
      const res: any = await fn();
      return res.data.universities as University[]
    },
  })
}

export function useCreateUniversity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string; description?: string; revenueSharePct?: number }) => {
      const fn = httpsCallable(functions, 'createUniversity') as any;
      await fn(payload)
    },
    onSuccess: () => {
      toast.success('Egyetem létrehozva')
      qc.invalidateQueries({ queryKey: ['universities'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba az egyetem létrehozásakor')
    },
  })
}

export function useUpdateUniversity(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    // Return the updated university so we can update cache immediately
    mutationFn: async (payload: Record<string, any>) => {
      const fn = httpsCallable(functions, 'updateUniversity') as any;
      const res: any = await fn({ id: universityId, ...payload })
      return res.data.university as University
    },
    // Immediate cache update + refetch fallback
    onSuccess: (updated) => {
      toast.success('Egyetem frissítve')

      // Update universities list cache optimistically
      qc.setQueryData<University[]>(['universities'], (old) => {
        if (!old) return old
        return old.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      })

      // Invalidate related queries to ensure eventual consistency
      qc.invalidateQueries({ queryKey: ['universities'] })
      qc.invalidateQueries({ queryKey: ['universityStats', universityId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba a frissítéskor')
    },
  })
}

export function useUploadUniversityLogo(universityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      if (!file) throw new Error('Nincs kiválasztott fájl')

      // 1. kérünk signed URL-t
      const getSignedUrlFn = httpsCallable(functions, 'getSignedUploadUrl') as any
      const result: any = await getSignedUrlFn({ fileName: file.name, fileType: file.type })
      const { signedUrl, publicUrl } = result.data as { signedUrl: string; publicUrl: string }

      if (!signedUrl) throw new Error('Nem sikerült aláírt URL-t kapni')

      // 2. feltöltjük a fájlt
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Hiba a fájl feltöltésekor')

      // 3. frissítjük az egyetem dokumentumot a logoUrl-lel
      const updateFn = httpsCallable(functions, 'updateUniversity') as any
      await updateFn({ id: universityId, logoUrl: publicUrl })
    },
    onSuccess: () => {
      toast.success('Logó frissítve')
      qc.invalidateQueries({ queryKey: ['universities'] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Hiba a logó feltöltésekor')
    },
  })
} 