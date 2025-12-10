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
  createFeatureList,
  generatePlainText,
} from './base';

const APP_URL = process.env.APP_URL || 'https://academion.hu';

interface SubscriptionStartedData {
  firstName: string;
  email: string;
  planName: string;
  trialEndDate?: string; // If there's a trial period
  isTrialing?: boolean;
}

/**
 * Send subscription started email
 */
export async function sendSubscriptionStartedEmail(
  data: SubscriptionStartedData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, planName, trialEndDate, isTrialing } = data;

  const subject = isTrialing
    ? 'Próbaidőszakod elkezdődött!'
    : 'Előfizetésed aktiválva!';

  const introText = isTrialing
    ? `Sikeresen elindult a próbaidőszakod a ${planName} csomagban. Most már teljes hozzáférésed van az összes prémium tartalomhoz!`
    : `Köszönjük, hogy előfizettél a ${planName} csomagra! Most már korlátlan hozzáférésed van az összes prémium tartalomhoz.`;

  const content = `
    ${createHeading(isTrialing ? 'Próbaidőszakod elkezdődött!' : 'Előfizetésed aktiválva!', 2)}
    ${createParagraph(`Szia <strong>${firstName}</strong>,`)}
    ${createParagraph(introText)}

    ${isTrialing && trialEndDate ? `
    <tr>
      <td style="padding: 16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: #DBEAFE; border-left: 4px solid #3B82F6; border-radius: 4px; padding: 16px;">
              <span style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 20px; color: #1E40AF;">
                A próbaidőszak lejár: <strong>${trialEndDate}</strong>. Ha addig nem mondod le, automatikusan elindul az előfizetésed.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ` : ''}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Amit most elérhetsz:
        </p>
      </td>
    </tr>
    ${createFeatureList([
      'Összes prémium videó és tartalom',
      'Exkluzív webinárok és élő adások',
      'Letölthető anyagok és sablonok',
      'Közösségi fórum hozzáférés',
    ])}

    ${createParagraph('Kezdd el felfedezni a tartalmakat:')}

    ${createButtonRow({ text: 'Megnézem a tartalmakat', url: `${APP_URL}/dashboard/osszes-tartalom`, variant: 'primary' })}

    ${createParagraph('Ha bármilyen kérdésed van, írj nekünk a support@dma.hu címre.', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: isTrialing
      ? 'Próbaidőszakod elindult - fedezd fel a tartalmakat!'
      : 'Előfizetésed aktív - korlátlan hozzáférés!',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      introText,
      isTrialing && trialEndDate
        ? `A próbaidőszak lejár: ${trialEndDate}. Ha addig nem mondod le, automatikusan elindul az előfizetésed.`
        : '',
      'Amit most elérhetsz:',
      '- Összes prémium videó és tartalom',
      '- Exkluzív webinárok és élő adások',
      '- Letölthető anyagok és sablonok',
      '- Közösségi fórum hozzáférés',
      'Ha bármilyen kérdésed van, írj nekünk a support@dma.hu címre.',
    ].filter(Boolean),
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
    console.error('Failed to send subscription started email:', error);
    return { success: false, error: error.message };
  }
}
