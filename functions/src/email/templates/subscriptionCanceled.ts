/**
 * Subscription Canceled Email Template
 * Sent when user cancels their subscription
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

const APP_URL = process.env.APP_URL || 'https://academion.hu';

interface SubscriptionCanceledData {
  firstName: string;
  email: string;
  planName: string;
  accessUntil: string; // Date when access ends
  reactivateUrl?: string;
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  data: SubscriptionCanceledData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, planName, accessUntil, reactivateUrl } = data;

  const subject = 'Előfizetésed lemondva';
  const resubscribeUrl = reactivateUrl || `${APP_URL}/register`;

  const content = `
    ${createHeading('Előfizetésed lemondva', 2)}
    ${createParagraph(`Szia <strong>${firstName}</strong>,`)}
    ${createParagraph(`Megerősítjük, hogy a <strong>${planName}</strong> előfizetésed lemondásra került.`)}

    ${createAlertBox(`A hozzáférésed <strong>${accessUntil}</strong>-ig aktív marad. Utána nem éred el a prémium tartalmakat.`, 'warning')}

    ${createParagraph('Sajnáljuk, hogy mész! Ha meggondoltad magad, bármikor újra előfizethetsz:')}

    ${createButtonRow({ text: 'Újra előfizetek', url: resubscribeUrl, variant: 'primary' })}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Szeretnénk tudni, miért döntöttél így?
        </p>
      </td>
    </tr>
    ${createParagraph('Visszajelzésed segít nekünk jobbá tenni a platformot. Ha van időd, írj nekünk pár sort a support@dma.hu címre.')}

    ${createParagraph('Köszönjük, hogy velünk voltál!', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `Előfizetésed lemondva - hozzáférésed ${accessUntil}-ig tart`,
  });

  const textContent = generatePlainText({
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
    const result = await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to send subscription canceled email:', error);
    return { success: false, error: error.message };
  }
}
