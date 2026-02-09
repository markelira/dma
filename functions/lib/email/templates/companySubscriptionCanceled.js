"use strict";
/**
 * Company Subscription Canceled Email Template
 * Sent to company employees when the admin cancels the subscription
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCompanySubscriptionCanceledEmail = sendCompanySubscriptionCanceledEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send notification to employee when company subscription is canceled
 */
async function sendCompanySubscriptionCanceledEmail(data) {
    const { employeeFirstName, employeeEmail, companyName } = data;
    const subject = 'Bocsi, semmi személyes - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${employeeFirstName}!`, 2)}
    ${(0, base_1.createParagraph)(`A <strong>${companyName}</strong> törölte a Struktúraépítő streaming platformon az előfizetést, így a fordulónapotok után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.`)}
    ${(0, base_1.createParagraph)('Ha mégis folytatnád, akkor győzd meg a főnöködet.')}

    ${(0, base_1.createButtonRow)({ text: 'MEGGYŐZÖM', url: `${APP_URL}/dashboard`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: `A ${companyName} lemondta az előfizetést.`,
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${employeeFirstName}!`,
        paragraphs: [
            `A ${companyName} törölte a DMA Masterclass struktúraépítő streaming platformon az előfizetést, így a fordulónapotok után több kalandba már nem tudsz belevágni és elveszíted a Saját listás tartalmaidat is.`,
            'Ha mégis folytatnád, akkor győzd meg a főnöködet.',
        ],
        ctaText: 'MEGGYŐZÖM',
        ctaUrl: `${APP_URL}/dashboard`,
        signOff: 'Üdvözlettel, A DMA csapat',
    });
    try {
        const result = await (0, emailService_1.sendEmail)({
            to: employeeEmail,
            subject,
            html: htmlContent,
            text: textContent,
        });
        return result;
    }
    catch (error) {
        console.error('Failed to send company subscription canceled email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=companySubscriptionCanceled.js.map