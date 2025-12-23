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
exports.completeRegistrationInternal = completeRegistrationInternal;
/**
 * Internal Registration Completion Helper
 *
 * This is the core business logic for completing registration.
 * Can be called from both the Cloud Function and the Stripe webhook.
 */
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const linkEmployeeByEmail_1 = require("./linkEmployeeByEmail");
const welcome_1 = require("../email/templates/welcome");
const employeeWelcome_1 = require("../email/templates/employeeWelcome");
/**
 * Complete registration internally - creates company and user documents
 * This function is idempotent - safe to call multiple times
 * Uses transaction to prevent race conditions between frontend and webhook
 */
async function completeRegistrationInternal(input) {
    const db = admin.firestore();
    const auth = admin.auth();
    const { userId, firstName, lastName, email, phone, companyName, billingEmail, industry, companySize } = input;
    // Validate required fields first (before transaction)
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
        throw new Error('Missing required fields: firstName, lastName, email, phone');
    }
    // Apply fallbacks for optional fields
    const finalCompanyName = companyName?.trim() || `${firstName.trim()} ${lastName.trim()}`;
    const finalBillingEmail = billingEmail?.trim()?.toLowerCase() || email.trim().toLowerCase();
    v2_1.logger.info('📝 [completeRegistrationInternal] Processing registration:', {
        userId,
        email: email.substring(0, 5) + '...',
        companyName: finalCompanyName
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
    // Check if slug already exists (outside transaction, acceptable race condition)
    const existingCompanyQuery = await db
        .collection('companies')
        .where('slug', '==', slug)
        .limit(1)
        .get();
    let finalSlug = slug;
    if (!existingCompanyQuery.empty) {
        finalSlug = `${slug}-${Date.now()}`;
        v2_1.logger.info(`⚠️ [completeRegistrationInternal] Slug collision detected, using: ${finalSlug}`);
    }
    // Pre-generate company ID
    const companyRef = db.collection('companies').doc();
    const companyId = companyRef.id;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    // Use transaction to prevent race conditions
    // This ensures that concurrent calls don't both pass the idempotency check
    const result = await db.runTransaction(async (transaction) => {
        // Idempotency check inside transaction - atomic read
        const existingUserDoc = await transaction.get(db.collection('users').doc(userId));
        if (existingUserDoc.exists) {
            const userData = existingUserDoc.data();
            if (userData?.companyId) {
                v2_1.logger.warn(`⚠️ [completeRegistrationInternal] User ${userId} already registered with company ${userData.companyId}`);
                return {
                    alreadyRegistered: true,
                    companyId: userData.companyId
                };
            }
        }
        // Prepare company document
        const companyData = {
            name: finalCompanyName,
            slug: finalSlug,
            billingEmail: finalBillingEmail,
            plan: 'basic',
            status: 'active',
            subscriptionStatus: 'none', // Will be updated by subscription handlers
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (industry)
            companyData.industry = industry;
        if (companySize)
            companyData.companySize = companySize;
        // Prepare admin document
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
        // Prepare user document
        const userDocData = {
            id: userId,
            uid: userId,
            email: email.trim().toLowerCase(),
            emailVerified: true,
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
        // Write all documents in transaction
        transaction.set(companyRef, companyData);
        transaction.set(db.collection('companies').doc(companyId).collection('admins').doc(userId), adminData);
        transaction.set(db.collection('users').doc(userId), userDocData);
        return {
            alreadyRegistered: false,
            companyId: companyId
        };
    });
    // If already registered, return early
    if (result.alreadyRegistered) {
        return {
            success: true,
            companyId: result.companyId,
            userId: userId,
            alreadyRegistered: true,
            message: 'User already registered (idempotent)'
        };
    }
    v2_1.logger.info('✅ [completeRegistrationInternal] Transaction completed, documents created');
    // Set custom claims
    const customClaims = {
        role: 'COMPANY_ADMIN',
        companyId: companyId,
        companyRole: 'owner',
    };
    await auth.setCustomUserClaims(userId, customClaims);
    v2_1.logger.info('✅ [completeRegistrationInternal] Custom claims set');
    // Check for pending employee invite
    let linkedToInvite = false;
    try {
        const linkResult = await (0, linkEmployeeByEmail_1.linkEmployeeByEmail)(userId, email.trim().toLowerCase());
        if (linkResult.linked) {
            linkedToInvite = true;
            v2_1.logger.info('🎉 [completeRegistrationInternal] User auto-linked to company invite');
        }
    }
    catch (linkError) {
        v2_1.logger.warn('⚠️ [completeRegistrationInternal] Error checking employee invite:', linkError.message);
    }
    v2_1.logger.info(`✅ [completeRegistrationInternal] Registration completed for ${fullName} (${companyId})`);
    // Send welcome email (fire-and-forget)
    const emailData = {
        firstName: firstName.trim(),
        email: email.trim().toLowerCase(),
    };
    const sendEmailFn = linkedToInvite ? employeeWelcome_1.sendEmployeeWelcomeEmail : welcome_1.sendWelcomeEmail;
    sendEmailFn(emailData).catch((err) => {
        v2_1.logger.warn(`⚠️ [completeRegistrationInternal] Error sending email:`, err.message);
    });
    return {
        success: true,
        companyId,
        userId,
        linkedToInvite,
        message: 'Registration successful',
    };
}
//# sourceMappingURL=completeRegistrationInternal.js.map