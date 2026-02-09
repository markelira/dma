/**
 * Company Subscription Canceled Email Template
 * Sent to company employees when the admin cancels the subscription
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

interface CompanySubscriptionCanceledData {
  employeeFirstName: string;
  employeeEmail: string;
  companyName: string;
}

/**
 * Send notification to employee when company subscription is canceled
 */
export async function sendCompanySubscriptionCanceledEmail(
  data: CompanySubscriptionCanceledData
): Promise<{ success: boolean; error?: string }> {
  const { employeeFirstName, employeeEmail, companyName } = data;

  const subject = 'Bocsi, semmi személyes - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${employeeFirstName}!`, 2)}
    ${createParagraph(`A <strong>${companyName}</strong> törölte a Struktúraépítő streaming platformon az előfizetést, így a fordulónapotok után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.`)}
    ${createParagraph('Ha mégis folytatnád, akkor győzd meg a főnöködet.')}

    ${createButtonRow({ text: 'MEGGYŐZÖM', url: `${APP_URL}/dashboard`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `A ${companyName} lemondta az előfizetést.`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${employeeFirstName}!`,
    paragraphs: [
      `A ${companyName} törölte a DMA Masterclass struktúraépítő streaming platformon az előfizetést, így a fordulónapotok után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.`,
      'Ha mégis folytatnád, akkor győzd meg a főnöködet.',
    ],
    ctaText: 'MEGGYŐZÖM',
    ctaUrl: `${APP_URL}/dashboard`,
    signOff: 'Üdvözlettel, A DMA csapat',
  });

  try {
    const result = await sendEmail({
      to: employeeEmail,
      subject,
      html: htmlContent,
      text: textContent,
    });

    return result;
  } catch (error: any) {
    console.error('Failed to send company subscription canceled email:', error);
    return { success: false, error: error.message };
  }
}
