/**
 * 1-Day Registration Reminder Email Template
 * Sent to company admins who registered 1 day ago but haven't subscribed
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

interface RegistrationReminder1DayData {
  email: string;
}

/**
 * Send 1-day registration reminder email
 */
export async function sendRegistrationReminder1DayEmail(
  data: RegistrationReminder1DayData
): Promise<{ success: boolean; error?: string }> {
  const { email } = data;

  const subject = 'Tegnap regisztráltál - ideje belevágni! - DMA Masterclass';

  const content = `
    ${createHeading('Hé Struktúraépítő!', 2)}
    ${createParagraph('Regisztrációdkor azt gondoltuk, hogy tényleg belevágsz életed kalandjába. Most viszont szomorúan látjuk, hogy még nem kezdtél bele.')}
    ${createParagraph('Lehet csak egy kis biztatásra van szükséged. A 150+ cégépítési tartalmat 20 év tapasztalatából raktuk össze, hogy olyan módszereket és rendszereket kaphass, amik már holnaptól működnek. 7 napig ingyen kipróbálhatod és ha hozzáadsz 5 munkatársat, akkor fejenként 2.500 Ft-ért juthattok hozzá a struktúraépítési tartalmainkhoz.')}
    ${createParagraph('Vágj bele még ma!')}

    ${createButtonRow({ text: 'BELEVÁGOK', url: `${APP_URL}/vallalkozas/kezdolap/billing`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: 'Tegnap regisztráltál - ideje belevágni!',
  });

  const textContent = generatePlainText({
    greeting: 'Hé Struktúraépítő!',
    paragraphs: [
      'Regisztrációdkor azt gondoltuk, hogy tényleg belevágsz életed kalandjába. Most viszont szomorúan látjuk, hogy még nem kezdtél bele.',
      'Lehet csak egy kis biztatásra van szükséged. A 150+ cégépítési tartalmat 20 év tapasztalatából raktuk össze, hogy olyan módszereket és rendszereket kaphass, amik már holnaptól működnek. 7 napig ingyen kipróbálhatod és ha hozzáadsz 5 munkatársat, akkor fejenként 2.500 Ft-ért juthattok hozzá a struktúraépítési tartalmainkhoz.',
      'Vágj bele még ma!',
    ],
    ctaText: 'BELEVÁGOK',
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
    console.error('Failed to send 1-day registration reminder email:', error);
    return { success: false, error: error.message };
  }
}
