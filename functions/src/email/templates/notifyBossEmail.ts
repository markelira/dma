/**
 * Notify Boss Email Template
 * Sent when a company employee requests their boss to subscribe
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

interface NotifyBossEmailData {
  adminFirstName: string;
  adminEmail: string;
  employeeFullName: string;
}

/**
 * Send notify boss email when employee requests subscription
 */
export async function sendNotifyBossEmail(
  data: NotifyBossEmailData
): Promise<{ success: boolean; error?: string }> {
  const { adminFirstName, adminEmail, employeeFullName } = data;

  const subject = 'Fizetésnap - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${adminFirstName}!`, 2)}
    ${createParagraph(`${employeeFullName} munkatársad szeretné, ha előfizetnél a Struktúraépítő streaming platformon, hogy tovább tudja folytatni a kalandjait. Ne vedd el tőlük a lehetőséget, hogy hozzájáruljanak ahhoz, hogy struktúrált és önjáró vállalkozásotok legyen.`)}
    ${createParagraph('Itt a fizetésnap, irány a DMA Masterclass!')}

    ${createButtonRow({ text: 'ELŐFIZETEK', url: `${APP_URL}/company/dashboard/billing`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `${employeeFullName} munkatársad szeretne hozzáférni a DMA tartalmakhoz.`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${adminFirstName}!`,
    paragraphs: [
      `${employeeFullName} munkatársad szeretné, ha előfizetnél a Struktúraépítő streaming platformon, hogy tovább tudja folytatni a kalandjait. Ne vedd el tőlük a lehetőséget, hogy hozzájáruljanak ahhoz, hogy struktúrált és önjáró vállalkozásotok legyen.`,
      'Itt a fizetésnap, irány a DMA Masterclass!',
    ],
    ctaText: 'ELŐFIZETEK',
    ctaUrl: `${APP_URL}/company/dashboard/billing`,
    signOff: 'Üdvözlettel, A DMA csapat',
  });

  try {
    const result = await sendEmail({
      to: adminEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to send notify boss email:', error);
    return { success: false, error: error.message };
  }
}
