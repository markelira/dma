"use strict";
/**
 * Notify Boss Email Template
 * Sent when a company employee requests their boss to subscribe
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotifyBossEmail = sendNotifyBossEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send notify boss email when employee requests subscription
 */
async function sendNotifyBossEmail(data) {
    const { adminFirstName, adminEmail, employeeFullName } = data;
    const subject = 'Fizetésnap - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${adminFirstName}!`, 2)}
    ${(0, base_1.createParagraph)(`${employeeFullName} munkatársad szeretné, ha előfizetnél a Struktúraépítő streaming platformon, hogy tovább tudja folytatni a kalandjait. Ne vedd el tőlük a lehetőséget, hogy hozzájáruljanak ahhoz, hogy struktúrált és önjáró vállalkozásotok legyen.`)}
    ${(0, base_1.createParagraph)('Itt a fizetésnap, irány a DMA Masterclass!')}

    ${(0, base_1.createButtonRow)({ text: 'ELŐFIZETEK', url: `${APP_URL}/vallalkozas/kezdolap/billing`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `${employeeFullName} munkatársad szeretne hozzáférni a DMA tartalmakhoz.`,
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${adminFirstName}!`,
        paragraphs: [
            `${employeeFullName} munkatársad szeretné, ha előfizetnél a Struktúraépítő streaming platformon, hogy tovább tudja folytatni a kalandjait. Ne vedd el tőlük a lehetőséget, hogy hozzájáruljanak ahhoz, hogy struktúrált és önjáró vállalkozásotok legyen.`,
            'Itt a fizetésnap, irány a DMA Masterclass!',
        ],
        ctaText: 'ELŐFIZETEK',
        ctaUrl: `${APP_URL}/vallalkozas/kezdolap/billing`,
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
        console.error('Failed to send notify boss email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=notifyBossEmail.js.map