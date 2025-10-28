import { onCall, onRequest } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { firestore, auth } from './config';

// Zod schema for category creation
const createCategorySchema = z.object({
  name: z.string().min(1, 'A név kötelező.'),
  description: z.string().optional(),
});

/**
 * Get all categories (Public function - no authentication required)
 */
export const getCategoriesHttp = onRequest(async (request, response) => {
  try {
    // Get all categories from Firestore
    const snap = await firestore.collection('categories').get();
    const categories = snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    response.json({
      success: true,
      categories
    });

  } catch (error: any) {
    console.error('❌ getCategories error:', error);
    
    response.status(500).json({
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    });
  }
});

/**
 * Get all categories (Callable, ajánlott a frontendnek)
 */
export const getCategories = onCall(async () => {
  try {
    const snap = await firestore.collection('categories').get();
    const categories = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return {
      success: true,
      categories,
    };
  } catch (error: any) {
    console.error('❌ getCategories (callable) error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Create a new category (Admin only)
 */
export const createCategory = onCall(async (request) => {
  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('Nincs jogosultság kategória létrehozásához.');
    }

    const userId = request.auth.uid;

    // Get user data to check role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság kategória létrehozásához.');
    }

    // Validate input data
    const data = createCategorySchema.parse(request.data);

    // Check if category with same name already exists
    const existingCategoryQuery = await firestore
      .collection('categories')
      .where('name', '==', data.name)
      .limit(1)
      .get();

    if (!existingCategoryQuery.empty) {
      throw new Error('Már létezik kategória ezzel a névvel.');
    }

    // Create category
    const categoryData = {
      name: data.name,
      description: data.description || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const categoryRef = await firestore.collection('categories').add(categoryData);

    return {
      success: true,
      message: 'Kategória sikeresen létrehozva.',
      category: { id: categoryRef.id, ...categoryData }
    };

  } catch (error: any) {
    console.error('❌ createCategory error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
}); 

// Add updateCategory and deleteCategory
export const updateCategory = onCall(async (request) => {
  try {
    if (!request.auth) throw new Error('Bejelentkezés szükséges.');
    const uid = request.auth.uid;
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) throw new Error('Felhasználó nem található.');
    if (userDoc.data()?.role !== 'ADMIN') throw new Error('Nincs jogosultság.');

    const { id, name, description } = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
    }).parse(request.data || {});

    const ref = firestore.collection('categories').doc(id);
    await ref.update({ name, description: description || null, updatedAt: new Date().toISOString() });
    const updated = (await ref.get()).data();
    return { success: true, category: { id, ...updated } };
  } catch (error: any) {
    console.error('updateCategory error', error);
    if (error instanceof z.ZodError) return { success: false, error: 'Validációs hiba', details: error.errors };
    return { success: false, error: error.message };
  }
});

export const deleteCategory = onCall(async (request) => {
  try {
    if (!request.auth) throw new Error('Bejelentkezés szükséges.');
    const uid = request.auth.uid;
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists) throw new Error('Felhasználó nem található.');
    if (userDoc.data()?.role !== 'ADMIN') throw new Error('Nincs jogosultság.');

    const { id } = z.object({ id: z.string().min(1) }).parse(request.data || {});
    await firestore.collection('categories').doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error('deleteCategory error', error);
    if (error instanceof z.ZodError) return { success: false, error: 'Validációs hiba', details: error.errors };
    return { success: false, error: error.message };
  }
}); 