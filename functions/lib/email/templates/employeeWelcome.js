"use strict";
/**
 * Employee Welcome Email Template
 * Sent when an invited employee registers and gets linked to a company
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmployeeWelcomeEmail = sendEmployeeWelcomeEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send employee welcome email
 */
async function sendEmployeeWelcomeEmail(data) {
    const { firstName, email } = data;
    const subject = 'Üdv a Struktúraépítők között - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)(`Szia ${firstName}!`, 2)}
    ${(0, base_1.createParagraph)('A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel.')}
    ${(0, base_1.createParagraph)('Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.')}

    ${(0, base_1.createButtonRow)({ text: 'FELFEDEZEM', url: `${APP_URL}/dashboard`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Üdv a Struktúraépítők között! Fedezd fel a 150+ cégépítési tartalmat.',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: `Szia ${firstName}!`,
        paragraphs: [
            'A Struktúra építő streaming platformon több mint 150 cégépítési tartalmat fedezhetsz fel.',
            'Webinárok, Akadémiák, Masterclassok és Podcastek között kalandozhatsz, amik olyan konkrét rendszereket adnak, amiket már holnap használni tudtok. Nincs bullshit. Félrebeszélés nélkül, csak konkrét cégépítési tartalmakat kapsz.',
        ],
        ctaText: 'FELFEDEZEM',
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
        console.error('Failed to send employee welcome email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=employeeWelcome.js.map