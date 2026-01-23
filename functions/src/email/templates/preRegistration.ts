/**
 * Pre-Registration Email Template
 * Sent when a platform admin creates a pre-registration for a new company admin
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

interface PreRegistrationEmailData {
  firstName: string;
  email: string;
  companyName: string;
  registerUrl: string;
}

/**
 * Send pre-registration email to the invited user
 */
export async function sendPreRegistrationEmail(
  data: PreRegistrationEmailData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, companyName, registerUrl } = data;

  const subject = 'Regisztrációd elő lett készítve - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('A regisztrációdat előkészítettük a DMA Masterclass platformon.')}
    ${createParagraph(`A <strong>${companyName}</strong> céges fiókodat már létrehoztuk neked. Az adataid már ki vannak töltve, csak a jelszavadat kell megadnod a regisztráció befejezéséhez.`)}

    ${createButtonRow({ text: 'REGISZTRÁCIÓ BEFEJEZÉSE', url: registerUrl, variant: 'primary' })}

    ${createAlertBox('A link 7 napig érvényes. Ha lejár, kérj új linket az adminisztrátortól.', 'info')}

    ${createParagraph('Ha nem te kérted ezt a regisztrációt, nyugodtan hagyd figyelmen kívül ezt az emailt.', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: false,
    preheader: 'A regisztrációdat előkészítettük - csak a jelszavadat kell megadnod!',
  });

  const textContent = generatePlainText({
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
    const result = await sendEmail({
      to: email,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to send pre-registration email:', error);
    return { success: false, error: error.message };
  }
}
