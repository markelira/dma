import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

/**
 * useEnrollmentStatus hook
 * Checks if the current user is enrolled in a specific course
 */
export const useEnrollmentStatus = (courseId: string) => {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['enrollment', courseId, user?.uid],
    queryFn: async () => {
      if (!user || !isAuthenticated) {
        return { isEnrolled: false, enrollmentId: null };
      }

      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Check for enrollment document
      const enrollmentId = `${user.uid}_${courseId}`;
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      const enrollmentDoc = await getDoc(enrollmentRef);

      if (enrollmentDoc.exists()) {
        return {
          isEnrolled: true,
          enrollmentId: enrollmentDoc.id,
          ...enrollmentDoc.data()
        };
      }

      return { isEnrolled: false, enrollmentId: null };
    },
    enabled: !!courseId && isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
