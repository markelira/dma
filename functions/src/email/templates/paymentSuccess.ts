/**
 * Payment Success Email Template
 * Sent when invoice is successfully paid
 */

import { sendEmail } from '../emailService';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createButtonRow,
  generatePlainText,
} from './base';

const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';

interface PaymentSuccessData {
  firstName: string;
  email: string;
  amount: number;
  currency: string;
  planName: string;
  invoiceUrl?: string;
  periodEnd?: string; // Next billing date
}

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
  if (currency.toLowerCase() === 'huf') {
    return `${amount.toLocaleString('hu-HU')} Ft`;
  }
  return `${amount} ${currency.toUpperCase()}`;
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  data: PaymentSuccessData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, amount, currency, planName, invoiceUrl, periodEnd } = data;

  const subject = 'Sikeres fizetés - DMA Masterclass';
  const formattedAmount = formatAmount(amount, currency);

  const content = `
    ${createHeading('Sikeres fizetés!', 2)}
    ${createParagraph(`Szia <strong>${firstName}</strong>,`)}
    ${createParagraph(`Köszönjük! Sikeresen feldolgoztuk a fizetésedet.`)}

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

    ${createButtonRow({ text: 'Számla megtekintése', url: `${APP_URL}/company/dashboard/billing`, variant: 'secondary' })}

    ${createParagraph('Az előfizetésed továbbra is aktív. Folytasd a tartalmak felfedezését:')}

    ${createButtonRow({ text: 'Tovább a platformra', url: `${APP_URL}/company/dashboard`, variant: 'primary' })}

    ${createParagraph('Ha bármilyen kérdésed van a számlázással kapcsolatban, írj nekünk a support@dma.hu címre.', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `Sikeres fizetés: ${formattedAmount} - ${planName}`,
  });

  const textContent = generatePlainText({
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
    const result = await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to send payment success email:', error);
    return { success: false, error: error.message };
  }
}
