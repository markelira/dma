"use strict";
/**
 * Subscription Started Email Template
 * Sent when checkout is completed and subscription becomes active
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSubscriptionStartedEmail = sendSubscriptionStartedEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send subscription started email
 */
async function sendSubscriptionStartedEmail(data) {
    const { firstName, email } = data;
    const subject = 'Sikeres fizetés - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('Vásárlásod sikeres volt.')}
    ${(0, base_1.createParagraph)('A Struktúraépítő streaming platform több mint 150 cégépítési tartalma megnyílt számodra. Egy izgalmas kaland egyedül nem is olyan jó. Hívj meg 5 munkatársat teljesen ingyen, hogy együtt építsetek struktúrált és önjáró vállalkozást.')}

    ${(0, base_1.createButtonRow)({ text: 'MEGHÍVÁS', url: `${APP_URL}/vallalkozas/kezdolap/employees`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Sikeres fizetés! Hívj meg 5 munkatársat ingyen.',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'Vásárlásod sikeres volt.',
            'A Struktúraépítő streaming platform több mint 150 cégépítési tartalma megnyílt számodra. Egy izgalmas kaland egyedül nem is olyan jó. Hívj meg 5 munkatársat teljesen ingyen, hogy együtt építsetek struktúrált és önjáró vállalkozást.',
        ],
        ctaText: 'MEGHÍVÁS',
        ctaUrl: `${APP_URL}/vallalkozas/kezdolap/employees`,
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
        console.error('Failed to send subscription started email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=subscriptionStarted.js.map