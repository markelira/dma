import { onCall } from 'firebase-functions/v2/https';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

if (getApps().length === 0) {
  initializeApp();
}

const firestore = getFirestore();

const updateCourseSchema = z.object({
  courseId: z.string().min(1),
  data: z.record(z.any()),
});

const publishCourseSchema = z.object({
  courseId: z.string().min(1),
});

const canEdit = async (uid: string, courseId: string): Promise<boolean> => {
  const userSnap = await firestore.collection('users').doc(uid).get();
  if (!userSnap.exists) return false;
  const user = userSnap.data() as any;
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'INSTRUCTOR') return false;
  const courseSnap = await firestore.collection('courses').doc(courseId).get();
  if (!courseSnap.exists) return false;
  const course = courseSnap.data() as any;
  return course.instructorId === uid;
};

export const updateCourse = onCall(async (request) => {
  try {
    if (!request.auth) throw new Error('Bejelentkezés szükséges.');
    const { courseId, data } = updateCourseSchema.parse(request.data || {});
    const uid = request.auth.uid;
    const permitted = await canEdit(uid, courseId);
    if (!permitted) throw new Error('Nincs jogosultság a kurzus frissítéséhez.');

    const courseRef = firestore.collection('courses').doc(courseId);
    await courseRef.update({ ...data, updatedAt: new Date().toISOString() });
    const updatedSnap = await courseRef.get();
    return { success: true, course: { id: updatedSnap.id, ...updatedSnap.data() } };
  } catch (error: any) {
    console.error('updateCourse error', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validációs hiba', details: error.errors };
    }
    return { success: false, error: error.message || 'Ismeretlen hiba történt' };
  }
});

export const publishCourse = onCall(async (request) => {
  try {
    if (!request.auth) throw new Error('Bejelentkezés szükséges.');
    const { courseId } = publishCourseSchema.parse(request.data || {});
    const uid = request.auth.uid;
    const permitted = await canEdit(uid, courseId);
    if (!permitted) throw new Error('Nincs jogosultság a kurzus publikálásához.');

    const courseRef = firestore.collection('courses').doc(courseId);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) throw new Error('Kurzus nem található.');
    const course = courseSnap.data() as any;

    // minimal validation
    if (!course.title || !course.description) {
      throw new Error('A közzétételhez a kurzus cím és leírás megadása kötelező.');
    }
    if (course.moduleCount === 0) {
      throw new Error('A közzétételhez legalább egy modul szükséges.');
    }

    await courseRef.update({ status: 'PUBLISHED', publishedAt: new Date().toISOString() });
    const updated = (await courseRef.get()).data();
    return { success: true, course: { id: courseId, ...updated } };
  } catch (error: any) {
    console.error('publishCourse error', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validációs hiba', details: error.errors };
    }
    return { success: false, error: error.message || 'Ismeretlen hiba történt' };
  }
}); 