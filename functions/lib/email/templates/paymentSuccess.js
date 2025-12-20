"use strict";
/**
 * Payment Success Email Template
 * Sent when invoice is successfully paid
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentSuccessEmail = sendPaymentSuccessEmail;
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
 * Send payment success email
 */
async function sendPaymentSuccessEmail(data) {
    const { firstName, email, amount, currency, planName, invoiceUrl, periodEnd } = data;
    const subject = 'Sikeres fizetés - DMA Masterclass';
    const formattedAmount = formatAmount(amount, currency);
    const content = `
    ${(0, base_1.createHeading)('Sikeres fizetés!', 2)}
    ${(0, base_1.createParagraph)(`Szia <strong>${firstName}</strong>,`)}
    ${(0, base_1.createParagraph)(`Köszönjük! Sikeresen feldolgoztuk a fizetésedet.`)}

    <tr>
      <td style="padding: 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 8px; padding: 20px;">
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #E5E7EB;">
              <span style="font-family: Inter, sans-serif; font-size: 14px; color: #6B7280;">Csomag:</span>
              <span style="font-family: Inter, sans-serif; font-size: 14px; color: #111827; font-weight: 600; float: right;">${planName}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 20px; border-bottom: 1px solid #E5E7EB;">
              <span style="font-family: Inter, sans-serif; font-size: 14px; color: #6B7280;">Összeg:</span>
              <span style="font-family: Inter, sans-serif; font-size: 14px; color: #111827; font-weight: 600; float: right;">${formattedAmount}</span>
            </td>
          </tr>
          ${periodEnd ? `
          <tr>
            <td style="padding: 12px 20px;">
              <span style="font-family: Inter, sans-serif; font-size: 14px; color: #6B7280;">Következő számlázás:</span>
              <span style="font-family: Inter, sans-serif; font-size: 14px; color: #111827; font-weight: 600; float: right;">${periodEnd}</span>
            </td>
          </tr>
          ` : ''}
        </table>
      </td>
    </tr>

    ${(0, base_1.createButtonRow)({ text: 'Számla megtekintése', url: `${APP_URL}/company/dashboard/billing`, variant: 'secondary' })}

    ${(0, base_1.createParagraph)('Az előfizetésed továbbra is aktív. Folytasd a tartalmak felfedezését:')}

    ${(0, base_1.createButtonRow)({ text: 'Tovább a platformra', url: `${APP_URL}/company/dashboard`, variant: 'primary' })}

    ${(0, base_1.createParagraph)('Ha bármilyen kérdésed van a számlázással kapcsolatban, írj nekünk a support@dma.hu címre.', { muted: true })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `Sikeres fizetés: ${formattedAmount} - ${planName}`,
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'Köszönjük! Sikeresen feldolgoztuk a fizetésedet.',
            `Csomag: ${planName}`,
            `Összeg: ${formattedAmount}`,
            periodEnd ? `Következő számlázás: ${periodEnd}` : '',
            'Az előfizetésed továbbra is aktív.',
            'Ha bármilyen kérdésed van a számlázással kapcsolatban, írj nekünk a support@dma.hu címre.',
        ].filter(Boolean),
        ctaText: 'Tovább a platformra',
        ctaUrl: `${APP_URL}/company/dashboard`,
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
        console.error('Failed to send payment success email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=paymentSuccess.js.map