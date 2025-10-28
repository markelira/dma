import { EmailTemplate } from './emailService';

interface WelcomeEmailData {
  firstName: string;
  email: string;
  loginUrl: string;
}

interface CourseEnrollmentData {
  firstName: string;
  courseName: string;
  courseUrl: string;
  instructorName: string;
}

interface PasswordResetData {
  firstName: string;
  resetUrl: string;
  expiryTime: string;
}

interface CourseCompletionData {
  firstName: string;
  courseName: string;
  certificateUrl: string;
  completionDate: string;
}

interface PaymentConfirmationData {
  firstName: string;
  courseName: string;
  amount: string;
  transactionId: string;
  invoiceUrl: string;
}

interface UniversityInviteData {
  firstName: string;
  universityName: string;
  inviterName: string;
  acceptUrl: string;
  role: string;
}

export class EmailTemplates {
  static welcomeEmail(data: WelcomeEmailData): EmailTemplate {
    return {
      subject: 'Üdvözöljük az ELIRA platformon!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Üdvözöljük az ELIRA-n</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Üdvözöljük az ELIRA-n!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Kedves ${data.firstName}!</h2>
            
            <p>Örülünk, hogy csatlakozott az ELIRA online tanulási platformhoz. Itt világszínvonalú kurzusokat talál, amelyek segítik szakmai fejlődését.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">Mit tehet most?</h3>
              <ul style="padding-left: 20px;">
                <li>Böngéssze kurzus katalógusunkat</li>
                <li>Fejezze be profilját</li>
                <li>Kezdje el első kurzusát</li>
                <li>Csatlakozzon közösségünkhöz</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Bejelentkezés</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Ha kérdése van, írjon nekünk a <a href="mailto:support@elira.com">support@elira.com</a> címre.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            <p>© 2024 ELIRA Platform. Minden jog fenntartva.</p>
          </div>
        </body>
        </html>
      `,
      text: `Üdvözöljük az ELIRA platformon!

Kedves ${data.firstName}!

Örülünk, hogy csatlakozott az ELIRA online tanulási platformhoz. Itt világszínvonalú kurzusokat talál, amelyek segítik szakmai fejlődését.

Mit tehet most:
- Böngéssze kurzus katalógusunkat
- Fejezze be profilját
- Kezdje el első kurzusát
- Csatlakozzon közösségünkhöz

Bejelentkezés: ${data.loginUrl}

Ha kérdése van, írjon nekünk a support@elira.com címre.

© 2024 ELIRA Platform. Minden jog fenntartva.`
    };
  }

  static courseEnrollmentEmail(data: CourseEnrollmentData): EmailTemplate {
    return {
      subject: `Sikeresen beiratkozott: ${data.courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kurzus beiratkozás</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Sikeres beiratkozás!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Kedves ${data.firstName}!</h2>
            
            <p>Sikeresen beiratkozott a következő kurzusra:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #4facfe;">
              <h3 style="margin-top: 0; color: #4facfe;">${data.courseName}</h3>
              <p style="margin: 10px 0;"><strong>Oktató:</strong> ${data.instructorName}</p>
            </div>
            
            <p>Most már hozzáférhet a kurzus tartalmához és megkezdheti tanulását.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.courseUrl}" style="background: #4facfe; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Kurzus megkezdése</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Jó tanulást kívánunk!
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Sikeres beiratkozás!

Kedves ${data.firstName}!

Sikeresen beiratkozott a következő kurzusra:
${data.courseName}
Oktató: ${data.instructorName}

Most már hozzáférhet a kurzus tartalmához és megkezdheti tanulását.

Kurzus megkezdése: ${data.courseUrl}

Jó tanulást kívánunk!`
    };
  }

  static passwordResetEmail(data: PasswordResetData): EmailTemplate {
    return {
      subject: 'Jelszó visszaállítás - ELIRA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Jelszó visszaállítás</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">Jelszó visszaállítás</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Kedves ${data.firstName}!</h2>
            
            <p>Jelszó visszaállítási kérelmet kaptunk az Ön fiókjához.</p>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>Biztonsági megjegyzés:</strong> Ez a link ${data.expiryTime} múlva lejár.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Jelszó visszaállítása</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Ha nem Ön kérte a jelszó visszaállítást, kérjük hagyja figyelmen kívül ezt az emailt.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Jelszó visszaállítás - ELIRA

Kedves ${data.firstName}!

Jelszó visszaállítási kérelmet kaptunk az Ön fiókjához.

Biztonsági megjegyzés: Ez a link ${data.expiryTime} múlva lejár.

Jelszó visszaállítása: ${data.resetUrl}

Ha nem Ön kérte a jelszó visszaállítást, kérjük hagyja figyelmen kívül ezt az emailt.`
    };
  }

  static courseCompletionEmail(data: CourseCompletionData): EmailTemplate {
    return {
      subject: `Gratulálunk! Elvégezte: ${data.courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Kurzus elvégzése</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">🎉 Gratulálunk!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Kedves ${data.firstName}!</h2>
            
            <p>Sikeresen elvégezte a következő kurzust:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #28a745;">
              <h3 style="margin-top: 0; color: #28a745;">${data.courseName}</h3>
              <p style="margin: 10px 0;"><strong>Elvégzés dátuma:</strong> ${data.completionDate}</p>
            </div>
            
            <p>Büszkék vagyunk teljesítményére! Most letöltheti oklevélét.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.certificateUrl}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Oklevél letöltése</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Ossza meg eredményét a LinkedIn-en és mutassa meg szakmai fejlődését!
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Gratulálunk! Elvégezte: ${data.courseName}

Kedves ${data.firstName}!

Sikeresen elvégezte a következő kurzust:
${data.courseName}
Elvégzés dátuma: ${data.completionDate}

Büszkék vagyunk teljesítményére! Most letöltheti oklevélét.

Oklevél letöltése: ${data.certificateUrl}

Ossza meg eredményét a LinkedIn-en és mutassa meg szakmai fejlődését!`
    };
  }

  static paymentConfirmationEmail(data: PaymentConfirmationData): EmailTemplate {
    return {
      subject: 'Fizetés megerősítés - ELIRA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fizetés megerősítés</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Fizetés megerősítve</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Kedves ${data.firstName}!</h2>
            
            <p>Sikeresen feldolgoztuk fizetését a következő kurzushoz:</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">${data.courseName}</h3>
              <p style="margin: 10px 0;"><strong>Összeg:</strong> ${data.amount}</p>
              <p style="margin: 10px 0;"><strong>Tranzakció ID:</strong> ${data.transactionId}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.invoiceUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Számla letöltése</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Köszönjük vásárlását! Most már hozzáférhet a kurzushoz.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Fizetés megerősítés - ELIRA

Kedves ${data.firstName}!

Sikeresen feldolgoztuk fizetését a következő kurzushoz:
${data.courseName}
Összeg: ${data.amount}
Tranzakció ID: ${data.transactionId}

Számla letöltése: ${data.invoiceUrl}

Köszönjük vásárlását! Most már hozzáférhet a kurzushoz.`
    };
  }

  static universityInviteEmail(data: UniversityInviteData): EmailTemplate {
    return {
      subject: `Meghívás: ${data.universityName} - ELIRA Platform`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Egyetemi meghívó</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">Meghívás érkezet!</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Kedves ${data.firstName}!</h2>
            
            <p>${data.inviterName} meghívta Önt, hogy csatlakozzon a(z) <strong>${data.universityName}</strong> intézményhez az ELIRA platformon.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b;">
              <h3 style="margin-top: 0; color: #ff6b6b;">Szerepkör: ${data.role}</h3>
              <p style="margin: 10px 0;"><strong>Meghívó:</strong> ${data.inviterName}</p>
              <p style="margin: 10px 0;"><strong>Intézmény:</strong> ${data.universityName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.acceptUrl}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Meghívás elfogadása</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Ez a meghívás 7 napig érvényes. Ha nem fogadja el, automatikusan lejár.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Meghívás: ${data.universityName} - ELIRA Platform

Kedves ${data.firstName}!

${data.inviterName} meghívta Önt, hogy csatlakozzon a(z) ${data.universityName} intézményhez az ELIRA platformon.

Szerepkör: ${data.role}
Meghívó: ${data.inviterName}
Intézmény: ${data.universityName}

Meghívás elfogadása: ${data.acceptUrl}

Ez a meghívás 7 napig érvényes. Ha nem fogadja el, automatikusan lejár.`
    };
  }
}

export {
  WelcomeEmailData,
  CourseEnrollmentData,
  PasswordResetData,
  CourseCompletionData,
  PaymentConfirmationData,
  UniversityInviteData
};