/**
 * Trial Ending Email Template
 * Sent 3 days before trial ends
 */

import { sendEmail } from '../emailService';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createButtonRow,
  createAlertBox,
  createFeatureList,
  generatePlainText,
} from './base';

const APP_URL = process.env.APP_URL || 'https://academion.hu';

interface TrialEndingData {
  firstName: string;
  email: string;
  planName: string;
  trialEndDate: string;
  daysRemaining: number;
  amount: number;
  currency: string;
  cancelUrl?: string;
}

/**
 * Format amount with currency
 */
function formatAmount(amount: number, currency: string): string {
  if (currency.toLowerCase() === 'huf') {
    return `${amount.toLocaleString('hu-HU')} Ft`;
  }
  return `${amount} ${currency.toUpperCase()}`;
}

/**
 * Send trial ending email
 */
export async function sendTrialEndingEmail(
  data: TrialEndingData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, planName, trialEndDate, daysRemaining, amount, currency, cancelUrl } = data;

  const subject = `Próbaidőszakod ${daysRemaining} nap múlva lejár`;
  const formattedAmount = formatAmount(amount, currency);
  const managementUrl = cancelUrl || `${APP_URL}/beallitasok/szamlazas`;

  const content = `
    ${createHeading(`Még ${daysRemaining} nap a próbaidőszakodból!`, 2)}
    ${createParagraph(`Szia <strong>${firstName}</strong>,`)}
    ${createParagraph(`A próbaidőszakod a <strong>${planName}</strong> csomagban <strong>${trialEndDate}</strong>-án/én lejár.`)}

    ${createAlertBox(`Ha nem mondod le, automatikusan elindul az előfizetésed és <strong>${formattedAmount}/hó</strong> kerül levonásra a megadott fizetési módról.`, 'warning')}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Amit az előfizetéssel kapsz:
        </p>
      </td>
    </tr>
    ${createFeatureList([
      'Korlátlan hozzáférés az összes prémium tartalomhoz',
      'Új tartalmak azonnal elérhetők',
      'Exkluzív közösségi hozzáférés',
      'Bármikor lemondható',
    ])}

    ${createParagraph('Folytasd a tartalmak felfedezését:')}

    ${createButtonRow({ text: 'Megnézem a tartalmakat', url: `${APP_URL}/dashboard/osszes-tartalom`, variant: 'primary' })}

    ${createParagraph(`Ha mégsem szeretnéd folytatni, <a href="${managementUrl}" style="color: #252F5B;">itt mondhatod le</a> a próbaidőszak lejárta előtt.`, { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `Próbaidőszakod ${daysRemaining} nap múlva lejár - ne maradj le!`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      `A próbaidőszakod a ${planName} csomagban ${trialEndDate}-án/én lejár.`,
      `Ha nem mondod le, automatikusan elindul az előfizetésed és ${formattedAmount}/hó kerül levonásra.`,
      'Amit az előfizetéssel kapsz:',
      '- Korlátlan hozzáférés az összes prémium tartalomhoz',
      '- Új tartalmak azonnal elérhetők',
      '- Exkluzív közösségi hozzáférés',
      '- Bármikor lemondható',
      `Ha mégsem szeretnéd folytatni, itt mondhatod le: ${managementUrl}`,
    ],
    ctaText: 'Megnézem a tartalmakat',
    ctaUrl: `${APP_URL}/dashboard/osszes-tartalom`,
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
    console.error('Failed to send trial ending email:', error);
    return { success: false, error: error.message };
  }
}
