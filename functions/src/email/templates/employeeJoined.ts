/**
 * Employee Joined Email Template
 * Sent to company admin when an invited employee registers
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

interface EmployeeJoinedData {
  adminFirstName: string;
  adminEmail: string;
  employeeFullName: string;
}

/**
 * Send notification to admin when employee joins
 */
export async function sendEmployeeJoinedEmail(
  data: EmployeeJoinedData
): Promise<{ success: boolean; error?: string }> {
  const { adminFirstName, adminEmail, employeeFullName } = data;

  const subject = 'Munkatársad csatlakozott - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${adminFirstName}!`, 2)}
    ${createParagraph(`<strong>${employeeFullName}</strong> sikeresen beregisztrált a DMA Masterclassra.`)}
    ${createParagraph('Kalandozásait nyomon tudod követni a profilodban, a Munkatársaim menüpontban.')}

    ${createButtonRow({ text: 'MEGNÉZEM', url: `${APP_URL}/company/dashboard/employees`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `${employeeFullName} csatlakozott a csapathoz!`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${adminFirstName}!`,
    paragraphs: [
      `${employeeFullName} sikeresen beregisztrált a DMA Masterclassra.`,
      'Kalandozásait nyomon tudod követni a profilodban, a Munkatársaim menüpontban.',
    ],
    ctaText: 'MEGNÉZEM',
    ctaUrl: `${APP_URL}/company/dashboard/employees`,
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
    console.error('Failed to send employee joined email:', error);
    return { success: false, error: error.message };
  }
}
