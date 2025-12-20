"use strict";
/**
 * New Content Available Email Template
 * Sent to all registered users when a new course is published
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewContentAvailableEmail = sendNewContentAvailableEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send new content notification email
 */
async function sendNewContentAvailableEmail(data) {
    const { firstName, email, courseTitle, courseId } = data;
    const subject = 'Új tartalom elérhető - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)(`A Struktúraépítő streaming platformon egy új tartalom elérhető számodra: <strong>${courseTitle}</strong>`)}

    ${(0, base_1.createButtonRow)({ text: 'KALAND ELINDÍTÁSA', url: `${APP_URL}/courses/${courseId}`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `Új tartalom: ${courseTitle}`,
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            `A Struktúraépítő streaming platformon egy új tartalom elérhető számodra: ${courseTitle}`,
        ],
        ctaText: 'KALAND ELINDÍTÁSA',
        ctaUrl: `${APP_URL}/courses/${courseId}`,
        signOff: 'Üdvözlettel, A DMA csapat',
    });
    try {
        const result = await (0, emailService_1.sendEmail)({
            to: email,
            subject,
            html: htmlContent,
            text: textContent,
        });
        return result;
    }
    catch (error) {
        console.error('Failed to send new content available email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=newContentAvailable.js.map