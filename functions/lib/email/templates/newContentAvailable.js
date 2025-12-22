"use strict";
/**
 * New Content Available Email Template
 * Sent to all registered users when a new course is published
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNewContentAvailableEmail = sendNewContentAvailableEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Get Hungarian course type label
 */
function getCourseTypeLabel(type) {
    if (!type)
        return 'Tartalom';
    const labels = {
        masterclass: 'Masterclass',
        webinar: 'Webinár',
        video: 'Videó',
        course: 'Kurzus',
        podcast: 'Podcast',
        lesson: 'Lecke',
    };
    return labels[type.toLowerCase()] || 'Tartalom';
}
/**
 * Send new content notification email
 */
async function sendNewContentAvailableEmail(data) {
    const { firstName, email, courseTitle, courseId, courseType, instructorName, description, targetAudience, duration, thumbnailUrl, } = data;
    const typeLabel = getCourseTypeLabel(courseType);
    const subject = `Új ${typeLabel.toLowerCase()} elérhető: ${courseTitle}`;
    const courseUrl = `${APP_URL}/courses/${courseId}`;
    // Build content card with all details
    let contentCard = `
    <tr>
      <td style="padding: 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F9FAFB; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB;">
  `;
    // Thumbnail
    if (thumbnailUrl) {
        contentCard += `
          <tr>
            <td>
              <img src="${thumbnailUrl}" alt="${courseTitle}" style="width: 100%; height: auto; display: block; max-height: 200px; object-fit: cover;" />
            </td>
          </tr>
    `;
    }
    // Content details
    contentCard += `
          <tr>
            <td style="padding: 20px;">
              <!-- Type badge -->
              <span style="display: inline-block; background: #252F5B; color: white; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                ${typeLabel}
              </span>

              <!-- Title -->
              <h3 style="font-family: Inter, sans-serif; font-size: 20px; font-weight: 700; color: #111827; margin: 12px 0 8px 0;">
                ${courseTitle}
              </h3>
  `;
    // Instructor
    if (instructorName) {
        contentCard += `
              <p style="font-family: Inter, sans-serif; font-size: 14px; color: #6B7280; margin: 0 0 12px 0;">
                👨‍🏫 ${instructorName}
              </p>
    `;
    }
    // Description
    if (description) {
        const shortDescription = description.length > 200
            ? description.substring(0, 200) + '...'
            : description;
        contentCard += `
              <p style="font-family: Inter, sans-serif; font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 16px 0;">
                ${shortDescription}
              </p>
    `;
    }
    // Meta info row (target audience, duration)
    if (targetAudience || duration) {
        contentCard += `
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 12px;">
                <tr>
    `;
        if (targetAudience) {
            contentCard += `
                  <td style="padding-right: 20px;">
                    <span style="font-family: Inter, sans-serif; font-size: 13px; color: #6B7280;">
                      🎯 ${targetAudience}
                    </span>
                  </td>
      `;
        }
        if (duration) {
            contentCard += `
                  <td>
                    <span style="font-family: Inter, sans-serif; font-size: 13px; color: #6B7280;">
                      ⏱️ ${duration}
                    </span>
                  </td>
      `;
        }
        contentCard += `
                </tr>
              </table>
    `;
    }
    contentCard += `
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)(`Új ${typeLabel.toLowerCase()} érhető el a Struktúraépítő streaming platformon!`)}

    ${contentCard}

    ${(0, base_1.createButtonRow)({ text: 'MEGNÉZEM', url: courseUrl, variant: 'primary' })}

    ${(0, base_1.createParagraph)('Ne hagyd ki a lehetőséget, hogy fejlődj és építsd a vállalkozásodat!', { muted: true })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `Új ${typeLabel.toLowerCase()}: ${courseTitle}`,
    });
    // Build plain text with all details
    const textParagraphs = [
        `Új ${typeLabel.toLowerCase()} érhető el a Struktúraépítő streaming platformon!`,
        '',
        `📚 ${courseTitle}`,
    ];
    if (instructorName) {
        textParagraphs.push(`👨‍🏫 Előadó: ${instructorName}`);
    }
    if (description) {
        const shortDescription = description.length > 200
            ? description.substring(0, 200) + '...'
            : description;
        textParagraphs.push('');
        textParagraphs.push(shortDescription);
    }
    if (targetAudience) {
        textParagraphs.push(`🎯 Célközönség: ${targetAudience}`);
    }
    if (duration) {
        textParagraphs.push(`⏱️ Időtartam: ${duration}`);
    }
    textParagraphs.push('');
    textParagraphs.push('Ne hagyd ki a lehetőséget, hogy fejlődj és építsd a vállalkozásodat!');
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: textParagraphs.filter(p => p !== undefined),
        ctaText: 'MEGNÉZEM',
        ctaUrl: courseUrl,
        signOff: 'Üdvözlettel, A DMA csapat',
    });
    try {
        const result = await (0, emailService_1.sendEmail)({
            to: email,
            subject,
            html: htmlContent,
            text: textContent,
        });
        return result;
    }
    catch (error) {
        console.error('Failed to send new content available email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=newContentAvailable.js.map