"use strict";
/**
 * Subscription Canceled Email Template
 * Sent when user cancels their subscription or it expires
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSubscriptionCanceledEmail = sendSubscriptionCanceledEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://academion.hu';
/**
 * Send subscription canceled email
 */
async function sendSubscriptionCanceledEmail(data) {
    const { firstName, email } = data;
    const subject = 'Itt a vége - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('Előfizetésedet lemondtad vagy lejárt.')}
    ${(0, base_1.createParagraph)('Sajnáljuk, hogy elhagyod a fedélzetet. Előfizetésed a Struktúraépítő streaming platformon lejárt, így a fordulónapod után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.')}
    ${(0, base_1.createParagraph)('Ha mégis folytatnád, akkor kattints a gombra.')}

    ${(0, base_1.createButtonRow)({ text: 'FOLYTATOM', url: `${APP_URL}/subscribe/start`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Előfizetésed lejárt - folytasd a kalandot!',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'Előfizetésedet lemondtad vagy lejárt.',
            'Sajnáljuk, hogy elhagyod a fedélzetet. Előfizetésed a Struktúraépítő streaming platformon lejárt, így a fordulónapod után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.',
            'Ha mégis folytatnád, akkor kattints a gombra.',
        ],
        ctaText: 'FOLYTATOM',
        ctaUrl: `${APP_URL}/subscribe/start`,
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
        console.error('Failed to send subscription canceled email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=subscriptionCanceled.js.map