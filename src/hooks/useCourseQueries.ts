import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Course } from '@/types';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { mockCourses } from '@/lib/mockCourses';

export const useCourses = () => {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      // Fetch real data from Firebase
      console.log('🔍 Fetching courses from Firebase');
      
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const coursesQuery = query(
        collection(db, 'courses'),
        where('status', '==', 'PUBLISHED')
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
      
      console.log(`✅ Fetched ${courses.length} courses from Firebase`);
      return courses;
    },
  });
};

export const useCourse = (identifier: string) => {
  return useQuery({
    queryKey: ['course', identifier],
    queryFn: async () => {
      console.log('🔍 [useCourse] Fetching course with identifier:', identifier);
      
      const { doc, getDoc, collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Try to find by ID first
      const courseRef = doc(db, 'courses', identifier);
      const courseDoc = await getDoc(courseRef);
      
      let courseData: any = null;
      
      if (courseDoc.exists()) {
        courseData = { id: courseDoc.id, ...courseDoc.data() };
      } else {
        // Try to find by slug
        const coursesQuery = query(
          collection(db, 'courses'),
          where('slug', '==', identifier)
        );
        const snapshot = await getDocs(coursesQuery);
        
        if (!snapshot.empty) {
          const firstDoc = snapshot.docs[0];
          courseData = { id: firstDoc.id, ...firstDoc.data() };
        }
      }
      
      if (!courseData) {
        throw new Error('Kurzus nem található');
      }
      
      // Fetch lessons - try multiple locations
      let lessons = [];

      // First try fetching all modules and their lessons (new structure)
      try {
        const modulesRef = collection(db, 'courses', courseData.id, 'modules');
        const modulesSnapshot = await getDocs(modulesRef);

        if (!modulesSnapshot.empty) {
          console.log(`Found ${modulesSnapshot.size} modules`);

          // Fetch lessons from each module
          for (const moduleDoc of modulesSnapshot.docs) {
            const moduleLessonsRef = collection(db, 'courses', courseData.id, 'modules', moduleDoc.id, 'lessons');
            const moduleLessonsSnapshot = await getDocs(moduleLessonsRef);

            if (!moduleLessonsSnapshot.empty) {
              const moduleLessons = moduleLessonsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                moduleId: moduleDoc.id // Ensure moduleId is set
              }));
              lessons.push(...moduleLessons);
              console.log(`Found ${moduleLessons.length} lessons in module ${moduleDoc.id}`);
            }
          }
        }
      } catch (error) {
        console.log('No lessons in modules subcollection:', error);
      }

      // If no lessons found, try direct lessons subcollection (old structure)
      if (lessons.length === 0) {
        try {
          const lessonsRef = collection(db, 'courses', courseData.id, 'lessons');
          const lessonsSnapshot = await getDocs(lessonsRef);

          lessons = lessonsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Found ${lessons.length} lessons in direct lessons subcollection`);
        } catch (error) {
          console.log('No lessons in direct subcollection');
        }
      }
      
      // Sort lessons by order
      lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      const course: Course = {
        ...courseData,
        lessons,
        createdAt: courseData.createdAt || new Date().toISOString(),
        updatedAt: courseData.updatedAt || new Date().toISOString(),
      };
      
      console.log('✅ Found course:', course.title);
      return course;
    },
    enabled: !!identifier,
  });
};

export const useUpdateLessonProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      lessonId,
      progress,
    }: {
      courseId: string;
      lessonId: string;
      progress: number;
    }) => {
      const markLessonAsCompleteFn = httpsCallable(functions, 'markLessonAsComplete');
      const result: any = await markLessonAsCompleteFn({
        courseId,
        lessonId,
        progress,
      });
      return result.data;
    },
    onSuccess: (_, { courseId }) => {
      // Invalidate and refetch course data
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
  });
};

export const useEnrollInCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { user, isAuthenticated, authReady } = useAuthStore.getState();
      
      // Check authentication
      if (!isAuthenticated || !user) {
        throw new Error('Bejelentkezés szükséges a kurzusra való feliratkozáshoz');
      }
      
      console.log('🔧 Creating enrollment for courseId:', courseId);
      console.log('🔧 User data:', { id: user.id, email: user.email });

      // Check subscription status
      const { functions } = await import('@/lib/firebase');
      const { httpsCallable } = await import('firebase/functions');

      let hasActiveSubscription = false;
      try {
        const getSubscriptionStatusFn = httpsCallable(functions, 'getSubscriptionStatus');
        const subResult: any = await getSubscriptionStatusFn({});

        console.log('🔧 Subscription status:', subResult.data);
        hasActiveSubscription = subResult.data?.hasActiveSubscription || false;

        // Log subscription status but don't block enrollment
        // Active subscription = universal access to all courses
        // No subscription = user might have individually purchased this course or it's free
        if (hasActiveSubscription) {
          console.log('✅ User has active subscription - auto-enrolling');
        } else {
          console.log('⚠️ No active subscription - checking course-specific access');
        }
      } catch (error: any) {
        // If subscription check fails, log it but continue
        // This ensures enrollment still works even if subscription service is down
        console.warn('⚠️ Failed to check subscription status, proceeding with enrollment:', error);
      }

      // Save to Firebase directly
      const { doc, setDoc, getDoc, addDoc, collection, Timestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Check if already enrolled
      const enrollmentId = `${user.id}_${courseId}`;
      const enrollmentRef = doc(db, 'enrollments', enrollmentId);
      console.log('🔧 Enrollment ID:', enrollmentId);
      const existingEnrollment = await getDoc(enrollmentRef);
      
      if (existingEnrollment.exists()) {
        return {
          success: true,
          message: 'Már beiratkozott erre a kurzusra',
          enrollmentId,
          courseId,
          userId: user.id,
          alreadyEnrolled: true
        };
      }
      
      // Create new enrollment
      const now = Timestamp.now();
      await setDoc(enrollmentRef, {
        userId: user.id,
        courseId,
        enrolledAt: now,
        lastAccessedAt: now,
        completedLessons: 0,
        progress: 0,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now
      });
      
      // Get course details for audit log
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
      const courseData = courseDoc.data();
      
      // Create audit log entry for enrollment
      try {
        await addDoc(collection(db, 'auditLogs'), {
          userId: user.id,
          userEmail: user.email || '',
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Student',
          action: 'ENROLL_COURSE',
          resource: 'Course',
          resourceId: courseId,
          details: JSON.stringify({
            courseTitle: courseData?.title || 'N/A',
            courseCategory: courseData?.category || 'N/A',
            coursePrice: courseData?.price || 0,
            enrollmentType: courseData?.price === 0 ? 'FREE' : 'PAID'
          }),
          severity: 'MEDIUM',
          ipAddress: 'N/A',
          userAgent: navigator.userAgent,
          createdAt: new Date()
        });
      } catch (logError) {
        console.error('Failed to create audit log for enrollment:', logError);
      }
      
      return {
        success: true,
        message: 'Sikeres beiratkozás!',
        enrollmentId,
        courseId,
        userId: user.id,
        alreadyEnrolled: false
      };
    },
    onSuccess: (data, courseId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['featuredCourses'] });
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
  });
};

// Hook for deleting a course
export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      console.log('🗑️ useDeleteCourse: Starting delete for course:', courseId);
      const deleteCourseFn = httpsCallable(functions, 'deleteCourse');
      const result: any = await deleteCourseFn({ courseId });

      console.log('📊 Delete function result:', result.data);

      if (!result.data.success) {
        throw new Error(result.data.error || 'Kurzus törlése sikertelen');
      }

      return result.data;
    },
    onSuccess: (data, courseId) => {
      console.log('✅ Delete mutation successful, invalidating queries...');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courseList'] });
    },
    onError: (error: any) => {
      console.error('❌ Delete mutation failed:', error);
    },
  });
};

// Options for useCourseList hook
export interface UseCourseListOptions {
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
  categoryId?: string;
  search?: string;
  status?: string;
  universityId?: string;
  isPlus?: boolean;
  difficulty?: string;
  language?: string;
  certificateEnabled?: boolean;
}

// Hook for fetching courses with sort and limit options
export const useCourseList = ({
  sort = 'createdAt',
  order = 'desc',
  limit = 10,
  offset = 0,
  categoryId,
  search,
  status,
  universityId,
  isPlus,
  difficulty,
  language,
  certificateEnabled,
}: UseCourseListOptions = {}) => {
  return useQuery({
    queryKey: ['courses', { sort, order, limit, offset, categoryId, search, status, universityId, isPlus, difficulty, language, certificateEnabled }],
    queryFn: async () => {
      console.log('🔍 useCourseList queryFn called with params:', {
        sort,
        order,
        limit,
        offset,
        categoryId,
        search,
        status,
        universityId,
        isPlus,
        difficulty,
        language,
        certificateEnabled,
      });
      
      // Fetch from Firebase
      console.log('🔍 Fetching courses from Firebase with filters');
      
      const { collection, getDocs, query: firestoreQuery, where, orderBy, limit: firestoreLimit } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Build query constraints - simpler approach to avoid composite index issues
      const constraints = [];
      
      // Always filter by published status if specified
      if (status) {
        constraints.push(where('status', '==', status));
      } else {
        constraints.push(where('status', '==', 'PUBLISHED'));
      }
      
      const coursesQuery = firestoreQuery(
        collection(db, 'courses'),
        ...constraints
      );
      
      const snapshot = await getDocs(coursesQuery);
      let courses: Course[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        courses.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        } as Course);
      }
      
      // Apply all filters in memory to avoid composite index requirements
      
      // Filter by category
      if (categoryId) {
        courses = courses.filter(course => 
          course.categoryId === categoryId || 
          course.category?.id === categoryId
        );
      }
      
      // Filter by university
      if (universityId) {
        courses = courses.filter(course => course.universityId === universityId);
      }
      
      // Filter by difficulty
      if (difficulty) {
        courses = courses.filter(course => course.level === difficulty);
      }
      
      // Filter by language
      if (language) {
        courses = courses.filter(course => course.language === language);
      }
      
      // Filter by certificate
      if (certificateEnabled !== undefined) {
        courses = courses.filter(course => course.certificateEnabled === certificateEnabled);
      }
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        courses = courses.filter(course => 
          course.title.toLowerCase().includes(searchLower) ||
          course.description.toLowerCase().includes(searchLower) ||
          (course.category?.name && course.category.name.toLowerCase().includes(searchLower))
        );
      }
      
      // Filter by price (isPlus)
      if (isPlus !== undefined) {
        if (isPlus) {
          courses = courses.filter(course => course.price > 0);
        } else {
          courses = courses.filter(course => course.price === 0);
        }
      }
      
      // Sort courses
      if (sort === 'popular') {
        courses.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
      } else if (sort === 'rating') {
        courses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else {
        // Default: newest first
        courses.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
      }
      
      // Apply pagination
      const paginatedCourses = courses.slice(offset, offset + limit);
      
      const response = {
        courses: paginatedCourses,
        total: courses.length
      };
      
      console.log('✅ Firebase response:', { 
        total: response.total, 
        coursesReturned: response.courses.length,
        offset,
        limit 
      });
      
      return response;
    },
  });
}; 