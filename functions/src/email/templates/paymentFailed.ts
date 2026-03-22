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
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  data: PaymentFailedData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, updatePaymentUrl } = data;

  const subject = 'Fizetési hiba, cselekedj gyorsan - DMA Masterclass';

  const paymentUpdateUrl = updatePaymentUrl || `${APP_URL}/vallalkozas/kezdolap/billing`;

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('Sajnos sikertelen volt a fizetésed a DMA Masterclass - Struktúraépítő streaming platformon. Cselekedj gyorsan és ne hagyd elveszni az eddigi kalandjaidat.')}
    ${createParagraph('<strong>Mi szokott ilyenkor probléma lenni?</strong>')}

    <tr>
      <td style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 24px; color: #111827; padding-bottom: 16px;">
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Nincs a megadott kártyán elég fedezet</li>
          <li style="margin-bottom: 8px;">Rosszul lettek megadva a kártya adatai</li>
        </ul>
      </td>
    </tr>

    ${createButtonRow({ text: 'FIZETÉS FRISSÍTÉSE', url: paymentUpdateUrl, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: false, // Transactional - billing related
    preheader: 'Fizetési hiba történt - cselekedj gyorsan!',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'Sajnos sikertelen volt a fizetésed a DMA Masterclass - Struktúraépítő streaming platformon. Cselekedj gyorsan és ne hagyd elveszni az eddigi kalandjaidat.',
      'Mi szokott ilyenkor probléma lenni?',
      '- Nincs a megadott kártyán elég fedezet',
      '- Rosszul lettek megadva a kártya adatai',
    ],
    ctaText: 'FIZETÉS FRISSÍTÉSE',
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
