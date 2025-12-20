"use strict";
/**
 * Employee Invitation Functions
 * 🔴 CRITICAL: Uses transactions to prevent double-use of invite tokens
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
exports.acceptEmployeeInvite = exports.verifyEmployeeInvite = exports.addEmployee = void 0;
exports.sendInvitationEmail = sendInvitationEmail;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
/**
 * Add Employee to Company (Sends Invitation)
 */
exports.addEmployee = v2_1.https.onCall({
    region: 'europe-west1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    console.log('📧 [addEmployee] Function called', {
        hasAuth: !!request.auth,
        userId: request.auth?.uid,
        data: { ...request.data, email: request.data?.email?.substring(0, 5) + '...' },
    });
    if (!request.auth) {
        console.log('❌ [addEmployee] No auth - rejecting');
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, email, firstName, lastName, jobTitle } = request.data;
    const userId = request.auth.uid;
    console.log('📧 [addEmployee] Processing invite for:', { companyId, email, firstName, lastName });
    // Validation
    if (!companyId || !email || !firstName || !lastName) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid email format');
    }
    try {
        // 1. Verify admin permission
        const adminDoc = await db
            .collection('companies')
            .doc(companyId)
            .collection('admins')
            .doc(userId)
            .get();
        if (!adminDoc.exists) {
            throw new https_1.HttpsError('permission-denied', 'You are not an admin of this company');
        }
        const adminData = adminDoc.data();
        if (!adminData?.permissions?.canManageEmployees) {
            throw new https_1.HttpsError('permission-denied', 'No permission to manage employees');
        }
        // 2. Check for duplicate email in this company
        const existingEmployee = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .where('email', '==', email.toLowerCase())
            .limit(1)
            .get();
        if (!existingEmployee.empty) {
            throw new https_1.HttpsError('already-exists', 'An employee with this email already exists in your company');
        }
        // 2b. Check if email already exists in Firebase Auth
        try {
            await admin.auth().getUserByEmail(email.toLowerCase());
            // If we get here, user exists - throw error
            throw new https_1.HttpsError('already-exists', 'Ez az email cím már regisztrálva van. A felhasználó a beállításokban csatlakozhat a céghez.');
        }
        catch (authError) {
            // user-not-found is expected and good - means we can invite
            if (authError.code !== 'auth/user-not-found' && !(authError instanceof https_1.HttpsError)) {
                console.error('[addEmployee] Error checking email in Auth:', authError);
                throw new https_1.HttpsError('internal', 'Failed to verify email availability');
            }
            // Re-throw our HttpsError if that's what it is
            if (authError instanceof https_1.HttpsError) {
                throw authError;
            }
        }
        // 2c. Check employee limit (max 5 employees per company)
        const MAX_EMPLOYEES = 5;
        const activeEmployeesSnapshot = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .where('status', 'in', ['invited', 'active']) // Don't count 'left' employees
            .get();
        if (activeEmployeesSnapshot.size >= MAX_EMPLOYEES) {
            throw new https_1.HttpsError('resource-exhausted', `Maximum ${MAX_EMPLOYEES} munkatársat adhatsz hozzá. Távolíts el valakit, ha újat szeretnél hozzáadni.`);
        }
        console.log(`📊 [addEmployee] Employee count: ${activeEmployeesSnapshot.size}/${MAX_EMPLOYEES}`);
        // 3. Generate secure invite token
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
        // 4. Create employee document
        const fullName = `${firstName} ${lastName}`;
        const employeeData = {
            companyId,
            email: email.toLowerCase(),
            firstName,
            lastName,
            fullName,
            jobTitle: jobTitle?.trim() || '',
            status: 'invited',
            inviteToken,
            inviteExpiresAt: firestore_1.Timestamp.fromDate(expiresAt),
            enrolledMasterclasses: [],
            invitedBy: userId,
            invitedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        const employeeRef = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .add(employeeData);
        console.log('✅ [addEmployee] Employee document created:', employeeRef.id);
        // 5. Get company name for email
        const companyDoc = await db.collection('companies').doc(companyId).get();
        const companyName = companyDoc.data()?.name || 'DMA';
        // 6. Send invitation email via SendGrid (non-blocking)
        // Link directly to registration with email prefilled - user gets auto-linked when registering
        const inviteUrl = `${process.env.APP_URL || 'https://masterclass.dma.hu'}/register?invite=${inviteToken}&email=${encodeURIComponent(email.toLowerCase())}`;
        console.log('📨 [addEmployee] Attempting to send email...', {
            to: email,
            companyName,
            inviteUrl: inviteUrl.substring(0, 80) + '...',
            hasSendgridKey: !!process.env.SENDGRID_API_KEY,
        });
        try {
            const emailResult = await sendInvitationEmail(email, {
                firstName,
                companyName,
                inviteUrl,
            });
            console.log('✅ [addEmployee] Invitation email sent to', email, 'Result:', emailResult);
        }
        catch (emailError) {
            console.error('❌ [addEmployee] Failed to send invitation email to', email, ':', emailError.message);
            // Don't throw - employee was still added successfully
        }
        console.log('🎉 [addEmployee] Complete - returning success');
        return {
            success: true,
            employeeId: employeeRef.id,
            inviteToken,
            message: `Invitation sent to ${email}`,
        };
    }
    catch (error) {
        console.error('Error adding employee:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Verify Employee Invite Token
 */
exports.verifyEmployeeInvite = v2_1.https.onCall({
    region: 'europe-west1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    const { token } = request.data;
    if (!token) {
        throw new https_1.HttpsError('invalid-argument', 'Invite token is required');
    }
    try {
        // Find employee by token (collection group query)
        const employeeQuery = await db
            .collectionGroup('employees')
            .where('inviteToken', '==', token)
            .limit(1)
            .get();
        if (employeeQuery.empty) {
            throw new https_1.HttpsError('not-found', 'Invalid invite token');
        }
        const employeeDoc = employeeQuery.docs[0];
        const employeeData = employeeDoc.data();
        // Check if token has expired
        const now = new Date();
        const expiresAt = employeeData.inviteExpiresAt?.toDate();
        if (expiresAt && expiresAt < now) {
            throw new https_1.HttpsError('failed-precondition', 'Invite has expired');
        }
        // Check if already accepted
        if (employeeData.status !== 'invited') {
            throw new https_1.HttpsError('failed-precondition', 'Invite has already been used');
        }
        // Get company info
        const companyDoc = await db
            .collection('companies')
            .doc(employeeData.companyId)
            .get();
        // Return format expected by frontend invite page
        return {
            valid: true,
            companyName: companyDoc.data()?.name || 'Unknown Company',
            employeeEmail: employeeData.email,
            employeeName: `${employeeData.firstName} ${employeeData.lastName}`,
        };
    }
    catch (error) {
        console.error('Error verifying invite:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Accept Employee Invite
 * 🔴 CRITICAL: Uses transaction to prevent double-use of token
 */
exports.acceptEmployeeInvite = v2_1.https.onCall({
    region: 'europe-west1',
    memory: '256MiB',
    cors: true,
}, async (request) => {
    console.log('🎫 [acceptEmployeeInvite] Function called', {
        hasAuth: !!request.auth,
        userId: request.auth?.uid,
        userEmail: request.auth?.token?.email,
        tokenProvided: !!request.data?.token,
        tokenPrefix: request.data?.token?.substring(0, 10) + '...',
    });
    if (!request.auth) {
        console.log('❌ [acceptEmployeeInvite] No auth - rejecting');
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { token } = request.data;
    const userId = request.auth.uid;
    const userEmail = request.auth.token.email;
    if (!token) {
        console.log('❌ [acceptEmployeeInvite] No token provided');
        throw new https_1.HttpsError('invalid-argument', 'Invite token is required');
    }
    console.log('🔄 [acceptEmployeeInvite] Starting transaction to accept invite...');
    // 🔴 CRITICAL FIX: Use transaction to prevent double-use of token
    const result = await db.runTransaction(async (transaction) => {
        // 1. Find employee by token
        const employeeQuery = await db
            .collectionGroup('employees')
            .where('inviteToken', '==', token)
            .limit(1)
            .get();
        if (employeeQuery.empty) {
            console.log('❌ [acceptEmployeeInvite] Token not found in any employee document');
            throw new https_1.HttpsError('not-found', 'Invalid invite token');
        }
        const employeeDocRef = employeeQuery.docs[0].ref;
        const employeeDoc = await transaction.get(employeeDocRef);
        const employeeData = employeeDoc.data();
        console.log('✅ [acceptEmployeeInvite] Found employee document:', {
            employeeId: employeeDocRef.id,
            employeeEmail: employeeData.email,
            employeeStatus: employeeData.status,
            companyId: employeeData.companyId,
        });
        // 2. Check if already accepted (in transaction)
        if (employeeData.status !== 'invited') {
            throw new https_1.HttpsError('failed-precondition', 'Invite has already been used');
        }
        // 3. Email matching is now optional - allow existing users with different email
        // This enables "merge accounts" flow where existing users can join companies
        // The invite token itself is the security measure
        const emailMatches = userEmail && employeeData.email.toLowerCase() === userEmail.toLowerCase();
        if (!emailMatches) {
            console.log(`Employee ${userId} accepting invite with different email. Invited: ${employeeData.email}, Logged in: ${userEmail}`);
        }
        // 4. Check if token has expired
        const now = new Date();
        const expiresAt = employeeData.inviteExpiresAt?.toDate();
        if (expiresAt && expiresAt < now) {
            throw new https_1.HttpsError('failed-precondition', 'Invite has expired');
        }
        // 5. Update employee ATOMICALLY (prevents race condition)
        transaction.update(employeeDocRef, {
            userId,
            status: 'active',
            inviteAcceptedAt: firestore_1.FieldValue.serverTimestamp(),
            inviteToken: firestore_1.FieldValue.delete(),
            inviteExpiresAt: firestore_1.FieldValue.delete(),
        });
        console.log('✅ [acceptEmployeeInvite] Transaction: Updating employee status to active');
        return {
            success: true,
            companyId: employeeData.companyId,
            employeeId: employeeDocRef.id,
        };
    });
    console.log('✅ [acceptEmployeeInvite] Transaction completed successfully:', result);
    // 6. Set custom user claims for COMPANY_EMPLOYEE role
    console.log('🔑 [acceptEmployeeInvite] Setting custom claims for user...');
    try {
        await admin.auth().setCustomUserClaims(userId, {
            role: 'COMPANY_EMPLOYEE',
            companyId: result.companyId,
        });
        console.log('✅ [acceptEmployeeInvite] Custom claims set for employee', userId);
    }
    catch (claimsError) {
        console.error('❌ [acceptEmployeeInvite] Error setting custom claims:', claimsError);
        // Don't throw - invite was already accepted successfully
    }
    // 7. Update user document with company info (for dashboard display)
    console.log('📝 [acceptEmployeeInvite] Updating user document with company info...');
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
            // Update existing user - merge accounts
            await userRef.update({
                companyId: result.companyId,
                companyRole: 'employee',
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            console.log(`Updated existing user ${userId} with company ${result.companyId}`);
        }
        else {
            // Create user document if doesn't exist (shouldn't happen normally)
            const authUser = await admin.auth().getUser(userId);
            await userRef.set({
                id: userId,
                email: authUser.email || '',
                firstName: authUser.displayName?.split(' ')[0] || '',
                lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
                role: 'STUDENT', // Keep as student for course access
                companyId: result.companyId,
                companyRole: 'employee',
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            console.log(`Created user document for ${userId} with company ${result.companyId}`);
        }
    }
    catch (userError) {
        console.error('⚠️ [acceptEmployeeInvite] CRITICAL: Failed to update user document:', {
            userId,
            companyId: result.companyId,
            error: userError.message,
            code: userError.code,
        });
        // Don't throw - invite was already accepted successfully
        // But this failure means subscription check won't find companyId!
    }
    // 8. Auto-enroll employee in all company-purchased masterclasses
    try {
        const companyDoc = await db.collection('companies').doc(result.companyId).get();
        const companyData = companyDoc.data();
        const purchasedMasterclasses = companyData?.purchasedMasterclasses || [];
        if (purchasedMasterclasses.length > 0) {
            // Update employee document with enrolled masterclasses
            await db
                .collection('companies')
                .doc(result.companyId)
                .collection('employees')
                .doc(result.employeeId)
                .update({
                enrolledMasterclasses: purchasedMasterclasses,
            });
            // Create progress records for each masterclass
            const batch = db.batch();
            for (const masterclassId of purchasedMasterclasses) {
                const progressId = `${userId}_${masterclassId}`;
                const progressRef = db.collection('userProgress').doc(progressId);
                batch.set(progressRef, {
                    userId,
                    masterclassId,
                    companyId: result.companyId,
                    currentModule: 1,
                    completedModules: [],
                    status: 'active',
                    enrolledAt: firestore_1.FieldValue.serverTimestamp(),
                    lastActivityAt: firestore_1.FieldValue.serverTimestamp(),
                });
            }
            await batch.commit();
            console.log(`Employee ${userId} auto-enrolled in ${purchasedMasterclasses.length} company-purchased masterclasses`);
        }
    }
    catch (enrollError) {
        console.error('Error auto-enrolling employee:', enrollError);
        // Don't throw error - invite was already accepted successfully
    }
    return {
        success: true,
        companyId: result.companyId,
        message: 'Invite accepted successfully',
    };
});
/**
 * Send Invitation Email via SendGrid
 * Exported for use in completeOnboarding
 */
async function sendInvitationEmail(to, data) {
    const { sendEmail } = require('../email/emailService');
    const { wrapInBaseTemplate, createHeading, createParagraph, createButtonRow, generatePlainText, } = require('../email/templates/base');
    const subject = 'Meghívód érkezett - DMA Masterclass';
    // Build email content using base template
    const content = `
    ${createHeading(`Szia ${data.firstName}!`, 2)}
    ${createParagraph('Meghívást kaptál a Struktúraépítő streaming platformhoz.')}
    ${createParagraph('Mivel egy jófej főnököd van, ezért mostantól te is hozzáférést kaptál több mint 150 cégépítési tartalomhoz. Neked teljesen ingyen biztosítjuk a felületet és amíg aktív előfizetésetek van, addig 200+ óra cégépítési tartalomhoz férhettek hozzá.')}
    ${createParagraph('Regisztrálj és hozd létre a saját fiókod!')}

    ${createButtonRow({ text: 'REGISZTRÁLOK', url: data.inviteUrl, variant: 'primary' })}
  `;
    const htmlContent = wrapInBaseTemplate(content, {
        showUnsubscribe: false, // Transactional email
        preheader: 'Meghívást kaptál a Struktúraépítő streaming platformhoz!',
    });
    const textContent = generatePlainText({
        greeting: `Szia ${data.firstName}!`,
        paragraphs: [
            'Meghívást kaptál a Struktúraépítő streaming platformhoz.',
            'Mivel egy jófej főnököd van, ezért mostantól te is hozzáférést kaptál több mint 150 cégépítési tartalomhoz. Neked teljesen ingyen biztosítjuk a felületet és amíg aktív előfizetésetek van, addig 200+ óra cégépítési tartalomhoz férhettek hozzá.',
            'Regisztrálj és hozd létre a saját fiókod!',
        ],
        ctaText: 'REGISZTRÁLOK',
        ctaUrl: data.inviteUrl,
        signOff: 'Üdvözlettel, A DMA csapat',
    });
    try {
        const result = await sendEmail({
            to,
            subject,
            html: htmlContent,
            text: textContent,
        });
        if (result.success) {
            console.log(`Invitation email sent successfully to ${to}`);
            return { success: true };
        }
        else {
            throw new Error(result.error || 'Failed to send email');
        }
    }
    catch (error) {
        console.error('Error sending invitation email:', error);
        throw new Error(`Failed to send invitation email: ${error.message}`);
    }
}
//# sourceMappingURL=employeeInvite.js.map