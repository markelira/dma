"use strict";
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
exports.completeUnifiedRegistration = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const linkEmployeeByEmail_1 = require("./linkEmployeeByEmail");
/**
 * Complete unified registration - creates company and user for all new registrations
 * Everyone gets COMPANY_ADMIN role with a Company document
 * Falls back to user's name if company name not provided
 */
exports.completeUnifiedRegistration = v2_1.https.onCall({
    region: 'us-central1',
    memory: '512MiB',
    cors: [
        'https://masterclass.dma.hu',
        'https://academion.hu',
        'https://dmaapp-477d4.web.app',
        'https://dmaapp-477d4.firebaseapp.com',
        'http://localhost:3000'
    ]
}, async (request) => {
    const db = admin.firestore();
    const auth = admin.auth();
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { firstName, lastName, email, phone, companyName, billingEmail, industry, companySize } = request.data;
    // Validate required fields
    if (!firstName?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'First name is required');
    }
    if (!lastName?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Last name is required');
    }
    if (!email?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Email is required');
    }
    if (!phone?.trim()) {
        throw new https_1.HttpsError('invalid-argument', 'Phone number is required');
    }
    try {
        // Apply fallbacks for optional fields
        const finalCompanyName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;
        const finalBillingEmail = billingEmail?.trim()?.toLowerCase() || email.trim().toLowerCase();
        console.log('📝 [completeUnifiedRegistration] Processing registration:', {
            userId,
            email: email.substring(0, 5) + '...',
            companyName: finalCompanyName,
            billingEmail: finalBillingEmail
        });
        // Generate company slug from name
        const slug = finalCompanyName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove accents
            .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim()
            .substring(0, 50);
        // Check if slug already exists
        const existingCompanyQuery = await db
            .collection('companies')
            .where('slug', '==', slug)
            .limit(1)
            .get();
        let finalSlug = slug;
        if (!existingCompanyQuery.empty) {
            // Append timestamp to make unique
            finalSlug = `${slug}-${Date.now()}`;
            console.log(`⚠️ [completeUnifiedRegistration] Slug collision detected, using: ${finalSlug}`);
        }
        // Step 1: Create company document
        const companyData = {
            name: finalCompanyName,
            slug: finalSlug,
            billingEmail: finalBillingEmail,
            plan: 'basic',
            status: 'active',
            subscriptionStatus: 'none', // Will be set to 'active' or 'trialing' after Stripe checkout
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        // Only add optional fields if they have values
        if (industry) {
            companyData.industry = industry;
        }
        if (companySize) {
            companyData.companySize = companySize;
        }
        const companyRef = await db.collection('companies').add(companyData);
        const companyId = companyRef.id;
        console.log('✅ [completeUnifiedRegistration] Company document created:', companyId);
        // Step 2: Create company admin document
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const adminData = {
            userId,
            companyId,
            email: email.trim().toLowerCase(),
            name: fullName,
            role: 'owner',
            permissions: {
                canManageEmployees: true,
                canViewReports: true,
                canManageBilling: true,
                canManageMasterclasses: true,
            },
            status: 'active',
            addedBy: userId,
            addedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        await db
            .collection('companies')
            .doc(companyId)
            .collection('admins')
            .doc(userId)
            .set(adminData);
        console.log('✅ [completeUnifiedRegistration] Company admin document created');
        // Step 3: Create user document in users collection
        const userDocData = {
            id: userId,
            uid: userId,
            email: email.trim().toLowerCase(),
            emailVerified: false, // Will be updated after email verification
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            role: 'COMPANY_ADMIN',
            companyId: companyId,
            companyRole: 'owner',
            profilePictureUrl: null,
            title: 'Owner',
            bio: `Owner of ${finalCompanyName}`,
            institution: finalCompanyName,
            credentials: [],
            specialties: [],
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        console.log('🔍 [completeUnifiedRegistration] Writing user document to Firestore:', {
            path: `users/${userId}`,
            companyId: companyId,
            role: 'COMPANY_ADMIN',
            companyRole: 'owner',
            phone: phone.trim()
        });
        await db.collection('users').doc(userId).set(userDocData);
        console.log('✅ [completeUnifiedRegistration] User document written successfully');
        // Step 4: Set custom claims
        const customClaims = {
            role: 'COMPANY_ADMIN',
            companyId: companyId,
            companyRole: 'owner',
        };
        console.log('🔍 [completeUnifiedRegistration] Setting custom claims:', customClaims);
        await auth.setCustomUserClaims(userId, customClaims);
        console.log('✅ [completeUnifiedRegistration] Custom claims set successfully');
        // Verify claims were set by reading them back
        const userRecordVerify = await auth.getUser(userId);
        console.log('🔍 [completeUnifiedRegistration] Verified custom claims from Firebase Auth:', userRecordVerify.customClaims);
        // Step 5: Check for pending employee invite
        let linkedToInvite = false;
        try {
            const linkResult = await (0, linkEmployeeByEmail_1.linkEmployeeByEmail)(userId, email.trim().toLowerCase());
            if (linkResult.linked) {
                linkedToInvite = true;
                console.log('🎉 [completeUnifiedRegistration] User auto-linked to company invite:', {
                    companyId: linkResult.companyId,
                    companyName: linkResult.companyName
                });
                // Note: linkEmployeeByEmail already sets COMPANY_EMPLOYEE claims and updates user doc
                // This overrides the COMPANY_ADMIN role we just set, which is correct behavior
            }
        }
        catch (linkError) {
            console.warn('⚠️ [completeUnifiedRegistration] Error checking employee invite:', linkError.message);
            // Don't throw - user registration was successful
        }
        console.log(`✅ Registration completed for ${fullName} (${companyId})`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Company: ${finalCompanyName}`);
        console.log(`   Linked to invite: ${linkedToInvite}`);
        return {
            success: true,
            companyId,
            userId,
            linkedToInvite,
            message: 'Registration successful',
        };
    }
    catch (error) {
        console.error('❌ Error in completeUnifiedRegistration:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', `Failed to complete registration: ${error.message}`);
    }
});
//# sourceMappingURL=completeUnifiedRegistration.js.map