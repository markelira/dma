/**
 * Subscription Started Email Template
 * Sent when checkout is completed and subscription becomes active
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

interface SubscriptionStartedData {
  firstName: string;
  email: string;
  planName: string;
  trialEndDate?: string;
  isTrialing?: boolean;
}

/**
 * Send subscription started email
 */
export async function sendSubscriptionStartedEmail(
  data: SubscriptionStartedData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email } = data;

  const subject = 'Sikeres fizetés - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('Vásárlásod sikeres volt.')}
    ${createParagraph('A Struktúraépítő streaming platform több mint 150 cégépítési tartalma megnyílt számodra. Egy izgalmas kaland egyedül nem is olyan jó. Hívj meg 5 munkatársat teljesen ingyen, hogy együtt építsetek struktúrált és önjáró vállalkozást.')}

    ${createButtonRow({ text: 'MEGHÍVÁS', url: `${APP_URL}/company/dashboard/employees`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Sikeres fizetés! Hívj meg 5 munkatársat ingyen.',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'Vásárlásod sikeres volt.',
      'A Struktúraépítő streaming platform több mint 150 cégépítési tartalma megnyílt számodra. Egy izgalmas kaland egyedül nem is olyan jó. Hívj meg 5 munkatársat teljesen ingyen, hogy együtt építsetek struktúrált és önjáró vállalkozást.',
    ],
    ctaText: 'MEGHÍVÁS',
    ctaUrl: `${APP_URL}/company/dashboard/employees`,
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
    console.error('Failed to send subscription started email:', error);
    return { success: false, error: error.message };
  }
}
