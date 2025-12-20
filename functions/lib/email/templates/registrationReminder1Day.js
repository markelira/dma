"use strict";
/**
 * 1-Day Registration Reminder Email Template
 * Sent to company admins who registered 1 day ago but haven't subscribed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRegistrationReminder1DayEmail = sendRegistrationReminder1DayEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send 1-day registration reminder email
 */
async function sendRegistrationReminder1DayEmail(data) {
    const { email } = data;
    const subject = 'RE: Üdv a Struktúraépítők között - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)('Hé Struktúraépítő!', 2)}
    ${(0, base_1.createParagraph)('Regisztrációdkor azt gondoltuk, hogy tényleg belevágsz életed kalandjába. Most viszont szomorúan látjuk, hogy még nem kezdtél bele.')}
    ${(0, base_1.createParagraph)('Lehet csak egy kis biztatásra van szükséged. A 150+ cégépítési tartalmat 20 év tapasztalatából raktuk össze, hogy olyan módszereket és rendszereket kaphass, amik már holnaptól működnek. 7 napig ingyen kipróbálhatod és ha hozzáadsz 5 munkatársat, akkor fejenként 2.500 Ft-ért juthattok hozzá a struktúraépítési tartalmainkhoz.')}
    ${(0, base_1.createParagraph)('Vágj bele még ma!')}

    ${(0, base_1.createButtonRow)({ text: 'BELEVÁGOK', url: `${APP_URL}/company/dashboard/billing`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Tegnap regisztráltál - ideje belevágni!',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: 'Hé Struktúraépítő!',
        paragraphs: [
            'Regisztrációdkor azt gondoltuk, hogy tényleg belevágsz életed kalandjába. Most viszont szomorúan látjuk, hogy még nem kezdtél bele.',
            'Lehet csak egy kis biztatásra van szükséged. A 150+ cégépítési tartalmat 20 év tapasztalatából raktuk össze, hogy olyan módszereket és rendszereket kaphass, amik már holnaptól működnek. 7 napig ingyen kipróbálhatod és ha hozzáadsz 5 munkatársat, akkor fejenként 2.500 Ft-ért juthattok hozzá a struktúraépítési tartalmainkhoz.',
            'Vágj bele még ma!',
        ],
        ctaText: 'BELEVÁGOK',
        ctaUrl: `${APP_URL}/company/dashboard/billing`,
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
        console.error('Failed to send 1-day registration reminder email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=registrationReminder1Day.js.map