import { useQuery } from '@tanstack/react-query'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/lib/firebase'
import { Lesson } from '@/types'

/**
 * Fetch lesson data from Firestore
 * Tries locations in order: embedded in course → lessons subcollection → modules/lessons subcollection
 */
export const fetchLesson = async (id: string, courseId: string): Promise<Lesson> => {
  if (!courseId || !id) {
    throw new Error('Hiányzó kurzus vagy lecke azonosító');
  }

  // Resolve course ID (handle slug or direct ID)
  let actualCourseId = courseId;
  const coursesBySlug = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseId)));
  if (!coursesBySlug.empty) {
    actualCourseId = coursesBySlug.docs[0].id;
  }

  // 1. Try embedded lessons in course document
  const courseDoc = await getDoc(doc(db, 'courses', actualCourseId));
  if (courseDoc.exists()) {
    const courseData = courseDoc.data();

    // Check embedded lessons array
    if (courseData.lessons?.length > 0) {
      const embedded = courseData.lessons.find((l: any) => l.id === id);
      if (embedded) {
        return {
          id,
          ...embedded,
          type: embedded.type || 'VIDEO',
          content: embedded.content || '',
          resources: embedded.resources || []
        } as Lesson;
      }
    }

    // Check modules with embedded lessons
    if (courseData.modules?.length > 0) {
      for (const module of courseData.modules) {
        if (module.lessons?.length > 0) {
          const moduleLesson = module.lessons.find((l: any) => l.id === id);
          if (moduleLesson) {
            return {
              id: moduleLesson.id || id,
              ...moduleLesson,
              type: moduleLesson.type || 'VIDEO',
              content: moduleLesson.content || '',
              resources: moduleLesson.resources || []
            } as Lesson;
          }
        }
      }
    }
  }

  // 2. Try lessons subcollection
  const lessonDoc = await getDoc(doc(db, 'courses', actualCourseId, 'lessons', id));
  if (lessonDoc.exists()) {
    return {
      id: lessonDoc.id,
      ...lessonDoc.data(),
      type: lessonDoc.data()?.type || 'VIDEO',
      content: lessonDoc.data()?.content || '',
      resources: lessonDoc.data()?.resources || []
    } as Lesson;
  }

  // 3. Try modules/lessons subcollection (check default-module first)
  const defaultLessonDoc = await getDoc(
    doc(db, 'courses', actualCourseId, 'modules', 'default-module', 'lessons', id)
  );
  if (defaultLessonDoc.exists()) {
    return {
      id: defaultLessonDoc.id,
      ...defaultLessonDoc.data(),
      type: defaultLessonDoc.data()?.type || 'VIDEO',
      content: defaultLessonDoc.data()?.content || '',
      resources: defaultLessonDoc.data()?.resources || []
    } as Lesson;
  }

  // 4. Last resort: search all modules
  const modulesSnapshot = await getDocs(collection(db, 'courses', actualCourseId, 'modules'));
  for (const moduleDoc of modulesSnapshot.docs) {
    const moduleLessonDoc = await getDoc(
      doc(db, 'courses', actualCourseId, 'modules', moduleDoc.id, 'lessons', id)
    );
    if (moduleLessonDoc.exists()) {
      return {
        id: moduleLessonDoc.id,
        ...moduleLessonDoc.data(),
        type: moduleLessonDoc.data()?.type || 'VIDEO',
        content: moduleLessonDoc.data()?.content || '',
        resources: moduleLessonDoc.data()?.resources || []
      } as Lesson;
    }
  }

  throw new Error('Lecke nem található');
}

/**
 * React Query hook for fetching lesson data
 */
export const useLesson = (id: string | undefined, courseId?: string) => {
  return useQuery<Lesson, Error>({
    queryKey: ['lesson', id, courseId],
    queryFn: () => fetchLesson(id!, courseId!),
    enabled: !!id && !!courseId,
    staleTime: 5 * 60 * 1000,
    gcTime: 0,
    retry: (failureCount, error) => {
      if (error.message.includes('Bejelentkezés') || error.message.includes('Autentikáció')) {
        return false;
      }
      return failureCount < 3;
    }
  });
}

export const useLessonsForModule = (moduleId: string | undefined) => {
  return useQuery<Lesson[], Error>({
    queryKey: ['module-lessons', moduleId],
    queryFn: async () => {
      const getLessonsForModule = httpsCallable(functions, 'getLessonsForModule')
      const result: any = await getLessonsForModule({ moduleId })
      return result.data.lessons ?? []
    },
    enabled: !!moduleId,
  })
} 