/**
 * Promo Code Management Cloud Functions
 *
 * Handles creation, validation, and usage of promo codes
 */
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const firestore = admin.firestore();

/**
 * Create promo code (Admin only)
 */
export const createPromoCode = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'ADMIN') {
      throw new Error('Csak ADMIN hozhat létre promóciós kódot');
    }

    const { code, description, durationMonths, maxUses, expiresAt } = request.data;

    if (!code || !description || !durationMonths) {
      throw new Error('Kód, leírás és időtartam kötelező');
    }

    const upperCode = code.toUpperCase().trim();

    // Check if code already exists
    const existingSnapshot = await firestore
      .collection('promoCodes')
      .where('code', '==', upperCode)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      throw new Error('Ez a promóciós kód már létezik');
    }

    // Create promo code
    const promoCodeData = {
      code: upperCode,
      description,
      durationMonths: parseInt(durationMonths),
      maxUses: maxUses ? parseInt(maxUses) : null,
      usedCount: 0,
      active: true,
      expiresAt: expiresAt || null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const promoCodeRef = await firestore.collection('promoCodes').add(promoCodeData);

    logger.info(`Promo code created: ${upperCode} by ${userId}`);

    return {
      success: true,
      message: 'Promóciós kód sikeresen létrehozva',
      promoCode: {
        id: promoCodeRef.id,
        ...promoCodeData
      }
    };

  } catch (error: any) {
    logger.error('Create promo code error:', error);
    throw new Error(error.message || 'Promóciós kód létrehozása sikertelen');
  }
});

/**
 * Get all promo codes (Admin only)
 */
export const getPromoCodes = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'ADMIN') {
      throw new Error('Csak ADMIN láthatja a promóciós kódokat');
    }

    // Get all promo codes
    const promoCodesSnapshot = await firestore
      .collection('promoCodes')
      .orderBy('createdAt', 'desc')
      .get();

    const promoCodes: any[] = [];

    promoCodesSnapshot.forEach(doc => {
      promoCodes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      promoCodes
    };

  } catch (error: any) {
    logger.error('Get promo codes error:', error);
    throw new Error(error.message || 'Promóciós kódok lekérdezése sikertelen');
  }
});

/**
 * Delete promo code (Admin only)
 */
export const deletePromoCode = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Hitelesítés szükséges');
    }

    const userId = request.auth.uid;

    // Check if user is admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || userData.role !== 'ADMIN') {
      throw new Error('Csak ADMIN törölhet promóciós kódot');
    }

    const { promoCodeId } = request.data;

    if (!promoCodeId) {
      throw new Error('Promóciós kód azonosító kötelező');
    }

    // Delete promo code
    await firestore.collection('promoCodes').doc(promoCodeId).delete();

    logger.info(`Promo code deleted: ${promoCodeId} by ${userId}`);

    return {
      success: true,
      message: 'Promóciós kód törölve'
    };

  } catch (error: any) {
    logger.error('Delete promo code error:', error);
    throw new Error(error.message || 'Promóciós kód törlése sikertelen');
  }
});

/**
 * Validate promo code (for user input)
 */
export const validatePromoCode = onCall({
  cors: true,
  region: 'us-central1',
}, async (request) => {
  try {
    const { promoCode } = request.data;

    if (!promoCode) {
      throw new Error('Promóciós kód kötelező');
    }

    const upperCode = promoCode.toUpperCase().trim();

    // Find promo code
    const promoSnapshot = await firestore
      .collection('promoCodes')
      .where('code', '==', upperCode)
      .where('active', '==', true)
      .limit(1)
      .get();

    if (promoSnapshot.empty) {
      return {
        success: false,
        valid: false,
        message: 'Érvénytelen promóciós kód'
      };
    }

    const promoDoc = promoSnapshot.docs[0];
    const promoData = promoDoc.data();

    // Check expiry
    if (promoData.expiresAt) {
      const expiryDate = new Date(promoData.expiresAt);
      if (expiryDate < new Date()) {
        return {
          success: false,
          valid: false,
          message: 'Ez a promóciós kód lejárt'
        };
      }
    }

    // Check max uses
    if (promoData.maxUses && promoData.usedCount >= promoData.maxUses) {
      return {
        success: false,
        valid: false,
        message: 'Ez a promóciós kód elfogyott'
      };
    }

    // Check if user already used it (if authenticated)
    if (request.auth) {
      const userId = request.auth.uid;
      const usageSnapshot = await firestore
        .collection('promoCodeUsages')
        .where('userId', '==', userId)
        .where('promoCodeId', '==', promoDoc.id)
        .limit(1)
        .get();

      if (!usageSnapshot.empty) {
        return {
          success: false,
          valid: false,
          message: 'Ezt a promóciós kódot már felhasználtad'
        };
      }
    }

    return {
      success: true,
      valid: true,
      message: 'Érvényes promóciós kód',
      promoCode: {
        id: promoDoc.id,
        code: promoData.code,
        description: promoData.description,
        durationMonths: promoData.durationMonths
      }
    };

  } catch (error: any) {
    logger.error('Validate promo code error:', error);
    throw new Error(error.message || 'Promóciós kód ellenőrzése sikertelen');
  }
});
