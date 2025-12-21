/**
 * Inactivity Reminder Email Template
 * Sent to users who haven't logged in for over a month
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

interface InactivityReminderEmailData {
  firstName: string;
  email: string;
}

/**
 * Send inactivity reminder email to user
 */
export async function sendInactivityReminderEmail(data: InactivityReminderEmailData): Promise<{ success: boolean; error?: string }> {
  const { firstName, email } = data;

  const subject = 'Hiányzol… - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('Már egy ideje nem léptél be a Struktúraépítő streaming platformodra. Hiányoznak a közös kalandok. Ne hagyd elveszni a több mint 150 cégépítési tartalmat, vágj bele még ma egy új kalandba.')}

    ${createButtonRow({ text: 'BELEVÁGOK', url: `${APP_URL}/login`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Már egy ideje nem léptél be. Hiányoznak a közös kalandok!',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'Már egy ideje nem léptél be a Struktúraépítő streaming platformodra. Hiányoznak a közös kalandok. Ne hagyd elveszni a több mint 150 cégépítési tartalmat, vágj bele még ma egy új kalandba.',
    ],
    ctaText: 'BELEVÁGOK',
    ctaUrl: `${APP_URL}/login`,
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
    console.error('Failed to send inactivity reminder email:', error);
    return { success: false, error: error.message };
  }
}
