import { useQuery } from '@tanstack/react-query';
import { Course, CourseType } from '@/types';

export const useCoursesByType = (courseType: CourseType, limit = 4) => {
  return useQuery({
    queryKey: ['courses-by-type', courseType, limit],
    queryFn: async () => {
      const { collection, getDocs, query, where, orderBy, limit: firestoreLimit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'PUBLISHED'),
        where('courseType', '==', courseType),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(coursesQuery);
      const courses: Course[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        courses.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        } as Course);
      }

      return courses;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
