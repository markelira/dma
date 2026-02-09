"use strict";
/**
 * Trial Ending Email Template
 * Sent 3 days before trial ends
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTrialEndingEmail = sendTrialEndingEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Format amount with currency
 */
function formatAmount(amount, currency) {
    if (currency.toLowerCase() === 'huf') {
        return `${amount.toLocaleString('hu-HU')} Ft`;
    }
    return `${amount} ${currency.toUpperCase()}`;
}
/**
 * Send trial ending email
 */
async function sendTrialEndingEmail(data) {
    const { firstName, email, planName, trialEndDate, daysRemaining, amount, currency, cancelUrl } = data;
    const subject = `Próbaidőszakod ${daysRemaining} nap múlva lejár`;
    const formattedAmount = formatAmount(amount, currency);
    const managementUrl = cancelUrl || `${APP_URL}/vallalkozas/kezdolap/billing`;
    const content = `
    ${(0, base_1.createHeading)(`Még ${daysRemaining} nap a próbaidőszakodból!`, 2)}
    ${(0, base_1.createParagraph)(`Szia <strong>${firstName}</strong>,`)}
    ${(0, base_1.createParagraph)(`A próbaidőszakod a <strong>${planName}</strong> csomagban <strong>${trialEndDate}</strong>-án/én lejár.`)}

    ${(0, base_1.createAlertBox)(`Ha nem mondod le, automatikusan elindul az előfizetésed és <strong>${formattedAmount}/hó</strong> kerül levonásra a megadott fizetési módról.`, 'warning')}

    <tr>
      <td style="padding: 16px 0;">
        <p style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 12px 0;">
          Amit az előfizetéssel kapsz:
        </p>
      </td>
    </tr>
    ${(0, base_1.createFeatureList)([
        'Korlátlan hozzáférés az összes prémium tartalomhoz',
        'Új tartalmak azonnal elérhetők',
        'Exkluzív közösségi hozzáférés',
        'Bármikor lemondható',
    ])}

    ${(0, base_1.createParagraph)('Folytasd a tartalmak felfedezését:')}

    ${(0, base_1.createButtonRow)({ text: 'Megnézem a tartalmakat', url: `${APP_URL}/vallalkozas/kezdolap`, variant: 'primary' })}

    ${(0, base_1.createParagraph)(`Ha mégsem szeretnéd folytatni, <a href="${managementUrl}" style="color: #252F5B;">itt mondhatod le</a> a próbaidőszak lejárta előtt.`, { muted: true })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `Próbaidőszakod ${daysRemaining} nap múlva lejár - ne maradj le!`,
    });
    const textContent = (0, base_1.generatePlainText)({
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
        ctaUrl: `${APP_URL}/vallalkozas/kezdolap`,
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
        console.error('Failed to send trial ending email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=trialEnding.js.map