"use strict";
/**
 * Payment Failed Email Template
 * Sent when invoice payment fails
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentFailedEmail = sendPaymentFailedEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Format amount with currency
 */
function formatAmount(amount, currency) {
    if (currency.toLowerCase() === 'huf') {
        return `${amount.toLocaleString('hu-HU')} Ft`;
    }
    return `${amount} ${currency.toUpperCase()}`;
}
/**
 * Send payment failed email
 */
async function sendPaymentFailedEmail(data) {
    const { firstName, email, amount, currency, planName, updatePaymentUrl, retryDate } = data;
    const subject = 'Fizetési hiba - intézkedés szükséges';
    const formattedAmount = formatAmount(amount, currency);
    const paymentUpdateUrl = updatePaymentUrl || `${APP_URL}/company/dashboard/billing`;
    const content = `
    ${(0, base_1.createHeading)('Fizetési hiba', 2)}
    ${(0, base_1.createParagraph)(`Szia <strong>${firstName}</strong>,`)}
    ${(0, base_1.createParagraph)(`Sajnos nem sikerült feldolgoznunk a legutóbbi fizetésedet a <strong>${planName}</strong> csomaghoz.`)}

    ${(0, base_1.createAlertBox)(`Összeg: <strong>${formattedAmount}</strong> - A fizetés sikertelen volt.`, 'error')}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Mit tehetsz?
        </p>
      </td>
    </tr>
    <tr>
      <td style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 24px; color: #111827; padding-bottom: 16px;">
        <ol style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Ellenőrizd, hogy a kártyádon elegendő fedezet van</li>
          <li style="margin-bottom: 8px;">Győződj meg róla, hogy a kártyaadatok helyesek</li>
          <li style="margin-bottom: 8px;">Ha szükséges, frissítsd a fizetési módot</li>
        </ol>
      </td>
    </tr>

    ${(0, base_1.createButtonRow)({ text: 'Fizetési mód frissítése', url: paymentUpdateUrl, variant: 'urgent' })}

    ${retryDate ? (0, base_1.createParagraph)(`Automatikusan újra próbálkozunk <strong>${retryDate}</strong> dátummal.`) : ''}

    ${(0, base_1.createParagraph)('Ha a probléma továbbra is fennáll, kérjük lépj kapcsolatba velünk a support@dma.hu címen.', { muted: true })}

    ${(0, base_1.createAlertBox)('Ha nem frissíted a fizetési adatokat, az előfizetésed felfüggesztésre kerülhet.', 'warning')}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: false, // Transactional - billing related
        preheader: 'Fizetési hiba történt - kérjük frissítsd a fizetési módot',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            `Sajnos nem sikerült feldolgoznunk a legutóbbi fizetésedet a ${planName} csomaghoz.`,
            `Összeg: ${formattedAmount}`,
            'Mit tehetsz?',
            '1. Ellenőrizd, hogy a kártyádon elegendő fedezet van',
            '2. Győződj meg róla, hogy a kártyaadatok helyesek',
            '3. Ha szükséges, frissítsd a fizetési módot',
            retryDate ? `Automatikusan újra próbálkozunk ${retryDate} dátummal.` : '',
            'Ha a probléma továbbra is fennáll, kérjük lépj kapcsolatba velünk a support@dma.hu címen.',
        ].filter(Boolean),
        ctaText: 'Fizetési mód frissítése',
        ctaUrl: paymentUpdateUrl,
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
        console.error('Failed to send payment failed email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=paymentFailed.js.map