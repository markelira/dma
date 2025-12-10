"use strict";
/**
 * Base Email Template for DMA Masterclass
 *
 * Brand Colors:
 * - Primary Navy: #252F5B
 * - Fire Red: #E72B36
 * - Text Primary: #111827
 * - Text Secondary: #6B7280
 * - Background: #F9FAFB
 * - Card: #FFFFFF
 * - Border: #E5E7EB
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createButton = createButton;
exports.createDivider = createDivider;
exports.createInfoBox = createInfoBox;
exports.createFeatureList = createFeatureList;
exports.wrapInBaseTemplate = wrapInBaseTemplate;
exports.generatePlainText = generatePlainText;
exports.createHeading = createHeading;
exports.createParagraph = createParagraph;
exports.createButtonRow = createButtonRow;
exports.createCodeDisplay = createCodeDisplay;
exports.createAlertBox = createAlertBox;
const APP_URL = process.env.APP_URL || 'https://academion.hu';
// Brand colors
const colors = {
    primaryNavy: '#252F5B',
    primaryNavyLight: '#3a4a7a',
    fireRed: '#E72B36',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    background: '#F9FAFB',
    card: '#FFFFFF',
    border: '#E5E7EB',
};
/**
 * Creates a styled CTA button
 */
function createButton({ text, url, variant = 'primary' }) {
    const styles = {
        primary: { bg: colors.primaryNavy, color: '#FFFFFF', border: colors.primaryNavy },
        urgent: { bg: colors.fireRed, color: '#FFFFFF', border: colors.fireRed },
        secondary: { bg: 'transparent', color: colors.primaryNavy, border: colors.primaryNavy },
    };
    const style = styles[variant];
    return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 8px; background-color: ${style.bg}; border: 2px solid ${style.border};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: ${style.color}; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}
/**
 * Creates a horizontal divider
 */
function createDivider() {
    return `
    <tr>
      <td style="padding: 24px 0;">
        <hr style="border: none; border-top: 1px solid ${colors.border}; margin: 0;" />
      </td>
    </tr>
  `;
}
/**
 * Creates an info box (for codes, highlights, etc.)
 */
function createInfoBox(content, backgroundColor = colors.primaryNavy) {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background: ${backgroundColor}; border-radius: 12px; padding: 24px; text-align: center;">
          ${content}
        </td>
      </tr>
    </table>
  `;
}
/**
 * Creates a feature list with checkmarks
 */
function createFeatureList(features) {
    return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      ${features.map(feature => `
        <tr>
          <td style="padding: 8px 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 24px; color: ${colors.textPrimary};">
            <span style="color: ${colors.primaryNavy}; margin-right: 12px;">✓</span>
            ${feature}
          </td>
        </tr>
      `).join('')}
    </table>
  `;
}
/**
 * Wraps email content in the base template with header and footer
 */
function wrapInBaseTemplate(content, options = {}) {
    const { showUnsubscribe = true, preheader = '' } = options;
    const preheaderHtml = preheader ? `
    <div style="display: none; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #ffffff;">
      ${preheader}
    </div>
  ` : '';
    const unsubscribeHtml = showUnsubscribe ? `
    <tr>
      <td style="padding-top: 16px;">
        <a href="${APP_URL}/beallitasok/ertesitesek" style="color: ${colors.textTertiary}; font-size: 14px; text-decoration: underline;">
          Leiratkozás
        </a>
        <span style="color: ${colors.textTertiary}; margin: 0 8px;">|</span>
        <a href="${APP_URL}/beallitasok" style="color: ${colors.textTertiary}; font-size: 14px; text-decoration: underline;">
          Beállítások
        </a>
      </td>
    </tr>
  ` : '';
    return `
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>DMA Masterclass</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .content-padding { padding: 24px !important; }
      .mobile-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  ${preheaderHtml}

  <!-- Email Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Main Email Card -->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${colors.card}; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primaryNavy} 0%, ${colors.primaryNavyLight} 100%); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.01em;">
                DMA Masterclass
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: ${colors.border};">
                Struktúraépítő streaming platform
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content-padding" style="padding: 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${content}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center; border-top: 1px solid ${colors.border};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 20px; color: ${colors.textSecondary};">
                    © DMA ponthu Kft. - ${new Date().getFullYear()} - Minden jog fenntartva.
                  </td>
                </tr>
                <tr>
                  <td style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 20px; color: ${colors.textTertiary}; padding-top: 4px;">
                    DMA Masterclass - struktúraépítő streaming platform
                  </td>
                </tr>
                ${unsubscribeHtml}
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
/**
 * Generates plain text version of email for fallback
 */
function generatePlainText(content) {
    const lines = [];
    if (content.greeting) {
        lines.push(content.greeting);
        lines.push('');
    }
    content.paragraphs.forEach(p => {
        lines.push(p);
        lines.push('');
    });
    if (content.ctaText && content.ctaUrl) {
        lines.push(`${content.ctaText}: ${content.ctaUrl}`);
        lines.push('');
    }
    if (content.signOff) {
        lines.push(content.signOff);
        lines.push('');
    }
    lines.push('---');
    lines.push(`© DMA ponthu Kft. - ${new Date().getFullYear()} - Minden jog fenntartva.`);
    lines.push('DMA Masterclass - struktúraépítő streaming platform');
    return lines.join('\n');
}
/**
 * Creates a heading element
 */
function createHeading(text, level = 2) {
    const sizes = { 1: '24px', 2: '20px', 3: '18px' };
    return `
    <tr>
      <td style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: ${sizes[level]}; font-weight: 700; color: ${colors.textPrimary}; padding-bottom: 16px; letter-spacing: -0.01em;">
        ${text}
      </td>
    </tr>
  `;
}
/**
 * Creates a paragraph element
 */
function createParagraph(text, options = {}) {
    const color = options.muted ? colors.textSecondary : colors.textPrimary;
    return `
    <tr>
      <td style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 24px; color: ${color}; padding-bottom: 16px;">
        ${text}
      </td>
    </tr>
  `;
}
/**
 * Creates a button row
 */
function createButtonRow(button) {
    return `
    <tr>
      <td>
        ${createButton(button)}
      </td>
    </tr>
  `;
}
/**
 * Creates a code display (for OTP, etc.)
 */
function createCodeDisplay(code) {
    return `
    <tr>
      <td style="padding: 24px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.primaryNavy} 0%, ${colors.primaryNavyLight} 100%); border-radius: 12px; padding: 24px; text-align: center;">
              <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; color: #FFFFFF; letter-spacing: 8px;">
                ${code}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}
/**
 * Creates an alert/warning box
 */
function createAlertBox(text, variant = 'info') {
    const colors_map = {
        warning: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
        info: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
        error: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
    };
    const style = colors_map[variant];
    return `
    <tr>
      <td style="padding: 16px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${style.bg}; border-left: 4px solid ${style.border}; border-radius: 4px; padding: 16px;">
              <span style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 20px; color: ${style.text};">
                ${text}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}
//# sourceMappingURL=base.js.map