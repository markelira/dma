"use strict";
/**
 * Send Manual Reminder to At-Risk Employees
 * MVP: Admin can manually send reminder emails to employees who are falling behind
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
exports.sendEmployeeReminder = void 0;
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Send reminder email to employee
 */
exports.sendEmployeeReminder = v2_1.https.onCall({
    region: 'europe-west1',
    memory: '256MiB',
    maxInstances: 10, // Limit concurrent executions
    timeoutSeconds: 60, // 1 minute timeout
    cors: true,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { companyId, employeeId, masterclassId } = request.data;
    const userId = request.auth.uid;
    if (!companyId || !employeeId) {
        throw new https_1.HttpsError('invalid-argument', 'Missing required fields');
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
        // 2. Get employee data
        const employeeDoc = await db
            .collection('companies')
            .doc(companyId)
            .collection('employees')
            .doc(employeeId)
            .get();
        if (!employeeDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Employee not found');
        }
        const employeeData = employeeDoc.data();
        if (!employeeData) {
            throw new https_1.HttpsError('not-found', 'Employee data not found');
        }
        // 3. Get company data
        const companyDoc = await db.collection('companies').doc(companyId).get();
        const companyData = companyDoc.data();
        const companyName = companyData?.name || 'Your Company';
        // 4. Get masterclass data if specified
        let masterclassTitle = 'your assigned masterclass';
        if (masterclassId) {
            const masterclassDoc = await db
                .collection('course-content')
                .doc(masterclassId)
                .get();
            if (masterclassDoc.exists) {
                masterclassTitle = masterclassDoc.data()?.title || masterclassTitle;
            }
        }
        // 5. Send reminder email
        await sendReminderEmail(employeeData.email, {
            firstName: employeeData.firstName,
            companyName,
            masterclassTitle,
            dashboardUrl: `${process.env.APP_URL || 'https://masterclass.dma.hu'}/dashboard`,
        });
        // 6. Log activity
        await db.collection('companies').doc(companyId).collection('activity').add({
            type: 'reminder_sent',
            employeeId,
            employeeName: employeeData.fullName || `${employeeData.firstName} ${employeeData.lastName}`,
            masterclassId: masterclassId || null,
            sentBy: userId,
            sentByEmail: request.auth.token.email,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Reminder sent to employee ${employeeId} in company ${companyId}`);
        return {
            success: true,
            message: `Reminder sent to ${employeeData.firstName}`,
        };
    }
    catch (error) {
        console.error('Error sending reminder:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
/**
 * Send reminder email via SendGrid using base template
 */
async function sendReminderEmail(to, data) {
    const { sendEmail } = require('../email/emailService');
    const { wrapInBaseTemplate, createHeading, createParagraph, createButtonRow, createAlertBox, generatePlainText, } = require('../email/templates/base');
    const subject = `Emlékeztető: Folytasd a(z) ${data.masterclassTitle} tartalmakat`;
    // Build email content using base template
    const content = `
    ${createHeading('Emlékeztető', 2)}
    ${createParagraph(`Szia <strong>${data.firstName}</strong>,`)}
    ${createParagraph(`A(z) <strong>${data.companyName}</strong> csapata észrevette, hogy egy ideje nem tekinted meg a <strong>${data.masterclassTitle}</strong> tartalmakat.`)}

    ${createAlertBox('<strong>Tipp:</strong> Napi 15 perc elég ahhoz, hogy lendületben maradj és a lehető legtöbbet hozd ki a programból!', 'info')}

    ${createParagraph('Folytasd ott, ahol abbahagytad:')}

    ${createButtonRow({ text: 'Tovább a platformra', url: data.dashboardUrl, variant: 'primary' })}

    ${createParagraph('Tudjuk, hogy elfoglalt vagy, de az időbefektetés megéri - a csapat számít rád!', { muted: true })}
  `;
    const htmlContent = wrapInBaseTemplate(content, {
        showUnsubscribe: true, // Marketing email - can unsubscribe
        preheader: `${data.companyName} csapata emlékeztet a ${data.masterclassTitle} tartalmakra`,
    });
    const textContent = generatePlainText({
        greeting: `Szia ${data.firstName},`,
        paragraphs: [
            `A(z) ${data.companyName} csapata észrevette, hogy egy ideje nem tekinted meg a ${data.masterclassTitle} tartalmakat.`,
            'Tipp: Napi 15 perc elég ahhoz, hogy lendületben maradj és a lehető legtöbbet hozd ki a programból!',
            'Folytasd ott, ahol abbahagytad.',
            'Tudjuk, hogy elfoglalt vagy, de az időbefektetés megéri - a csapat számít rád!',
        ],
        ctaText: 'Tovább a platformra',
        ctaUrl: data.dashboardUrl,
        signOff: `Üdvözlettel, ${data.companyName} & A DMA csapat`,
    });
    try {
        const result = await sendEmail({
            to,
            subject,
            html: htmlContent,
            text: textContent,
        });
        if (result.success) {
            console.log(`Reminder email sent successfully to ${to}`);
            return { success: true };
        }
        else {
            throw new Error(result.error || 'Failed to send email');
        }
    }
    catch (error) {
        console.error('Error sending reminder email:', error);
        throw new Error(`Failed to send reminder email: ${error.message}`);
    }
}
//# sourceMappingURL=sendReminder.js.map