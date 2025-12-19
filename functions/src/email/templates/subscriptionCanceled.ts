/**
 * Subscription Canceled Email Template
 * Sent when user cancels their subscription or it expires
 */

import { sendEmail } from '../emailService';
import {
  wrapInBaseTemplate,
  createHeading,
  createParagraph,
  createButtonRow,
  generatePlainText,
} from './base';

const APP_URL = process.env.APP_URL || 'https://academion.hu';

interface SubscriptionCanceledData {
  firstName: string;
  email: string;
  planName: string;
  accessUntil: string;
  reactivateUrl?: string;
}

/**
 * Send subscription canceled email
 */
export async function sendSubscriptionCanceledEmail(
  data: SubscriptionCanceledData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email } = data;

  const subject = 'Itt a vége - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph('Előfizetésedet lemondtad vagy lejárt.')}
    ${createParagraph('Sajnáljuk, hogy elhagyod a fedélzetet. Előfizetésed a Struktúraépítő streaming platformon lejárt, így a fordulónapod után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.')}
    ${createParagraph('Ha mégis folytatnád, akkor kattints a gombra.')}

    ${createButtonRow({ text: 'FOLYTATOM', url: `${APP_URL}/subscribe/start`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Előfizetésed lejárt - folytasd a kalandot!',
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      'Előfizetésedet lemondtad vagy lejárt.',
      'Sajnáljuk, hogy elhagyod a fedélzetet. Előfizetésed a Struktúraépítő streaming platformon lejárt, így a fordulónapod után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.',
      'Ha mégis folytatnád, akkor kattints a gombra.',
    ],
    ctaText: 'FOLYTATOM',
    ctaUrl: `${APP_URL}/subscribe/start`,
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
    console.error('Failed to send subscription canceled email:', error);
    return { success: false, error: error.message };
  }
}
