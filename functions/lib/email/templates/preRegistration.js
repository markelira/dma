"use strict";
/**
 * Pre-Registration Email Template
 * Sent when a platform admin creates a pre-registration for a new company admin
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPreRegistrationEmail = sendPreRegistrationEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
/**
 * Send pre-registration email to the invited user
 */
async function sendPreRegistrationEmail(data) {
    const { firstName, email, companyName, registerUrl } = data;
    const subject = 'Regisztrációd elő lett készítve - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('A regisztrációdat előkészítettük a DMA Masterclass platformon.')}
    ${(0, base_1.createParagraph)(`A <strong>${companyName}</strong> cég admin fiókodat már létrehoztuk neked. Az adataid már ki vannak töltve, csak a jelszavadat kell megadnod a regisztráció befejezéséhez.`)}

    ${(0, base_1.createButtonRow)({ text: 'REGISZTRÁCIÓ BEFEJEZÉSE', url: registerUrl, variant: 'primary' })}

    ${(0, base_1.createAlertBox)('A link 7 napig érvényes. Ha lejár, kérj új linket az adminisztrátortól.', 'info')}

    ${(0, base_1.createParagraph)('Ha nem te kérted ezt a regisztrációt, nyugodtan hagyd figyelmen kívül ezt az emailt.', { muted: true })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: false,
        preheader: 'A regisztrációdat előkészítettük - csak a jelszavadat kell megadnod!',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'A regisztrációdat előkészítettük a DMA Masterclass platformon.',
            `A ${companyName} cég admin fiókodat már létrehoztuk neked. Az adataid már ki vannak töltve, csak a jelszavadat kell megadnod a regisztráció befejezéséhez.`,
            'A link 7 napig érvényes. Ha lejár, kérj új linket az adminisztrátortól.',
            'Ha nem te kérted ezt a regisztrációt, nyugodtan hagyd figyelmen kívül ezt az emailt.',
        ],
        ctaText: 'REGISZTRÁCIÓ BEFEJEZÉSE',
        ctaUrl: registerUrl,
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
        console.error('Failed to send pre-registration email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=preRegistration.js.map