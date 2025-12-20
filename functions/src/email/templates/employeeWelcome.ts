/**
 * Employee Welcome Email Template
 * Sent when an invited employee registers and gets linked to a company
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

interface EmployeeWelcomeData {
  firstName: string;
  email: string;
  companyName?: string;
}

/**
 * Send employee welcome email
 */
export async function sendEmployeeWelcomeEmail(
  data: EmployeeWelcomeData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email } = data;

  const subject = 'Üdv a Struktúraépítők között - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel.')}
    ${createParagraph('Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.')}

    ${createButtonRow({ text: 'FELFEDEZEM', url: `${APP_URL}/dashboard`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Üdv a Struktúraépítők között! Fedezd fel a 150+ cégépítési tartalmat.',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel.',
      'Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.',
    ],
    ctaText: 'FELFEDEZEM',
    ctaUrl: `${APP_URL}/dashboard`,
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
    console.error('Failed to send employee welcome email:', error);
    return { success: false, error: error.message };
  }
}
