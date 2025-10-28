import { useQuery } from '@tanstack/react-query'
import { Category } from '@/types'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export const useCategories = () => {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      // Development mode: Use mock data instead of Cloud Functions
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: using mock categories data');
        
        const mockCategories: Category[] = [
          {
            id: 'cat-1',
            name: 'Programozás',
            description: 'Szoftverfejlesztés és programozási nyelvek',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'cat-2',
            name: 'Marketing',
            description: 'Digitális marketing és reklám',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'cat-3',
            name: 'Design',
            description: 'UX/UI és grafikai tervezés',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'cat-4',
            name: 'Adattudomány',
            description: 'Adatelemzés és gépi tanulás',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'cat-5',
            name: 'Vezetés',
            description: 'Projektmenedzsment és vezetési készségek',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'cat-6',
            name: 'IT Biztonság',
            description: 'Cybersecurity és információbiztonság',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        return mockCategories;
      }

      const getCategoriesFn = httpsCallable(functions, 'getCategories') as any;
      const result: any = await getCategoriesFn();
      return result.data.categories as Category[];
    },
  })
} 