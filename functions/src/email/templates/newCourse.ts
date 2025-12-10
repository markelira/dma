/**
 * New Course/Content Notification Email Template
 * Sent when new content is published
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

interface NewCourseData {
  firstName: string;
  email: string;
  contentTitle: string;
  contentType: 'webinar' | 'video' | 'tartalom' | string; // Dynamic type
  description?: string;
  instructorName?: string;
  contentUrl: string;
  thumbnailUrl?: string;
}

/**
 * Get Hungarian content type label
 */
function getContentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    webinar: 'Webinár',
    video: 'Videó',
    tartalom: 'Tartalom',
    course: 'Tartalom',
    lesson: 'Lecke',
  };
  return labels[type.toLowerCase()] || 'Tartalom';
}

/**
 * Send new course/content notification email
 */
export async function sendNewCourseEmail(
  data: NewCourseData
): Promise<{ success: boolean; error?: string }> {
  const { firstName, email, contentTitle, contentType, description, instructorName, contentUrl, thumbnailUrl } = data;

  const typeLabel = getContentTypeLabel(contentType);
  const subject = `Új ${typeLabel.toLowerCase()} elérhető: ${contentTitle}`;

  const content = `
    ${createHeading(`Új ${typeLabel} elérhető!`, 2)}
    ${createParagraph(`Szia <strong>${firstName}</strong>,`)}
    ${createParagraph(`Új tartalom vár rád a platformon!`)}

    <tr>
      <td style="padding: 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 12px; overflow: hidden;">
          ${thumbnailUrl ? `
          <tr>
            <td>
              <img src="${thumbnailUrl}" alt="${contentTitle}" style="width: 100%; height: auto; display: block;" />
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 20px;">
              <h3 style="font-family: Inter, sans-serif; font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">
                ${contentTitle}
              </h3>
              ${instructorName ? `
              <p style="font-family: Inter, sans-serif; font-size: 14px; color: #6B7280; margin: 0 0 12px 0;">
                ${instructorName}
              </p>
              ` : ''}
              ${description ? `
              <p style="font-family: Inter, sans-serif; font-size: 16px; line-height: 24px; color: #374151; margin: 0;">
                ${description}
              </p>
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${createButtonRow({ text: 'Megnézem', url: contentUrl, variant: 'primary' })}

    ${createParagraph('Ne hagyd ki - a legjobb tartalmak most érhetők el!', { muted: true })}
  `;

  const htmlContent = wrapInBaseTemplate(content, {
    showUnsubscribe: true, // Marketing email
    preheader: `Új ${typeLabel.toLowerCase()}: ${contentTitle} - nézd meg most!`,
  });

  const textContent = generatePlainText({
    greeting: `Szia ${firstName}!`,
    paragraphs: [
      `Új ${typeLabel.toLowerCase()} vár rád a platformon!`,
      `Cím: ${contentTitle}`,
      instructorName ? `Előadó: ${instructorName}` : '',
      description || '',
      'Ne hagyd ki - a legjobb tartalmak most érhetők el!',
    ].filter(Boolean),
    ctaText: 'Megnézem',
    ctaUrl: contentUrl,
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
    console.error('Failed to send new course email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send new content notification to multiple users
 */
export async function sendNewCourseToSubscribers(
  emails: { email: string; firstName: string }[],
  contentData: Omit<NewCourseData, 'firstName' | 'email'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Send in batches to avoid rate limiting
  const BATCH_SIZE = 10;
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(user =>
        sendNewCourseEmail({
          ...contentData,
          firstName: user.firstName,
          email: user.email,
        })
      )
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        sent++;
      } else {
        failed++;
      }
    });

    // Small delay between batches
    if (i + BATCH_SIZE < emails.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return { sent, failed };
}
