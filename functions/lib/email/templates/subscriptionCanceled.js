"use strict";
/**
 * Subscription Canceled Email Template
 * Sent when user cancels their subscription
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
    const { firstName, email, planName, accessUntil, reactivateUrl } = data;
    const subject = 'Előfizetésed lemondva';
    const resubscribeUrl = reactivateUrl || `${APP_URL}/pricing`;
    const content = `
    ${(0, base_1.createHeading)('Előfizetésed lemondva', 2)}
    ${(0, base_1.createParagraph)(`Szia <strong>${firstName}</strong>,`)}
    ${(0, base_1.createParagraph)(`Megerősítjük, hogy a <strong>${planName}</strong> előfizetésed lemondásra került.`)}

    ${(0, base_1.createAlertBox)(`A hozzáférésed <strong>${accessUntil}</strong>-ig aktív marad. Utána nem éred el a prémium tartalmakat.`, 'warning')}

    ${(0, base_1.createParagraph)('Sajnáljuk, hogy mész! Ha meggondoltad magad, bármikor újra előfizethetsz:')}

    ${(0, base_1.createButtonRow)({ text: 'Újra előfizetek', url: resubscribeUrl, variant: 'primary' })}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Szeretnénk tudni, miért döntöttél így?
        </p>
      </td>
    </tr>
    ${(0, base_1.createParagraph)('Visszajelzésed segít nekünk jobbá tenni a platformot. Ha van időd, írj nekünk pár sort a support@dma.hu címre.')}

    ${(0, base_1.createParagraph)('Köszönjük, hogy velünk voltál!', { muted: true })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `Előfizetésed lemondva - hozzáférésed ${accessUntil}-ig tart`,
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            `Megerősítjük, hogy a ${planName} előfizetésed lemondásra került.`,
            `A hozzáférésed ${accessUntil}-ig aktív marad. Utána nem éred el a prémium tartalmakat.`,
            'Sajnáljuk, hogy mész! Ha meggondoltad magad, bármikor újra előfizethetsz.',
            'Szeretnénk tudni, miért döntöttél így? Visszajelzésed segít nekünk jobbá tenni a platformot. Ha van időd, írj nekünk pár sort a support@dma.hu címre.',
            'Köszönjük, hogy velünk voltál!',
        ],
        ctaText: 'Újra előfizetek',
        ctaUrl: resubscribeUrl,
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