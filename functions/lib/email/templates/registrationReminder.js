"use strict";
/**
 * Registration Reminder Email Template
 * Sent to company admins who registered 7 days ago but haven't subscribed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRegistrationReminderEmail = sendRegistrationReminderEmail;
const emailService_1 = require("../emailService");
const base_1 = require("./base");
const APP_URL = process.env.APP_URL || 'https://masterclass.dma.hu';
/**
 * Send 7-day registration reminder email
 */
async function sendRegistrationReminderEmail(data) {
    const { email } = data;
    const subject = 'Hét nap telt el, és kezdünk aggódni - DMA Masterclass';
    const content = `
    ${(0, base_1.createHeading)('Hé Struktúraépítő!', 2)}
    ${(0, base_1.createParagraph)('Egy hete regisztráltál és azóta csend van. Kezdjük úgy érezni magunkat, mint akit egy első randi után faképnél hagytak.')}
    ${(0, base_1.createParagraph)('Pedig 150+ cégépítési tartalom vár rád, olyan módszerek és rendszerek, amik holnaptól már működnének a cégedben. 7 napig ingyen kipróbálhatod és ha hozzáadsz 5 munkatársat, akkor fejenként 2.500 Ft-ért juthattok hozzá a struktúraépítési tartalmainkhoz.')}
    ${(0, base_1.createParagraph)('Tudod mi a különbség közted és azok között, akik már elindultak? Ők 7 nappal járnak előtted. Ne hagyd, hogy ez a különbség még nagyobb legyen.')}

    ${(0, base_1.createButtonRow)({ text: 'VÁGJ BELE MOST', url: `${APP_URL}/vallalkozas/kezdolap/billing`, variant: 'primary' })}
  `;
    const htmlContent = (0, base_1.wrapInBaseTemplate)(content, {
        showUnsubscribe: true,
        preheader: 'Egy hete regisztráltál - ideje belevágni!',
    });
    const textContent = (0, base_1.generatePlainText)({
        greeting: 'Hé Struktúraépítő!',
        paragraphs: [
            'Egy hete regisztráltál és azóta csend van. Kezdjük úgy érezni magunkat, mint akit egy első randi után faképnél hagytak.',
            'Pedig 150+ cégépítési tartalom vár rád, olyan módszerek és rendszerek, amik holnaptól már működnének a cégedben. 7 napig ingyen kipróbálhatod és ha hozzáadsz 5 munkatársat, akkor fejenként 2.500 Ft-ért juthattok hozzá a struktúraépítési tartalmainkhoz.',
            'Tudod mi a különbség közted és azok között, akik már elindultak? Ők 7 nappal járnak előtted. Ne hagyd, hogy ez a különbség még nagyobb legyen.',
        ],
        ctaText: 'VÁGJ BELE MOST',
        ctaUrl: `${APP_URL}/vallalkozas/kezdolap/billing`,
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
        console.error('Failed to send registration reminder email:', error);
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=registrationReminder.js.map