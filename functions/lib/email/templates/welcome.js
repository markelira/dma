"use strict";
/**
 * Welcome Email Template
 * Sent after successful registration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://academion.hu';
/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(data) {
    const { firstName, email } = data;
    const subject = 'Üdv a DMA Masterclass-on!';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('Örülünk, hogy csatlakoztál a DMA Masterclass közösségéhez! Most már hozzáférsz a struktúraépítő streaming platformunkhoz.')}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Amit a platformon találsz:
        </p>
      </td>
    </tr>
    ${(0, base_1.createFeatureList)([
        'Exkluzív videós tartalmak a struktúraépítésről',
        'Gyakorlati tudás tapasztalt szakértőktől',
        'Folyamatosan bővülő tartalom könyvtár',
        'Közösség hasonló érdeklődésűekkel',
    ])}

    ${(0, base_1.createParagraph)('Kezdd el felfedezni a tartalmakat:')}

    ${(0, base_1.createButtonRow)({ text: 'Tovább a platformra', url: `${APP_URL}/dashboard`, variant: 'primary' })}

    ${(0, base_1.createParagraph)('Ha bármilyen kérdésed van, írj nekünk bátran a support@dma.hu címre.', { muted: true })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Örülünk, hogy csatlakoztál! Fedezd fel a prémium tartalmakat.',
    });
    const textContent = (0, base_1.generatePlainText)({
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
        const result = await (0, emailService_1.sendEmail)({
            to: email,
            subject,
            html: htmlContent,
            text: textContent,
        });
        return result;
    }
    catch (error) {
        console.error('Failed to send welcome email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=welcome.js.map