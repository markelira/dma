import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { firestore, auth, storage } from './config';
import * as admin from 'firebase-admin';

// Zod schema for university creation
const createUniversitySchema = z.object({
  name: z.string().min(1, 'A név kötelező.'),
  slug: z.string().min(1, 'A slug kötelező.').regex(/^[a-z0-9-]+$/, 'A slug csak kisbetűket, számokat és kötőjeleket tartalmazhat.'),
  description: z.string().optional(),
  revenueSharePct: z.number().min(0).max(100).optional().default(70),
});

/**
 * Get all universities (Public function – no authentication required)
 */
// Legacy HTTP endpoint (public)
export const getUniversitiesHttp = onRequest(async (request, response) => {
  try {
    const snap = await firestore.collection('universities').get();
    const universities = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    response.json({
      success: true,
      universities,
    });
  } catch (error: any) {
    console.error('❌ getUniversities error:', error);
    response.status(500).json({
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
    });
  }
});

/**
 * Get all universities (Callable)
 */
export const getUniversities = onCall(async () => {
  try {
    const snap = await firestore.collection('universities').get();
    const universities = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return { success: true, universities };
  } catch (error: any) {
    console.error('❌ getUniversities callable error', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Get university members (Admin only)
 */
export const getUniversityMembers = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság az egyetem tagjainak megtekintéséhez.');
    }

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new Error('Az egyetem nem található.');
    }

    // Get university members
    const membersSnapshot = await firestore
      .collection('universityMembers')
      .where('universityId', '==', universityId)
      .get();

    const members = [];
    
    for (const memberDoc of membersSnapshot.docs) {
      const memberData = memberDoc.data();
      const userDoc = await firestore.collection('users').doc(memberData.userId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        members.push({
          userId: memberData.userId,
          universityId: memberData.universityId,
          role: memberData.role,
          createdAt: memberData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          user: {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role,
          },
        });
      }
    }

    return {
      success: true,
      members,
    };

  } catch (error: any) {
    console.error('❌ getUniversityMembers error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Add member to university (Admin only)
 */
export const addUniversityMember = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId, memberUserId, role } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    if (!memberUserId) {
      throw new Error('Tag felhasználó azonosító kötelező.');
    }

    if (!role || !['OWNER', 'EDITOR', 'VIEWER'].includes(role)) {
      throw new Error('Érvénytelen szerepkör.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság tag hozzáadásához.');
    }

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new Error('Az egyetem nem található.');
    }

    // Check if member user exists
    const memberUserDoc = await firestore.collection('users').doc(memberUserId).get();
    if (!memberUserDoc.exists) {
      throw new Error('A tag felhasználó nem található.');
    }

    // Check if member already exists
    const existingMemberQuery = await firestore
      .collection('universityMembers')
      .where('universityId', '==', universityId)
      .where('userId', '==', memberUserId)
      .limit(1)
      .get();

    if (!existingMemberQuery.empty) {
      throw new Error('A felhasználó már tagja az egyetemnek.');
    }

    // Add member
    await firestore.collection('universityMembers').add({
      universityId,
      userId: memberUserId,
      role,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: 'Tag sikeresen hozzáadva.',
    };

  } catch (error: any) {
    console.error('❌ addUniversityMember error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Update member role (Admin only)
 */
export const updateMemberRole = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId, memberUserId, role } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    if (!memberUserId) {
      throw new Error('Tag felhasználó azonosító kötelező.');
    }

    if (!role || !['OWNER', 'EDITOR', 'VIEWER'].includes(role)) {
      throw new Error('Érvénytelen szerepkör.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság szerepkör frissítéséhez.');
    }

    // Find and update member
    const memberQuery = await firestore
      .collection('universityMembers')
      .where('universityId', '==', universityId)
      .where('userId', '==', memberUserId)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      throw new Error('A tag nem található.');
    }

    const memberDoc = memberQuery.docs[0];
    await memberDoc.ref.update({ role });

    return {
      success: true,
      message: 'Szerepkör sikeresen frissítve.',
    };

  } catch (error: any) {
    console.error('❌ updateMemberRole error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Remove member from university (Admin only)
 */
export const removeUniversityMember = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId, memberUserId } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    if (!memberUserId) {
      throw new Error('Tag felhasználó azonosító kötelező.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság tag eltávolításához.');
    }

    // Find and delete member
    const memberQuery = await firestore
      .collection('universityMembers')
      .where('universityId', '==', universityId)
      .where('userId', '==', memberUserId)
      .limit(1)
      .get();

    if (memberQuery.empty) {
      throw new Error('A tag nem található.');
    }

    const memberDoc = memberQuery.docs[0];
    await memberDoc.ref.delete();

    return {
      success: true,
      message: 'Tag sikeresen eltávolítva.',
    };

  } catch (error: any) {
    console.error('❌ removeUniversityMember error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Get courses for a university (Admin only)
 */
export const getUniversityCourses = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság az egyetem kurzusainak megtekintéséhez.');
    }

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new Error('Az egyetem nem található.');
    }

    // Get courses for this university
    const coursesSnapshot = await firestore
      .collection('courses')
      .where('universityId', '==', universityId)
      .get();

    const courses = coursesSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      slug: doc.data().slug,
      status: doc.data().status,
    }));

    return {
      success: true,
      courses,
    };

  } catch (error: any) {
    console.error('❌ getUniversityCourses error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Add courses to a university (Admin only)
 */
export const addCoursesToUniversity = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId, courseIds } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    if (!courseIds || !Array.isArray(courseIds)) {
      throw new Error('Kurzus azonosítók kötelezőek.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság kurzusok hozzáadásához.');
    }

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new Error('Az egyetem nem található.');
    }

    // Update courses with universityId
    const batch = firestore.batch();
    
    for (const courseId of courseIds) {
      const courseRef = firestore.collection('courses').doc(courseId);
      batch.update(courseRef, { universityId });
    }

    await batch.commit();

    return {
      success: true,
      message: 'Kurzusok sikeresen hozzárendelve.',
    };

  } catch (error: any) {
    console.error('❌ addCoursesToUniversity error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Remove course from university (Admin only)
 */
export const removeCourseFromUniversity = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { universityId, courseId } = request.data;

    if (!universityId) {
      throw new Error('Egyetem azonosító kötelező.');
    }

    if (!courseId) {
      throw new Error('Kurzus azonosító kötelező.');
    }

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság kurzus eltávolításához.');
    }

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new Error('Az egyetem nem található.');
    }

    // Remove universityId from course
    await firestore.collection('courses').doc(courseId).update({
      universityId: null,
    });

    return {
      success: true,
      message: 'Kurzus sikeresen eltávolítva.',
    };

  } catch (error: any) {
    console.error('❌ removeCourseFromUniversity error:', error);
    throw new Error(error.message || 'Ismeretlen hiba történt');
  }
});

/**
 * Create a new university (Admin only)
 */
export const createUniversity = onCall(async (request) => {
  try {
    // Authentication check
    if (!request.auth) {
      throw new Error('Nincs jogosultság egyetem létrehozásához.');
    }

    const userId = request.auth.uid;

    // Fetch user role
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság egyetem létrehozásához.');
    }

    // Validate input
    const data = createUniversitySchema.parse(request.data);

    // Duplicate name check
    const existingNameQuery = await firestore
      .collection('universities')
      .where('name', '==', data.name)
      .limit(1)
      .get();

    if (!existingNameQuery.empty) {
      throw new Error('Már létezik egyetem ezzel a névvel.');
    }

    // Duplicate slug check
    const existingSlugQuery = await firestore
      .collection('universities')
      .where('slug', '==', data.slug)
      .limit(1)
      .get();

    if (!existingSlugQuery.empty) {
      throw new Error('Már létezik egyetem ezzel a slug-gal.');
    }

    // Build payload
    const universityData = {
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      revenueSharePct: data.revenueSharePct || 70,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as const;

    // Save
    const uniRef = await firestore.collection('universities').add(universityData);

    return {
      success: true,
      message: 'Egyetem sikeresen létrehozva.',
      university: { id: uniRef.id, ...universityData },
    };
  } catch (error: any) {
    console.error('❌ createUniversity error:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors,
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt',
    };
  }
});

/**
 * Comprehensive university update schema with full validation
 */
const updateUniversitySchema = z.object({
  universityId: z.string().min(1, 'Egyetem azonosító kötelező'),
  name: z.string().min(2, 'A név legalább 2 karakter hosszú legyen').max(100, 'A név maximum 100 karakter lehet').optional(),
  description: z.string().max(500, 'A leírás maximum 500 karakter lehet').optional(),
  website: z.string().url('Érvényes URL címet adjon meg').optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Érvényes telefonszámot adjon meg').optional().or(z.literal('')),
  address: z.string().max(200, 'A cím maximum 200 karakter lehet').optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Az elsődleges szín érvényes hex formátumban legyen (#RRGGBB)').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'A másodlagos szín érvényes hex formátumban legyen (#RRGGBB)').optional(),
  type: z.enum(['PUBLIC', 'PRIVATE', 'TECHNICAL', 'COMMUNITY', 'ONLINE'], {
    errorMap: () => ({ message: 'Az egyetem típusa PUBLIC, PRIVATE, TECHNICAL, COMMUNITY vagy ONLINE lehet' })
  }).optional(),
  revenueSharePct: z.number().min(0, 'A bevételmegosztás nem lehet negatív').max(100, 'A bevételmegosztás maximum 100% lehet').optional(),
  slug: z.string().min(2, 'A slug legalább 2 karakter hosszú legyen').max(50, 'A slug maximum 50 karakter lehet').regex(/^[a-z0-9-]+$/, 'A slug csak kisbetűket, számokat és kötőjelet tartalmazhat').optional()
});

/** Update university (Admin only) */
export const updateUniversity = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Nincs jogosultság egyetem frissítéséhez');
    }

    // Validate input with comprehensive schema
    const validatedData = updateUniversitySchema.parse(request.data || {});
    const { universityId, ...updateFields } = validatedData;

    // Check if university exists
    const universityRef = firestore.collection('universities').doc(universityId);
    const universityDoc = await universityRef.get();
    
    if (!universityDoc.exists) {
      throw new HttpsError('not-found', 'Az egyetem nem található');
    }

    // If name is being updated, check for duplicates
    if (updateFields.name) {
      const existingQuery = await firestore
        .collection('universities')
        .where('name', '==', updateFields.name)
        .limit(1)
        .get();

      if (!existingQuery.empty && existingQuery.docs[0].id !== universityId) {
        throw new HttpsError('already-exists', 'Már létezik egyetem ezzel a névvel');
      }
    }

    // If slug is being updated, check for duplicates
    if (updateFields.slug) {
      const existingSlugQuery = await firestore
        .collection('universities')
        .where('slug', '==', updateFields.slug)
        .limit(1)
        .get();

      if (!existingSlugQuery.empty && existingSlugQuery.docs[0].id !== universityId) {
        throw new HttpsError('already-exists', 'Már létezik egyetem ezzel a slug-gal');
      }
    }

    // Filter out undefined values
    const cleanUpdateFields = Object.fromEntries(
      Object.entries(updateFields).filter(([_, value]) => value !== undefined)
    );

    // Add update timestamp
    const updateData = {
      ...cleanUpdateFields,
      updatedAt: new Date().toISOString()
    };

    // Update university document
    await universityRef.update(updateData);

    // Get updated document
    const updatedUniversity = await universityRef.get();
    const updatedData = updatedUniversity.data();

    console.log(`✅ University updated successfully: ${universityId}`);

    return {
      success: true,
      university: { id: universityId, ...updatedData },
      message: 'Egyetem sikeresen frissítve'
    };

  } catch (error: any) {
    console.error('❌ updateUniversity error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', 'Validációs hiba', { 
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      });
    }
    
    throw new HttpsError('internal', error.message || 'Hiba történt az egyetem frissítése során');
  }
});

/** Delete university (Admin only) */
export const deleteUniversity = onCall(async (request) => {
  try {
    if (!request.auth) throw new Error('Bejelentkezés szükséges.');
    const uid = request.auth.uid;
    const userDoc = await firestore.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') throw new Error('Nincs jogosultság.');

    const { id } = z.object({ id: z.string().min(1) }).parse(request.data || {});
    await firestore.collection('universities').doc(id).delete();
    return { success: true };
  } catch (error: any) {
    console.error('deleteUniversity error', error);
    if (error instanceof z.ZodError) return { success: false, error: 'Validációs hiba', details: error.errors };
    return { success: false, error: error.message };
  }
});

/**
 * Upload university logo to Firebase Storage (Admin only)
 */
const uploadUniversityLogoSchema = z.object({
  universityId: z.string().min(1, 'Egyetem azonosító kötelező'),
  fileName: z.string().min(1, 'Fájlnév kötelező'),
  fileType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/, 'Csak JPG, PNG vagy WebP formátum engedélyezett'),
  fileSize: z.number().max(2 * 1024 * 1024, 'A fájl mérete nem haladhatja meg a 2MB-ot'),
  fileData: z.string().min(1, 'Fájl tartalom kötelező') // Base64 encoded file data
});

export const uploadUniversityLogo = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Nincs jogosultság logó feltöltéséhez');
    }

    // Validate input
    const validatedData = uploadUniversityLogoSchema.parse(request.data);
    const { universityId, fileName, fileType, fileSize, fileData } = validatedData;

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new HttpsError('not-found', 'Az egyetem nem található');
    }

    // Generate file path
    const fileExtension = fileType.split('/')[1];
    const timestamp = Date.now();
    const logoFileName = `logo_${timestamp}.${fileExtension}`;
    const filePath = `universities/${universityId}/${logoFileName}`;

    // Get storage bucket
    const bucket = storage.bucket();
    const file = bucket.file(filePath);

    // Convert base64 to buffer
    const base64Data = fileData.replace(/^data:image\/[a-z]+;base64,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Verify file size matches
    if (fileBuffer.length !== fileSize) {
      throw new HttpsError('invalid-argument', 'Fájl méret nem egyezik');
    }

    // Upload file to Firebase Storage
    await file.save(fileBuffer, {
      metadata: {
        contentType: fileType,
        metadata: {
          uploadedBy: userId,
          universityId: universityId,
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly readable
    await file.makePublic();

    // Generate public URL
    const isEmulator = process.env.FIREBASE_STORAGE_EMULATOR_HOST;
    let publicUrl: string;
    
    if (isEmulator) {
      publicUrl = `http://127.0.0.1:9188/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
    } else {
      publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    // Delete old logo if exists
    const universityData = universityDoc.data();
    if (universityData?.logoUrl) {
      try {
        // Extract old file path from URL
        const oldUrl = universityData.logoUrl;
        let oldFilePath: string | null = null;
        
        if (oldUrl.includes('storage.googleapis.com')) {
          // Production URL format
          const urlParts = oldUrl.split('/');
          const bucketIndex = urlParts.findIndex(part => part.includes('.appspot.com'));
          if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
            oldFilePath = urlParts.slice(bucketIndex + 1).join('/');
          }
        } else if (oldUrl.includes('127.0.0.1:9188')) {
          // Emulator URL format
          const match = oldUrl.match(/\/o\/([^?]+)/);
          if (match) {
            oldFilePath = decodeURIComponent(match[1]);
          }
        }

        if (oldFilePath) {
          const oldFile = bucket.file(oldFilePath);
          const [exists] = await oldFile.exists();
          if (exists) {
            await oldFile.delete();
            console.log(`🗑️ Deleted old logo: ${oldFilePath}`);
          }
        }
      } catch (deleteError) {
        console.warn('⚠️ Failed to delete old logo:', deleteError);
        // Don't throw error, as the upload was successful
      }
    }

    // Update university document with new logo URL
    await firestore.collection('universities').doc(universityId).update({
      logoUrl: publicUrl,
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Logo uploaded successfully for university ${universityId}: ${filePath}`);

    return {
      success: true,
      logoUrl: publicUrl,
      filePath: filePath,
      message: 'Logó sikeresen feltöltve'
    };

  } catch (error: any) {
    console.error('❌ uploadUniversityLogo error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', 'Validációs hiba', { details: error.errors });
    }
    
    throw new HttpsError('internal', error.message || 'Hiba történt a logó feltöltése során');
  }
});

/**
 * Delete university logo from Firebase Storage (Admin only)
 */
const deleteUniversityLogoSchema = z.object({
  universityId: z.string().min(1, 'Egyetem azonosító kötelező')
});

export const deleteUniversityLogo = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Nincs jogosultság logó törléséhez');
    }

    // Validate input
    const { universityId } = deleteUniversityLogoSchema.parse(request.data);

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new HttpsError('not-found', 'Az egyetem nem található');
    }

    const universityData = universityDoc.data();
    const currentLogoUrl = universityData?.logoUrl;

    if (!currentLogoUrl) {
      throw new HttpsError('not-found', 'Nincs logó beállítva ehhez az egyetemhez');
    }

    // Extract file path from URL
    const bucket = storage.bucket();
    let filePath: string | null = null;
    
    if (currentLogoUrl.includes('storage.googleapis.com')) {
      // Production URL format
      const urlParts = currentLogoUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part.includes('.appspot.com'));
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        filePath = urlParts.slice(bucketIndex + 1).join('/');
      }
    } else if (currentLogoUrl.includes('127.0.0.1:9188')) {
      // Emulator URL format
      const match = currentLogoUrl.match(/\/o\/([^?]+)/);
      if (match) {
        filePath = decodeURIComponent(match[1]);
      }
    }

    if (!filePath) {
      throw new HttpsError('invalid-argument', 'Érvénytelen logó URL formátum');
    }

    // Delete file from Firebase Storage
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (exists) {
      await file.delete();
      console.log(`🗑️ Logo deleted from storage: ${filePath}`);
    } else {
      console.warn(`⚠️ Logo file not found in storage: ${filePath}`);
    }

    // Update university document to remove logo URL
    await firestore.collection('universities').doc(universityId).update({
      logoUrl: admin.firestore.FieldValue.delete(),
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Logo removed successfully for university ${universityId}`);

    return {
      success: true,
      message: 'Logó sikeresen eltávolítva'
    };

  } catch (error: any) {
    console.error('❌ deleteUniversityLogo error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', 'Validációs hiba', { details: error.errors });
    }
    
    throw new HttpsError('internal', error.message || 'Hiba történt a logó törlése során');
  }
});

/**
 * Get comprehensive university statistics (Admin only)
 */
const getUniversityStatsSchema = z.object({
  universityId: z.string().min(1, 'Egyetem azonosító kötelező')
});

interface UniversityStats {
  memberCount: number;
  courseCount: number;
  activeStudents: number;
  totalRevenue: number;
  coursesCreatedThisMonth: number;
  newMembersThisMonth: number;
  averageRating: number;
  completionRate: number;
  totalEnrollments: number;
  activeCoursesCount: number;
}

export const getUniversityStats = onCall(async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Felhasználó nem található');
    }

    const userData = userDoc.data();
    if (userData?.role !== 'ADMIN') {
      throw new HttpsError('permission-denied', 'Nincs jogosultság statisztikák megtekintéséhez');
    }

    // Validate input
    const { universityId } = getUniversityStatsSchema.parse(request.data);

    // Check if university exists
    const universityDoc = await firestore.collection('universities').doc(universityId).get();
    if (!universityDoc.exists) {
      throw new HttpsError('not-found', 'Az egyetem nem található');
    }

    // Calculate statistics
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get university members count
    const membersSnapshot = await firestore
      .collection('universityMembers')
      .where('universityId', '==', universityId)
      .get();
    const memberCount = membersSnapshot.size;

    // Get new members this month
    const newMembersSnapshot = await firestore
      .collection('universityMembers')
      .where('universityId', '==', universityId)
      .where('createdAt', '>=', thisMonthStart)
      .get();
    const newMembersThisMonth = newMembersSnapshot.size;

    // Get university courses
    const coursesSnapshot = await firestore
      .collection('courses')
      .where('universityId', '==', universityId)
      .get();
    const courseCount = coursesSnapshot.size;

    // Get courses created this month
    const newCoursesSnapshot = await firestore
      .collection('courses')
      .where('universityId', '==', universityId)
      .where('createdAt', '>=', thisMonthStart.toISOString())
      .get();
    const coursesCreatedThisMonth = newCoursesSnapshot.size;

    // Get active courses (published status)
    const activeCoursesSnapshot = await firestore
      .collection('courses')
      .where('universityId', '==', universityId)
      .where('status', '==', 'PUBLISHED')
      .get();
    const activeCoursesCount = activeCoursesSnapshot.size;

    // Get course enrollments for university courses
    const courseIds = coursesSnapshot.docs.map(doc => doc.id);
    let totalEnrollments = 0;
    let activeStudentsSet = new Set<string>();
    let totalRatings = 0;
    let ratingCount = 0;
    let completedLessons = 0;
    let totalLessons = 0;

    if (courseIds.length > 0) {
      // Process courses in batches of 10 (Firestore 'in' query limit)
      const batches = [];
      for (let i = 0; i < courseIds.length; i += 10) {
        const batch = courseIds.slice(i, i + 10);
        batches.push(batch);
      }

      for (const batch of batches) {
        // Get enrollments for this batch
        const enrollmentsSnapshot = await firestore
          .collection('enrollments')
          .where('courseId', 'in', batch)
          .get();

        enrollmentsSnapshot.docs.forEach(doc => {
          const enrollmentData = doc.data();
          totalEnrollments++;
          
          // Count active students (enrolled in last 30 days or recently active)
          const enrolledAt = enrollmentData.enrolledAt?.toDate?.() || new Date(enrollmentData.enrolledAt);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          if (enrolledAt >= thirtyDaysAgo || enrollmentData.lastAccessedAt) {
            activeStudentsSet.add(enrollmentData.userId);
          }
        });

        // Get course ratings for this batch
        const reviewsSnapshot = await firestore
          .collection('reviews')
          .where('courseId', 'in', batch)
          .get();

        reviewsSnapshot.docs.forEach(doc => {
          const reviewData = doc.data();
          if (reviewData.rating && typeof reviewData.rating === 'number') {
            totalRatings += reviewData.rating;
            ratingCount++;
          }
        });

        // Get lesson progress for completion rate calculation
        const lessonsSnapshot = await firestore
          .collection('lessons')
          .where('courseId', 'in', batch)
          .get();

        const lessonIds = lessonsSnapshot.docs.map(doc => doc.id);
        totalLessons += lessonIds.length;

        if (lessonIds.length > 0) {
          // Process lessons in batches
          const lessonBatches = [];
          for (let j = 0; j < lessonIds.length; j += 10) {
            const lessonBatch = lessonIds.slice(j, j + 10);
            lessonBatches.push(lessonBatch);
          }

          for (const lessonBatch of lessonBatches) {
            const progressSnapshot = await firestore
              .collection('lessonProgress')
              .where('lessonId', 'in', lessonBatch)
              .where('completed', '==', true)
              .get();

            completedLessons += progressSnapshot.size;
          }
        }
      }
    }

    const activeStudents = activeStudentsSet.size;
    const averageRating = ratingCount > 0 ? totalRatings / ratingCount : 0;
    const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Calculate revenue (placeholder - would need payment/transaction data)
    // For now, using estimated revenue based on enrollments and course prices
    let totalRevenue = 0;
    for (const doc of coursesSnapshot.docs) {
      const courseData = doc.data();
      const coursePrice = courseData.price || 0;
      const courseEnrollments = await firestore
        .collection('enrollments')
        .where('courseId', '==', doc.id)
        .get();
      
      const universityData = universityDoc.data();
      const revenueShare = (universityData?.revenueSharePct || 70) / 100;
      totalRevenue += courseEnrollments.size * coursePrice * revenueShare;
    }

    const stats: UniversityStats = {
      memberCount,
      courseCount,
      activeStudents,
      totalRevenue: Math.round(totalRevenue),
      coursesCreatedThisMonth,
      newMembersThisMonth,
      averageRating: Math.round(averageRating * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      totalEnrollments,
      activeCoursesCount
    };

    console.log(`✅ University statistics calculated for: ${universityId}`, stats);

    return {
      success: true,
      stats,
      calculatedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('❌ getUniversityStats error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    if (error instanceof z.ZodError) {
      throw new HttpsError('invalid-argument', 'Validációs hiba', { details: error.errors });
    }
    
    throw new HttpsError('internal', error.message || 'Hiba történt a statisztikák számítása során');
  }
}); 