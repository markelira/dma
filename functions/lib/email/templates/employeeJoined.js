"use strict";
/**
 * Employee Joined Email Template
 * Sent to company admin when an invited employee registers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmployeeJoinedEmail = sendEmployeeJoinedEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send notification to admin when employee joins
 */
async function sendEmployeeJoinedEmail(data) {
    const { adminFirstName, adminEmail, employeeFullName } = data;
    const subject = 'Munkatársad csatlakozott - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${adminFirstName}!`, 2)}
    ${(0, base_1.createParagraph)(`<strong>${employeeFullName}</strong> sikeresen beregisztrált a DMA Masterclassra.`)}
    ${(0, base_1.createParagraph)('Kalandozásait nyomon tudod követni a profilodban, a Munkatársaim menüpontban.')}

    ${(0, base_1.createButtonRow)({ text: 'MEGNÉZEM', url: `${APP_URL}/company/dashboard/employees`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `${employeeFullName} csatlakozott a csapathoz!`,
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${adminFirstName}!`,
        paragraphs: [
            `${employeeFullName} sikeresen beregisztrált a DMA Masterclassra.`,
            'Kalandozásait nyomon tudod követni a profilodban, a Munkatársaim menüpontban.',
        ],
        ctaText: 'MEGNÉZEM',
        ctaUrl: `${APP_URL}/company/dashboard/employees`,
        signOff: 'Üdvözlettel, A DMA csapat',
    });
    try {
        const result = await (0, emailService_1.sendEmail)({
            to: adminEmail,
            subject,
            html: htmlContent,
            text: textContent,
        });
        return result;
    }
    catch (error) {
        console.error('Failed to send employee joined email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=employeeJoined.js.map