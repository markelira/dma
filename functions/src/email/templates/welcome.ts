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
  createFeatureList,
  generatePlainText,
} from './base';

const APP_URL = process.env.APP_URL || 'https://academion.hu';

interface WelcomeEmailData {
  firstName: string;
  email: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
  const { firstName, email } = data;

  const subject = 'Üdv a DMA Masterclass-on!';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('Örülünk, hogy csatlakoztál a DMA Masterclass közösségéhez! Most már hozzáférsz a struktúraépítő streaming platformunkhoz.')}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Amit a platformon találsz:
        </p>
      </td>
    </tr>
    ${createFeatureList([
      'Exkluzív videós tartalmak a struktúraépítésről',
      'Gyakorlati tudás tapasztalt szakértőktől',
      'Folyamatosan bővülő tartalom könyvtár',
      'Közösség hasonló érdeklődésűekkel',
    ])}

    ${createParagraph('Kezdd el felfedezni a tartalmakat:')}

    ${createButtonRow({ text: 'Tovább a platformra', url: `${APP_URL}/dashboard`, variant: 'primary' })}

    ${createParagraph('Ha bármilyen kérdésed van, írj nekünk bátran a support@dma.hu címre.', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Örülünk, hogy csatlakoztál! Fedezd fel a prémium tartalmakat.',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'Örülünk, hogy csatlakoztál a DMA Masterclass közösségéhez! Most már hozzáférsz a struktúraépítő streaming platformunkhoz.',
      'Amit a platformon találsz:',
      '- Exkluzív videós tartalmak a struktúraépítésről',
      '- Gyakorlati tudás tapasztalt szakértőktől',
      '- Folyamatosan bővülő tartalom könyvtár',
      '- Közösség hasonló érdeklődésűekkel',
      'Ha bármilyen kérdésed van, írj nekünk bátran a support@dma.hu címre.',
    ],
    ctaText: 'Tovább a platformra',
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
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
}
