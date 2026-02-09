/**
 * Welcome Email Template
 * Sent after successful registration
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

interface WelcomeEmailData {
  firstName: string;
  email: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  const { firstName, email } = data;

  const subject = 'Üdv a Struktúraépítők között - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel, hogy vállalkozásod végre strukturált és önjáró legyen.')}
    ${createParagraph('Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.')}

    ${createButtonRow({ text: 'KEZD EL 7 NAPIG INGYEN', url: `${APP_URL}/vallalkozas/kezdolap/billing`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Üdv a Struktúraépítők között! Fedezd fel a 150+ cégépítési tartalmat.',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel, hogy vállalkozásod végre strukturált és önjáró legyen.',
      'Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.',
    ],
    ctaText: 'KEZD EL 7 NAPIG INGYEN',
    ctaUrl: `${APP_URL}/vallalkozas/kezdolap/billing`,
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
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}
