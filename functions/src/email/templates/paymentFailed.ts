/**
 * Payment Failed Email Template
 * Sent when invoice payment fails
 */

import { sendEmail } from '../emailService';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createButtonRow,
  createAlertBox,
  generatePlainText,
} from './base';

const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';

interface PaymentFailedData {
  firstName: string;
  email: string;
  amount: number;
  currency: string;
  planName: string;
  updatePaymentUrl?: string;
  retryDate?: string;
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
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  data: PaymentFailedData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, amount, currency, planName, updatePaymentUrl, retryDate } = data;

  const subject = 'Fizetési hiba - intézkedés szükséges';
  const formattedAmount = formatAmount(amount, currency);

  const paymentUpdateUrl = updatePaymentUrl || `${APP_URL}/company/dashboard/billing`;

  const content = `
    ${createHeading('Fizetési hiba', 2)}
    ${createParagraph(`Szia <strong>${firstName}</strong>,`)}
    ${createParagraph(`Sajnos nem sikerült feldolgoznunk a legutóbbi fizetésedet a <strong>${planName}</strong> csomaghoz.`)}

    ${createAlertBox(`Összeg: <strong>${formattedAmount}</strong> - A fizetés sikertelen volt.`, 'error')}

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

    ${createButtonRow({ text: 'Fizetési mód frissítése', url: paymentUpdateUrl, variant: 'urgent' })}

    ${retryDate ? createParagraph(`Automatikusan újra próbálkozunk <strong>${retryDate}</strong> dátummal.`) : ''}

    ${createParagraph('Ha a probléma továbbra is fennáll, kérjük lépj kapcsolatba velünk a support@dma.hu címen.', { muted: true })}

    ${createAlertBox('Ha nem frissíted a fizetési adatokat, az előfizetésed felfüggesztésre kerülhet.', 'warning')}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: false, // Transactional - billing related
    preheader: 'Fizetési hiba történt - kérjük frissítsd a fizetési módot',
  });

  const textContent = generatePlainText({
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
    const result = await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to send payment failed email:', error);
    return { success: false, error: error.message };
  }
}
