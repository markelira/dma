"use strict";
/**
 * Pre-Registration Cloud Functions
 *
 * Allows platform admins to pre-register company admins.
 * The user receives an email with a link to complete registration.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPreRegistration = exports.createPreRegistration = void 0;
exports.markPreRegistrationCompleted = markPreRegistrationCompleted;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const crypto = __importStar(require("crypto"));
const preRegistration_1 = require("../email/templates/preRegistration");
const db = admin.firestore();
/**
 * Create a pre-registration for a new company admin
 * Only platform admins (ADMIN role) can call this function
 */
exports.createPreRegistration = (0, https_1.onCall)({
    region: 'europe-west1',
    memory: '256MiB',
    cors: [
        'https://masterclass.dma.hu',
        'https://academion.hu',
        'https://dmaapp-477d4.web.app',
        'https://dmaapp-477d4.firebaseapp.com',
        'http://localhost:3000'
    ]
}, async (request) => {
    // 1. Authentication check
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Bejelentkezés szükséges');
    }
    // 2. Permission check - only ADMIN role can create pre-registrations
    const adminClaims = request.auth.token;
    const adminRole = adminClaims.role;
    if (adminRole !== 'ADMIN' && adminRole !== 'admin') {
        console.warn(`[createPreRegistration] Permission denied for user ${request.auth.uid} with role ${adminRole}`);
        throw new https_1.HttpsError('permission-denied', 'Csak platform adminisztrátorok hozhatnak létre előregisztrációt');
    }
    // 3. Input validation
    const { firstName, lastName, email, phone, companyName } = request.data;
    if (!firstName?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'A keresztnév megadása kötelező');
    }
    if (!lastName?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'A vezetéknév megadása kötelező');
    }
    if (!email?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Az email cím megadása kötelező');
    }
    if (!phone?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'A telefonszám megadása kötelező');
    }
    if (!companyName?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'A cégnév megadása kötelező');
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
        throw new https_1.HttpsError('invalid-argument', 'Érvénytelen email cím formátum');
    }
    console.log(`[createPreRegistration] Admin ${request.auth.uid} creating pre-registration for ${normalizedEmail}`);
    // 4. Check if email is already registered in Firebase Auth
    try {
        await admin.auth().getUserByEmail(normalizedEmail);
        // If we get here, the user exists
        throw new https_1.HttpsError('already-exists', 'Ez az email cím már regisztrálva van a rendszerben');
    }
    catch (err) {
        if (err.code !== 'auth/user-not-found') {
            // Re-throw if it's our custom error or unexpected error
            if (err instanceof https_1.HttpsError)
                throw err;
            console.error('[createPreRegistration] Error checking email:', err);
            throw new https_1.HttpsError('internal', 'Email ellenőrzés sikertelen');
        }
        // User not found - good, we can proceed
    }
    // 5. Check for existing pending pre-registration with same email
    const existingQuery = await db.collection('preRegistrations')
        .where('email', '==', normalizedEmail)
        .where('status', '==', 'pending')
        .limit(1)
        .get();
    if (!existingQuery.empty) {
        throw new https_1.HttpsError('already-exists', 'Ehhez az email címhez már van függőben lévő előregisztráció');
    }
    // 6. Generate secure token and expiration date
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    // 7. Create pre-registration document
    const preRegData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        companyName: companyName.trim(),
        token,
        expiresAt: firestore_1.Timestamp.fromDate(expiresAt),
        status: 'pending',
        createdBy: request.auth.uid,
        createdByEmail: request.auth.token.email || 'unknown',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('preRegistrations').add(preRegData);
    console.log(`[createPreRegistration] Created pre-registration ${docRef.id} for ${normalizedEmail}`);
    // 8. Send pre-registration email
    const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
    const registerUrl = `${APP_URL}/register?preregister=${token}`;
    try {
        const emailResult = await (0, preRegistration_1.sendPreRegistrationEmail)({
            firstName: firstName.trim(),
            email: normalizedEmail,
            companyName: companyName.trim(),
            registerUrl,
        });
        if (!emailResult.success) {
            console.error('[createPreRegistration] Failed to send email:', emailResult.error);
            // Don't throw - the pre-registration was created successfully
            // Admin can resend the email later if needed
        }
        else {
            console.log(`[createPreRegistration] Email sent to ${normalizedEmail}`);
        }
    }
    catch (emailError) {
        console.error('[createPreRegistration] Email send error:', emailError);
        // Continue - pre-registration is still valid
    }
    return {
        success: true,
        preRegistrationId: docRef.id,
        message: `Előregisztráció létrehozva és email elküldve: ${normalizedEmail}`,
    };
});
/**
 * Verify a pre-registration token and return the pre-filled data
 * This function is called when a user visits the register page with a preregister token
 * No authentication required (user is not logged in yet)
 */
exports.verifyPreRegistration = (0, https_1.onCall)({
    region: 'europe-west1',
    memory: '256MiB',
    cors: [
        'https://masterclass.dma.hu',
        'https://academion.hu',
        'https://dmaapp-477d4.web.app',
        'https://dmaapp-477d4.firebaseapp.com',
        'http://localhost:3000'
    ]
}, async (request) => {
    const { token } = request.data;
    if (!token?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Token megadása kötelező');
    }
    console.log(`[verifyPreRegistration] Verifying token: ${token.substring(0, 8)}...`);
    // Find pre-registration by token
    const snapshot = await db.collection('preRegistrations')
        .where('token', '==', token.trim())
        .limit(1)
        .get();
    if (snapshot.empty) {
        console.warn(`[verifyPreRegistration] Token not found: ${token.substring(0, 8)}...`);
        throw new https_1.HttpsError('not-found', 'Érvénytelen vagy lejárt előregisztrációs link');
    }
    const doc = snapshot.docs[0];
    const data = doc.data();
    // Check status
    if (data.status === 'completed') {
        console.warn(`[verifyPreRegistration] Token already used: ${doc.id}`);
        throw new https_1.HttpsError('failed-precondition', 'Ez az előregisztráció már fel lett használva');
    }
    if (data.status === 'expired') {
        console.warn(`[verifyPreRegistration] Token expired (marked): ${doc.id}`);
        throw new https_1.HttpsError('failed-precondition', 'Ez az előregisztrációs link lejárt');
    }
    // Check expiration date
    const now = new Date();
    const expiresAt = data.expiresAt?.toDate();
    if (expiresAt && expiresAt < now) {
        // Mark as expired
        await doc.ref.update({ status: 'expired' });
        console.warn(`[verifyPreRegistration] Token expired (date check): ${doc.id}`);
        throw new https_1.HttpsError('failed-precondition', 'Ez az előregisztrációs link lejárt');
    }
    console.log(`[verifyPreRegistration] Token valid for ${data.email}`);
    return {
        valid: true,
        preRegistrationId: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        companyName: data.companyName,
    };
});
/**
 * Mark a pre-registration as completed
 * Called internally after successful registration
 */
async function markPreRegistrationCompleted(preRegistrationId, userId) {
    try {
        await db.collection('preRegistrations').doc(preRegistrationId).update({
            status: 'completed',
            completedAt: firestore_1.FieldValue.serverTimestamp(),
            completedUserId: userId,
        });
        console.log(`[markPreRegistrationCompleted] Pre-registration ${preRegistrationId} marked as completed for user ${userId}`);
    }
    catch (error) {
        console.error(`[markPreRegistrationCompleted] Failed to update pre-registration ${preRegistrationId}:`, error);
        // Don't throw - this is a non-critical operation
    }
}
//# sourceMappingURL=preRegistration.js.map