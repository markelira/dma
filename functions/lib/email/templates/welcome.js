"use strict";
/**
 * Welcome Email Template
 * Sent after successful registration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(data) {
    const { firstName, email } = data;
    const subject = 'Üdv a Struktúraépítők között - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel, hogy vállalkozásod végre strukturált és önjáró legyen.')}
    ${(0, base_1.createParagraph)('Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.')}

    ${(0, base_1.createButtonRow)({ text: 'KEZD EL 7 NAPIG INGYEN', url: `${APP_URL}/company/dashboard/billing`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Üdv a Struktúraépítők között! Fedezd fel a 150+ cégépítési tartalmat.',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel, hogy vállalkozásod végre strukturált és önjáró legyen.',
            'Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.',
        ],
        ctaText: 'KEZD EL 7 NAPIG INGYEN',
        ctaUrl: `${APP_URL}/company/dashboard/billing`,
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
        console.error('Failed to send welcome email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=welcome.js.map