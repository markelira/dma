import * as sgMail from '@sendgrid/mail';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize SendGrid
const config = functions.config();
sgMail.setApiKey(config.sendgrid?.key || process.env.SENDGRID_API_KEY || '');

export interface EmailTemplate {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: any;
  attachments?: any[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export class EmailService {
  private from: string;
  private replyTo: string;
  
  constructor() {
    this.from = config.sendgrid?.from || 'noreply@elira.com';
    this.replyTo = config.sendgrid?.replyto || 'support@elira.com';
  }

  /**
   * Send email using SendGrid
   */
  async sendEmail(template: EmailTemplate): Promise<void> {
    try {
      const msg = {
        to: template.to,
        from: this.from,
        subject: template.subject,
        text: template.text || this.stripHtml(template.html),
        html: template.html,
        templateId: template.templateId,
        dynamicTemplateData: template.dynamicTemplateData,
        attachments: template.attachments,
        cc: template.cc,
        bcc: template.bcc,
        replyTo: template.replyTo || this.replyTo,
      };

      await sgMail.send(msg);
      
      // Log email sent
      await admin.firestore().collection('emailLogs').add({
        to: Array.isArray(template.to) ? template.to : [template.to],
        subject: template.subject,
        templateId: template.templateId,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });
      
      console.log('✅ Email sent successfully to:', template.to);
    } catch (error) {
      console.error('❌ Email send failed:', error);
      
      // Log failure
      await admin.firestore().collection('emailLogs').add({
        to: Array.isArray(template.to) ? template.to : [template.to],
        subject: template.subject,
        error: error.message,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'failed'
      });
      
      throw error;
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: { email: string; displayName?: string; }): Promise<void> {
    const template: EmailTemplate = {
      to: user.email,
      subject: 'Üdvözöljük az ELIRA platformon! 🎓',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Üdvözöljük az ELIRA-n! 🎉</h1>
            </div>
            <div class="content">
              <h2>Kedves ${user.displayName || 'Felhasználó'}!</h2>
              <p>Örömmel üdvözöljük az ELIRA e-learning platformon! Regisztrációja sikeresen megtörtént.</p>
              
              <h3>Mi vár Önre?</h3>
              <ul>
                <li>📚 Több mint 100 professzionális kurzus</li>
                <li>🎓 Egyetemi minőségű oktatás</li>
                <li>📜 Hivatalos tanúsítványok</li>
                <li>👨‍🏫 Tapasztalt oktatók</li>
                <li>💼 Karrier fejlesztési lehetőségek</li>
              </ul>
              
              <h3>Következő lépések:</h3>
              <ol>
                <li>Jelentkezzen be fiókjába</li>
                <li>Töltse ki profilját</li>
                <li>Böngésszen a kurzusok között</li>
                <li>Kezdje meg első kurzusát</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="https://elira.com/dashboard" class="button">Irány a műszerfal</a>
              </div>
              
              <p>Ha bármilyen kérdése van, forduljon hozzánk bizalommal:</p>
              <ul>
                <li>Email: support@elira.com</li>
                <li>Telefon: +36 1 234 5678</li>
                <li>Chat: Elérhető a platformon belül</li>
              </ul>
              
              <p>Sok sikert kívánunk a tanuláshoz!</p>
              <p><strong>Az ELIRA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 ELIRA Learning Platform. Minden jog fenntartva.</p>
              <p>Ez egy automatikus üzenet, kérjük ne válaszoljon rá.</p>
              <p><a href="https://elira.com/unsubscribe">Leiratkozás</a> | <a href="https://elira.com/privacy">Adatvédelem</a></p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await this.sendEmail(template);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const template: EmailTemplate = {
      to: email,
      subject: 'Jelszó visszaállítás - ELIRA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Jelszó visszaállítás 🔐</h1>
            </div>
            <div class="content">
              <h2>Jelszó visszaállítási kérelem</h2>
              <p>Jelszó visszaállítási kérelmet kaptunk az Ön ELIRA fiókjához.</p>
              
              <p>A jelszó visszaállításához kattintson az alábbi gombra:</p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Jelszó visszaállítása</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Fontos:</strong>
                <ul>
                  <li>Ez a link 60 percig érvényes</li>
                  <li>Egy alkalommal használható fel</li>
                  <li>Ha nem Ön kérte, hagyja figyelmen kívül ezt az emailt</li>
                </ul>
              </div>
              
              <p>Vagy másolja be ezt a linket a böngészőjébe:</p>
              <p style="background: #e9ecef; padding: 10px; word-break: break-all; font-size: 12px;">
                ${resetLink}
              </p>
              
              <p>Biztonsági okokból ezt a műveletet naplózzuk.</p>
              
              <p>Üdvözlettel,<br><strong>Az ELIRA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 ELIRA Learning Platform. Minden jog fenntartva.</p>
              <p>Ha nem Ön kérte ezt, biztonságosan figyelmen kívül hagyhatja.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await this.sendEmail(template);
  }

  /**
   * Send course enrollment confirmation
   */
  async sendEnrollmentConfirmation(
    user: { email: string; name: string },
    course: { title: string; instructor: string; startDate?: string }
  ): Promise<void> {
    const template: EmailTemplate = {
      to: user.email,
      subject: `Sikeres jelentkezés: ${course.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .course-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sikeres jelentkezés! ✅</h1>
            </div>
            <div class="content">
              <h2>Kedves ${user.name}!</h2>
              <p>Gratulálunk! Sikeresen jelentkezett a következő kurzusra:</p>
              
              <div class="course-info">
                <h3>📚 ${course.title}</h3>
                <p><strong>Oktató:</strong> ${course.instructor}</p>
                ${course.startDate ? `<p><strong>Kezdés:</strong> ${course.startDate}</p>` : ''}
              </div>
              
              <h3>Mi a következő lépés?</h3>
              <ol>
                <li>Jelentkezzen be a platformra</li>
                <li>Navigáljon a "Kurzusaim" oldalra</li>
                <li>Kezdje meg a tanulást az első leckével</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="https://elira.com/dashboard/courses" class="button">Kurzus megkezdése</a>
              </div>
              
              <h3>Tanulási tippek:</h3>
              <ul>
                <li>📅 Állítson be rendszeres tanulási időt</li>
                <li>📝 Készítsen jegyzeteket</li>
                <li>💬 Vegyen részt a fórum beszélgetésekben</li>
                <li>✅ Teljesítse a kvízeket és feladatokat</li>
              </ul>
              
              <p>Sok sikert kívánunk a tanuláshoz!</p>
              <p><strong>Az ELIRA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 ELIRA Learning Platform. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await this.sendEmail(template);
  }

  /**
   * Send quiz completion notification
   */
  async sendQuizCompletionEmail(
    user: { email: string; name: string },
    quiz: { title: string; score: number; passed: boolean; certificateUrl?: string }
  ): Promise<void> {
    const template: EmailTemplate = {
      to: user.email,
      subject: `Kvíz eredmény: ${quiz.title} - ${quiz.passed ? 'Sikeres' : 'Próbálja újra'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${quiz.passed ? '#28a745' : '#ffc107'}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .score-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .score { font-size: 48px; font-weight: bold; color: ${quiz.passed ? '#28a745' : '#ffc107'}; }
            .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${quiz.passed ? '🎉 Gratulálunk!' : '📚 Próbálja újra!'}</h1>
            </div>
            <div class="content">
              <h2>Kedves ${user.name}!</h2>
              <p>Teljesítette a(z) "${quiz.title}" kvízt.</p>
              
              <div class="score-box">
                <p>Az Ön eredménye:</p>
                <div class="score">${quiz.score}%</div>
                <p>${quiz.passed ? '✅ Sikeres teljesítés!' : '⚠️ A sikeres teljesítéshez 70% szükséges'}</p>
              </div>
              
              ${quiz.passed && quiz.certificateUrl ? `
                <h3>🏆 Tanúsítvány</h3>
                <p>Gratulálunk! Megszerezte a tanúsítványt.</p>
                <div style="text-align: center;">
                  <a href="${quiz.certificateUrl}" class="button">Tanúsítvány letöltése</a>
                </div>
              ` : ''}
              
              ${!quiz.passed ? `
                <h3>Következő lépések:</h3>
                <ul>
                  <li>Tekintse át újra a tananyagot</li>
                  <li>Nézze meg a helyes válaszokat</li>
                  <li>Próbálja újra a kvízt</li>
                </ul>
                <div style="text-align: center;">
                  <a href="https://elira.com/quiz/${quiz.title}" class="button">Kvíz újrapróbálása</a>
                </div>
              ` : ''}
              
              <p>Üdvözlettel,<br><strong>Az ELIRA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 ELIRA Learning Platform. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await this.sendEmail(template);
  }

  /**
   * Send payment receipt
   */
  async sendPaymentReceipt(
    user: { email: string; name: string },
    payment: { 
      amount: number; 
      currency: string; 
      description: string; 
      invoiceNumber: string;
      date: string;
    }
  ): Promise<void> {
    const template: EmailTemplate = {
      to: user.email,
      subject: `Számla - ${payment.invoiceNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #17a2b8; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .invoice { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .invoice-header { border-bottom: 2px solid #dee2e6; padding-bottom: 10px; margin-bottom: 20px; }
            .invoice-table { width: 100%; border-collapse: collapse; }
            .invoice-table th, .invoice-table td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }
            .total { font-size: 24px; font-weight: bold; color: #17a2b8; text-align: right; margin-top: 20px; }
            .button { display: inline-block; padding: 12px 30px; background: #17a2b8; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Köszönjük a vásárlást! 💳</h1>
            </div>
            <div class="content">
              <h2>Kedves ${user.name}!</h2>
              <p>Köszönjük vásárlását az ELIRA platformon. Mellékeljük a számlát.</p>
              
              <div class="invoice">
                <div class="invoice-header">
                  <h3>Számla</h3>
                  <p><strong>Számlaszám:</strong> ${payment.invoiceNumber}</p>
                  <p><strong>Dátum:</strong> ${payment.date}</p>
                </div>
                
                <table class="invoice-table">
                  <thead>
                    <tr>
                      <th>Megnevezés</th>
                      <th style="text-align: right;">Összeg</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${payment.description}</td>
                      <td style="text-align: right;">${payment.amount} ${payment.currency}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div class="total">
                  Végösszeg: ${payment.amount} ${payment.currency}
                </div>
              </div>
              
              <div style="text-align: center;">
                <a href="https://elira.com/invoices/${payment.invoiceNumber}" class="button">Számla letöltése PDF-ben</a>
              </div>
              
              <h3>Számlázási információk:</h3>
              <p>
                <strong>ELIRA Kft.</strong><br>
                1234 Budapest, Oktatás utca 1.<br>
                Adószám: 12345678-2-42<br>
                Cégjegyzékszám: 01-09-123456
              </p>
              
              <p>Ha kérdése van a számlával kapcsolatban, forduljon hozzánk:</p>
              <p>Email: billing@elira.com | Telefon: +36 1 234 5678</p>
              
              <p>Üdvözlettel,<br><strong>Az ELIRA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 ELIRA Learning Platform. Minden jog fenntartva.</p>
              <p>Ez a számla elektronikusan került kiállításra és érvényes aláírás nélkül.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await this.sendEmail(template);
  }

  /**
   * Send course completion certificate
   */
  async sendCertificateEmail(
    user: { email: string; name: string },
    course: { title: string; completionDate: string; certificateUrl: string }
  ): Promise<void> {
    const template: EmailTemplate = {
      to: user.email,
      subject: `🎓 Tanúsítvány - ${course.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .certificate-box { background: white; padding: 30px; border-radius: 10px; margin: 20px 0; text-align: center; border: 2px solid #ffd700; }
            .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .achievement { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Gratulálunk!</h1>
              <p style="font-size: 18px;">Sikeresen teljesítette a kurzust!</p>
            </div>
            <div class="content">
              <h2>Kedves ${user.name}!</h2>
              <p>Nagy örömmel értesítjük, hogy sikeresen teljesítette a következő kurzust:</p>
              
              <div class="certificate-box">
                <h2 style="color: #764ba2;">📜 ${course.title}</h2>
                <p><strong>Teljesítés dátuma:</strong> ${course.completionDate}</p>
                <p style="font-size: 18px; margin-top: 20px;">🏆 Hivatalos tanúsítvány</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${course.certificateUrl}" class="button">Tanúsítvány letöltése</a>
              </div>
              
              <div class="achievement">
                <h3>🎯 Elért eredmények:</h3>
                <ul>
                  <li>✅ Összes lecke teljesítve</li>
                  <li>✅ Összes kvíz sikeresen teljesítve</li>
                  <li>✅ Hivatalos tanúsítvány megszerzése</li>
                </ul>
              </div>
              
              <h3>Mit tehet a tanúsítvánnyal?</h3>
              <ul>
                <li>📄 Csatolhatja önéletrajzához</li>
                <li>💼 Feltöltheti LinkedIn profiljára</li>
                <li>🏢 Bemutathatja munkáltatójának</li>
                <li>📊 Használhatja szakmai előmenetelhez</li>
              </ul>
              
              <h3>Folytassa a tanulást!</h3>
              <p>Fedezzen fel további kurzusokat és fejlessze tovább tudását:</p>
              <div style="text-align: center;">
                <a href="https://elira.com/courses" class="button" style="background: #28a745;">További kurzusok böngészése</a>
              </div>
              
              <p>Gratulálunk még egyszer a sikeres teljesítéshez!</p>
              <p><strong>Az ELIRA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 ELIRA Learning Platform. Minden jog fenntartva.</p>
              <p>A tanúsítvány hitelességét a tanúsítvány számával ellenőrizheti weboldalunkon.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await this.sendEmail(template);
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }
}

// Export singleton instance
export const emailService = new EmailService();