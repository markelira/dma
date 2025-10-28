import { onCall } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

const firestore = getFirestore();

// Zod schemas
const createModuleSchema = z.object({
  courseId: z.string().min(1, 'Course ID szükséges'),
  title: z.string().min(1, 'Modul cím szükséges'),
  description: z.string().optional(),
});

const updateModuleSchema = z.object({
  courseId: z.string().min(1, 'Course ID szükséges'),
  moduleId: z.string().min(1, 'Module ID szükséges'),
  data: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
  }),
});

const deleteModuleSchema = z.object({
  courseId: z.string().min(1, 'Course ID szükséges'),
  moduleId: z.string().min(1, 'Module ID szükséges'),
});

const reorderModulesSchema = z.object({
  courseId: z.string().min(1, 'Course ID szükséges'),
  moduleIds: z.array(z.string()).min(1, 'Module IDs szükséges'),
});

// Helper to check if user can modify course
async function canModifyCourse(userId: string, courseId: string): Promise<boolean> {
  const courseDoc = await firestore.collection('courses').doc(courseId).get();
  if (!courseDoc.exists) return false;
  
  const course = courseDoc.data();
  const userDoc = await firestore.collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  return course?.instructorId === userId || userData?.role === 'ADMIN';
}

/**
 * Create a new module for a course
 */
export const createModule = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges');
    }

    const { courseId, title, description } = createModuleSchema.parse(request.data);

    // Check permissions
    if (!await canModifyCourse(request.auth.uid, courseId)) {
      throw new Error('Nincs jogosultság a kurzus módosításához');
    }

    // Get current module count for ordering
    const modulesSnap = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .get();

    const moduleData = {
      title,
      description: description || '',
      order: modulesSnap.size,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const moduleRef = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .add(moduleData);

    return {
      success: true,
      module: {
        id: moduleRef.id,
        ...moduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error('❌ createModule error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Modul létrehozása sikertelen',
    };
  }
});

/**
 * Update an existing module
 */
export const updateModule = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges');
    }

    const { courseId, moduleId, data } = updateModuleSchema.parse(request.data);

    // Check permissions
    if (!await canModifyCourse(request.auth.uid, courseId)) {
      throw new Error('Nincs jogosultság a kurzus módosításához');
    }

    const updateData = {
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .update(updateData);

    return {
      success: true,
      message: 'Modul sikeresen frissítve',
    };
  } catch (error: any) {
    console.error('❌ updateModule error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Modul frissítése sikertelen',
    };
  }
});

/**
 * Delete a module and all its lessons
 */
export const deleteModule = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges');
    }

    const { courseId, moduleId } = deleteModuleSchema.parse(request.data);

    // Check permissions
    if (!await canModifyCourse(request.auth.uid, courseId)) {
      throw new Error('Nincs jogosultság a kurzus módosításához');
    }

    const batch = firestore.batch();

    // Delete all lessons in the module
    const lessonsSnap = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .doc(moduleId)
      .collection('lessons')
      .get();

    lessonsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the module
    batch.delete(
      firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleId)
    );

    await batch.commit();

    // Reorder remaining modules
    const remainingModules = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .orderBy('order')
      .get();

    const reorderBatch = firestore.batch();
    remainingModules.docs.forEach((doc, index) => {
      reorderBatch.update(doc.ref, { order: index });
    });
    await reorderBatch.commit();

    return {
      success: true,
      message: 'Modul sikeresen törölve',
    };
  } catch (error: any) {
    console.error('❌ deleteModule error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Modul törlése sikertelen',
    };
  }
});

/**
 * Reorder modules
 */
export const reorderModules = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges');
    }

    const { courseId, moduleIds } = reorderModulesSchema.parse(request.data);

    // Check permissions
    if (!await canModifyCourse(request.auth.uid, courseId)) {
      throw new Error('Nincs jogosultság a kurzus módosításához');
    }

    const batch = firestore.batch();

    // Update order for each module
    moduleIds.forEach((moduleId, index) => {
      const moduleRef = firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleId);
      
      batch.update(moduleRef, { 
        order: index,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return {
      success: true,
      message: 'Modulok sorrendje frissítve',
    };
  } catch (error: any) {
    console.error('❌ reorderModules error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Modulok átrendezése sikertelen',
    };
  }
});