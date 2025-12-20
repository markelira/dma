/**
 * New Content Available Email Template
 * Sent to all registered users when a new course is published
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

interface NewContentAvailableData {
  firstName: string;
  email: string;
  courseTitle: string;
  courseId: string;
}

/**
 * Send new content notification email
 */
export async function sendNewContentAvailableEmail(
  data: NewContentAvailableData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, courseTitle, courseId } = data;

  const subject = 'Új tartalom elérhető - DMA Masterclass';

  const content = `
    ${createHeading(`Szia ${firstName}!`, 2)}
    ${createParagraph(`A Struktúraépítő streaming platformon egy új tartalom elérhető számodra: <strong>${courseTitle}</strong>`)}

    ${createButtonRow({ text: 'KALAND ELINDÍTÁSA', url: `${APP_URL}/courses/${courseId}`, variant: 'primary' })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true,
    preheader: `Új tartalom: ${courseTitle}`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      `A Struktúraépítő streaming platformon egy új tartalom elérhető számodra: ${courseTitle}`,
    ],
    ctaText: 'KALAND ELINDÍTÁSA',
    ctaUrl: `${APP_URL}/courses/${courseId}`,
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
    console.error('Failed to send new content available email:', error);
    return { success: false, error: error.message };
  }
}
