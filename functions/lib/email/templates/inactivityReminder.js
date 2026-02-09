"use strict";
/**
 * Inactivity Reminder Email Template
 * Sent to users who haven't logged in for over a month
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInactivityReminderEmail = sendInactivityReminderEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send inactivity reminder email to user
 */
async function sendInactivityReminderEmail(data) {
    const { firstName, email } = data;
    const subject = 'Hiányzol… - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('Már egy ideje nem léptél be a Struktúraépítő streaming platformodra. Hiányoznak a közös kalandok. Ne hagyd elveszni a több mint 150 cégépítési tartalmat, vágj bele még ma egy új kalandba.')}

    ${(0, base_1.createButtonRow)({ text: 'BELEVÁGOK', url: `${APP_URL}/bejelentkezes`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Már egy ideje nem léptél be. Hiányoznak a közös kalandok!',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'Már egy ideje nem léptél be a DMA Masterclass struktúraépítő streaming platformodra. Hiányoznak a közös kalandok. Ne hagyd elveszni a több mint 150 cégépítési tartalmat, vágj bele még ma egy új kalandba.',
        ],
        ctaText: 'BELEVÁGOK',
        ctaUrl: `${APP_URL}/bejelentkezes`,
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
        console.error('Failed to send inactivity reminder email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=inactivityReminder.js.map