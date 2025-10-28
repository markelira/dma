# DMA Platform - Kritikus Hibák Azonnali Javítási Terve

## 🚨 VÉGREHAJTÁSI SORREND: 8 NAP ALATT

---

## NAP 1: BIZTONSÁGI KRÍZIS MEGOLDÁSA (4-6 óra)

### 1.1 API Kulcsok Azonnali Rotálása és Biztonságba Helyezése

#### Lépés 1: Stripe kulcsok rotálása
```bash
# 1. Lépj be a Stripe Dashboard-ba: https://dashboard.stripe.com
# 2. Navigálj: Developers → API keys
# 3. Roll all keys → Generate new keys
# 4. Mentsd el az új kulcsokat biztonságos helyre
```

#### Lépés 2: Mux kulcsok rotálása
```bash
# 1. Lépj be Mux Dashboard: https://dashboard.mux.com
# 2. Settings → API Access Tokens
# 3. Revoke existing tokens
# 4. Create new access token
```

#### Lépés 3: Git history tisztítása
```bash
# FONTOS: Készíts biztonsági mentést először!
git clone --mirror https://github.com/yourusername/elira.git
cd elira.git

# BFG Repo-Cleaner telepítése és használata
brew install bfg  # Mac
# vagy töltsd le: https://rtyley.github.io/bfg-repo-cleaner/

# Távolítsd el a .env fájlokat a történelemből
bfg --delete-files .env
bfg --delete-files .env.local
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

#### Lépés 4: .gitignore frissítése
```bash
# Fájl: /.gitignore
echo "
# Environment files
.env
.env.*
!.env.example
functions/.env
functions/.env.*
!functions/.env.example
" >> .gitignore

git add .gitignore
git commit -m "🔒 Add comprehensive env file exclusions"
```

#### Lépés 5: Környezeti változók beállítása Firebase-ben
```bash
# Production környezeti változók beállítása
firebase functions:config:set \
  stripe.secret_key="új_production_stripe_secret_key" \
  stripe.webhook_secret="új_stripe_webhook_secret" \
  stripe.monthly_price_id="price_xxxxxx" \
  mux.token_id="új_mux_token_id" \
  mux.token_secret="új_mux_token_secret" \
  mux.webhook_secret="új_mux_webhook_secret" \
  email.sendgrid_api_key="sendgrid_api_key_lesz_később"

# Ellenőrzés
firebase functions:config:get
```

#### Lépés 6: .env.example fájlok létrehozása
```bash
# Fájl: /.env.example
cat > .env.example << 'EOF'
# Frontend Configuration
NEXT_PUBLIC_APP_NAME=DMA Learning Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxx

# Never commit real values!
EOF

# Fájl: /functions/.env.example
cat > functions/.env.example << 'EOF'
# Use firebase functions:config:set for production
# These are for local development only
MUX_TOKEN_ID=your_dev_mux_token
MUX_TOKEN_SECRET=your_dev_mux_secret
STRIPE_SECRET_KEY=sk_test_xxxxx
EOF
```

### 1.2 Firestore Biztonsági Szabályok Konfigurálása

```javascript
// Fájl: /firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isInstructor() {
      return hasRole('INSTRUCTOR') || hasRole('ADMIN');
    }
    
    function isAdmin() {
      return hasRole('ADMIN');
    }
    
    function isEnrolled(courseId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + courseId));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Courses collection - public read, restricted write
    match /courses/{courseId} {
      allow read: if true; // Public courses
      allow create: if isInstructor();
      allow update: if isInstructor() && (
        resource.data.instructorId == request.auth.uid || isAdmin()
      );
      allow delete: if isAdmin();
      
      // Nested modules
      match /modules/{moduleId} {
        allow read: if true;
        allow write: if isInstructor() && (
          get(/databases/$(database)/documents/courses/$(courseId)).data.instructorId == request.auth.uid || 
          isAdmin()
        );
        
        // Nested lessons
        match /lessons/{lessonId} {
          allow read: if true;
          allow write: if isInstructor() && (
            get(/databases/$(database)/documents/courses/$(courseId)).data.instructorId == request.auth.uid || 
            isAdmin()
          );
        }
      }
    }
    
    // Enrollments collection
    match /enrollments/{enrollmentId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || 
        isInstructor() || 
        isAdmin()
      );
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Lesson Progress collection
    match /lessonProgress/{progressId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      allow create, update: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow delete: if isAdmin();
    }
    
    // Quiz Results collection
    match /quizResults/{resultId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || 
        isInstructor() || 
        isAdmin()
      );
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true; // Public reviews
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid &&
        isEnrolled(request.resource.data.courseId);
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId) || isAdmin();
    }
    
    // Universities collection
    match /universities/{universityId} {
      allow read: if true; // Public
      allow write: if isAdmin();
    }
    
    // Activities collection
    match /activities/{activityId} {
      allow read: if isAuthenticated() && (
        resource.data.userId == request.auth.uid || isAdmin()
      );
      allow create: if false; // Only through Cloud Functions
      allow update, delete: if isAdmin();
    }
  }
}
```

Deploy szabályok:
```bash
firebase deploy --only firestore:rules
```

---

## NAP 2: EMAIL SZOLGÁLTATÁS IMPLEMENTÁLÁSA (6-8 óra)

### 2.1 SendGrid Integráció

#### Lépés 1: SendGrid beállítása
```bash
# 1. Regisztrálj: https://sendgrid.com
# 2. Verify domain vagy single sender
# 3. Create API Key (Full Access)
# 4. Mentsd el az API kulcsot

# Telepítés
cd functions
npm install @sendgrid/mail
```

#### Lépés 2: Email szolgáltatás implementálása
```typescript
// Fájl: /functions/src/emailService.ts
import * as sgMail from '@sendgrid/mail';
import * as functions from 'firebase-functions';

// Initialize SendGrid
const SENDGRID_API_KEY = functions.config().email?.sendgrid_api_key;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const FROM_EMAIL = 'noreply@dma.hu';
const FROM_NAME = 'DMA Platform';

export interface EmailTemplate {
  to: string;
  subject: string;
  templateId?: string;
  dynamicData?: Record<string, any>;
  html?: string;
  text?: string;
}

/**
 * Send email using SendGrid
 */
export async function sendEmail(template: EmailTemplate): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️ SendGrid not configured, skipping email send');
    return;
  }

  try {
    const msg = {
      to: template.to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject: template.subject,
      ...(template.templateId ? {
        templateId: template.templateId,
        dynamicTemplateData: template.dynamicData
      } : {
        html: template.html || '',
        text: template.text || ''
      })
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${template.to}`);
  } catch (error) {
    console.error('❌ Email send failed:', error);
    throw error;
  }
}

/**
 * Email templates
 */
export const EmailTemplates = {
  // Regisztrációs megerősítés
  async sendVerificationEmail(email: string, verificationLink: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Erősítse meg email címét - DMA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 4px; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Üdvözöljük az DMA platformon!</h1>
            </div>
            <div class="content">
              <h2>Email cím megerősítése</h2>
              <p>Köszönjük a regisztrációt! Kérjük, erősítse meg email címét az alábbi gombra kattintva:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" class="button">Email cím megerősítése</a>
              </p>
              <p>Vagy másold be ezt a linket a böngésződbe:</p>
              <p style="word-break: break-all; color: #0d9488;">${verificationLink}</p>
              <p>Ez a link 24 óráig érvényes.</p>
            </div>
            <div class="footer">
              <p>© 2024 DMA Platform. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Üdvözöljük az DMA platformon!
        
        Kérjük, erősítse meg email címét az alábbi linkre kattintva:
        ${verificationLink}
        
        Ez a link 24 óráig érvényes.
        
        © 2024 DMA Platform
      `
    });
  },

  // Jelszó visszaállítás
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Jelszó visszaállítás - DMA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Jelszó visszaállítás</h1>
            </div>
            <div class="content">
              <p>Jelszó visszaállítási kérelmet kaptunk az Ön fiókjához.</p>
              <p>Az új jelszó beállításához kattintson az alábbi gombra:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" class="button">Új jelszó beállítása</a>
              </p>
              <p>Vagy másold be ezt a linket a böngésződbe:</p>
              <p style="word-break: break-all; color: #dc2626;">${resetLink}</p>
              <p><strong>Ez a link 1 óráig érvényes.</strong></p>
              <p>Ha nem Ön kérte a jelszó visszaállítást, hagyja figyelmen kívül ezt az emailt.</p>
            </div>
            <div class="footer">
              <p>© 2024 DMA Platform. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Jelszó visszaállítás
        
        Jelszó visszaállítási kérelmet kaptunk az Ön fiókjához.
        
        Az új jelszó beállításához kattintson az alábbi linkre:
        ${resetLink}
        
        Ez a link 1 óráig érvényes.
        
        Ha nem Ön kérte a jelszó visszaállítást, hagyja figyelmen kívül ezt az emailt.
        
        © 2024 DMA Platform
      `
    });
  },

  // Kurzus beiratkozás megerősítés
  async sendEnrollmentConfirmation(email: string, courseName: string, courseUrl: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: `Sikeres beiratkozás: ${courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: #0d9488; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { display: inline-block; padding: 12px 24px; background: #0d9488; color: white; text-decoration: none; border-radius: 4px; }
            .course-box { background: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sikeres beiratkozás!</h1>
            </div>
            <div class="content">
              <p>Gratulálunk! Sikeresen beiratkozott a következő kurzusra:</p>
              <div class="course-box">
                <h2>${courseName}</h2>
              </div>
              <p>Kezdje el a tanulást most:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${courseUrl}" class="button">Kurzus megnyitása</a>
              </p>
              <p>Jó tanulást kívánunk!</p>
            </div>
            <div class="footer">
              <p>© 2024 DMA Platform. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Sikeres beiratkozás!
        
        Gratulálunk! Sikeresen beiratkozott a következő kurzusra:
        ${courseName}
        
        Kezdje el a tanulást: ${courseUrl}
        
        Jó tanulást kívánunk!
        
        © 2024 DMA Platform
      `
    });
  },

  // Fizetési visszaigazolás
  async sendPaymentReceipt(email: string, courseName: string, amount: number, receiptUrl: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: `Fizetési visszaigazolás - ${courseName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; }
            .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sikeres fizetés!</h1>
            </div>
            <div class="content">
              <div class="receipt">
                <h2>Fizetési részletek</h2>
                <p><strong>Kurzus:</strong> ${courseName}</p>
                <p><strong>Összeg:</strong> <span class="amount">${amount.toLocaleString('hu-HU')} Ft</span></p>
                <p><strong>Dátum:</strong> ${new Date().toLocaleDateString('hu-HU')}</p>
              </div>
              <p style="text-align: center;">
                <a href="${receiptUrl}" class="button">Számla letöltése</a>
              </p>
            </div>
            <div class="footer">
              <p>© 2024 DMA Platform. Minden jog fenntartva.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Sikeres fizetés!
        
        Fizetési részletek:
        Kurzus: ${courseName}
        Összeg: ${amount.toLocaleString('hu-HU')} Ft
        Dátum: ${new Date().toLocaleDateString('hu-HU')}
        
        Számla letöltése: ${receiptUrl}
        
        © 2024 DMA Platform
      `
    });
  }
};
```

#### Lépés 3: Firebase config frissítése
```bash
firebase functions:config:set email.sendgrid_api_key="SG.xxxxxxxxxx"
firebase deploy --only functions
```

---

## NAP 3: AUTHENTICATION RENDSZER JAVÍTÁSA (6-8 óra)

### 3.1 Email Verification Implementálása

```typescript
// Fájl: /functions/src/authActions.ts - FRISSÍTÉS
import { EmailTemplates } from './emailService';

// Frissítsd a register funkciót
export const register = onCall(async (request) => {
  try {
    const data = registerSchema.parse(request.data);
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUserQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      throw new Error('Már létezik felhasználó ezzel az email címmel.');
    }

    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false // Start with unverified
    });

    // Generate email verification link
    const verificationLink = await auth.generateEmailVerificationLink(email, {
      url: `${functions.config().app?.url || 'http://localhost:3000'}/verify-email`
    });

    // Send verification email
    await EmailTemplates.sendVerificationEmail(email, verificationLink);

    // Create user document in Firestore
    const userData = {
      id: userRecord.uid,
      email,
      firstName,
      lastName,
      role: 'STUDENT',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await firestore.collection('users').doc(userRecord.uid).set(userData);

    // Create custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    return {
      success: true,
      user: userData,
      accessToken: customToken,
      message: 'Regisztráció sikeres! Kérjük, erősítse meg email címét.'
    };

  } catch (error: any) {
    console.error('❌ register error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});
```

### 3.2 Password Reset Implementálása

```typescript
// Fájl: /functions/src/authActions.ts - ÚJ FUNKCIÓK

const passwordResetSchema = z.object({
  email: z.string().email('Érvénytelen email cím.')
});

const confirmPasswordResetSchema = z.object({
  oobCode: z.string().min(1, 'Visszaállítási kód kötelező.'),
  newPassword: z.string().min(6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie.')
});

/**
 * Request password reset
 */
export const requestPasswordReset = onCall(async (request) => {
  try {
    const data = passwordResetSchema.parse(request.data);
    const { email } = data;

    // Check if user exists
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      // Don't reveal if email exists for security
      return {
        success: true,
        message: 'Ha létezik fiók ezzel az email címmel, küldtünk egy visszaállítási linket.'
      };
    }

    // Generate password reset link
    const resetLink = await auth.generatePasswordResetLink(email, {
      url: `${functions.config().app?.url || 'http://localhost:3000'}/reset-password`
    });

    // Send password reset email
    await EmailTemplates.sendPasswordResetEmail(email, resetLink);

    // Log password reset request
    await firestore.collection('activities').add({
      type: 'PASSWORD_RESET_REQUESTED',
      userId: userQuery.docs[0].id,
      email,
      timestamp: new Date(),
      ip: request.rawRequest.ip
    });

    return {
      success: true,
      message: 'Ha létezik fiók ezzel az email címmel, küldtünk egy visszaállítási linket.'
    };

  } catch (error: any) {
    console.error('❌ requestPasswordReset error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: 'Hiba történt a jelszó visszaállítás során.'
    };
  }
});

/**
 * Verify email address
 */
export const verifyEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Update user's email verification status
    await auth.updateUser(userId, {
      emailVerified: true
    });

    // Update Firestore
    await firestore.collection('users').doc(userId).update({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date()
    });

    return {
      success: true,
      message: 'Email cím sikeresen megerősítve!'
    };

  } catch (error: any) {
    console.error('❌ verifyEmail error:', error);
    return {
      success: false,
      error: error.message || 'Hiba történt az email megerősítés során.'
    };
  }
});

/**
 * Resend verification email
 */
export const resendVerificationEmail = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('Felhasználó nem található.');
    }

    const userData = userDoc.data();
    if (userData?.emailVerified) {
      return {
        success: false,
        error: 'Az email cím már meg van erősítve.'
      };
    }

    // Generate new verification link
    const verificationLink = await auth.generateEmailVerificationLink(userData.email, {
      url: `${functions.config().app?.url || 'http://localhost:3000'}/verify-email`
    });

    // Send verification email
    await EmailTemplates.sendVerificationEmail(userData.email, verificationLink);

    return {
      success: true,
      message: 'Megerősítő email újraküldve.'
    };

  } catch (error: any) {
    console.error('❌ resendVerificationEmail error:', error);
    return {
      success: false,
      error: error.message || 'Hiba történt az email újraküldése során.'
    };
  }
});
```

### 3.3 Frontend Password Reset Pages

```tsx
// Fájl: /src/app/(auth)/reset-password/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const requestPasswordResetFn = httpsCallable(functions, 'requestPasswordReset')
      const result = await requestPasswordResetFn({ email })
      
      if (result.data.success) {
        toast.success('Ellenőrizze email fiókját a visszaállítási linkért!')
        router.push('/login')
      } else {
        toast.error(result.data.error || 'Hiba történt')
      }
    } catch (error) {
      toast.error('Hiba történt a kérés során')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Jelszó visszaállítás</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email cím</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pelda@email.com"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Küldés...' : 'Visszaállítási link küldése'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Vissza a bejelentkezéshez
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

```tsx
// Fájl: /src/app/(auth)/verify-email/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const verifyEmailFn = httpsCallable(functions, 'verifyEmail')
        const result = await verifyEmailFn()
        
        if (result.data.success) {
          setStatus('success')
          toast.success('Email cím sikeresen megerősítve!')
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          setStatus('error')
          toast.error(result.data.error || 'Hiba történt')
        }
      } catch (error) {
        setStatus('error')
        toast.error('Hiba történt az email megerősítése során')
      }
    }

    verifyEmail()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email megerősítés</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'verifying' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
              <p>Email cím megerősítése folyamatban...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <p className="text-green-600">Email cím sikeresen megerősítve!</p>
              <p className="text-sm text-gray-600">Átirányítás a főoldalra...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto" />
              <p className="text-red-600">Hiba történt az email megerősítése során</p>
              <Button onClick={() => router.push('/login')}>
                Vissza a bejelentkezéshez
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## NAP 4: PAYMENT SYSTEM JAVÍTÁSA (6-8 óra)

### 4.1 Stripe Payment Aktiválása

```typescript
// Fájl: /functions/src/paymentActions.ts - TELJES ÚJRAÍRÁS
import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { z } from 'zod';
import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import { EmailTemplates } from './emailService';

const firestore = getFirestore();
const auth = getAuth();

// Initialize Stripe with production key
const stripeSecretKey = functions.config().stripe?.secret_key;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY is not configured');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

const APP_URL = functions.config().app?.url || 'http://localhost:3000';

// Zod schemas
const createCheckoutSessionSchema = z.object({
  courseId: z.string().min(1, 'Kurzus azonosító kötelező.'),
  priceId: z.string().optional(), // For subscription
});

const createPortalSessionSchema = z.object({
  returnUrl: z.string().url('Érvénytelen visszatérési URL'),
});

/**
 * Get or create Stripe customer
 */
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  if (!stripe) throw new Error('Stripe nincs konfigurálva');

  // Check if user already has a Stripe customer ID
  const userDoc = await firestore.collection('users').doc(userId).get();
  const userData = userDoc.data();

  if (userData?.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: userData?.email,
    name: `${userData?.firstName} ${userData?.lastName}`,
    metadata: {
      firebaseUserId: userId
    }
  });

  // Save Stripe customer ID to user document
  await firestore.collection('users').doc(userId).update({
    stripeCustomerId: customer.id,
    updatedAt: new Date()
  });

  return customer.id;
}

/**
 * Create Stripe Checkout Session for course purchase
 */
export const createCheckoutSession = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    if (!stripe) {
      throw new Error('Fizetési rendszer nincs konfigurálva.');
    }

    const userId = request.auth.uid;
    const data = createCheckoutSessionSchema.parse(request.data);
    const { courseId, priceId } = data;

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(userId);

    // If priceId provided, it's a subscription
    if (priceId) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${APP_URL}/dashboard?subscription=success`,
        cancel_url: `${APP_URL}/pricing?canceled=true`,
        metadata: {
          userId,
          type: 'subscription'
        }
      });

      return {
        success: true,
        url: session.url
      };
    }

    // Course purchase
    const courseDoc = await firestore.collection('courses').doc(courseId).get();
    if (!courseDoc.exists) {
      throw new Error('Kurzus nem található.');
    }

    const courseData = courseDoc.data();
    if (!courseData) {
      throw new Error('Kurzus adatok nem találhatók.');
    }

    // Check if already enrolled
    const enrollmentDoc = await firestore
      .collection('enrollments')
      .doc(`${userId}_${courseId}`)
      .get();

    if (enrollmentDoc.exists) {
      throw new Error('Már beiratkozott erre a kurzusra.');
    }

    // Create or get Stripe product for course
    let stripeProductId = courseData.stripeProductId;
    
    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: courseData.title,
        description: courseData.description?.substring(0, 500),
        metadata: {
          courseId,
          instructorId: courseData.instructorId
        }
      });
      
      stripeProductId = product.id;
      
      // Save product ID to course
      await firestore.collection('courses').doc(courseId).update({
        stripeProductId,
        updatedAt: new Date()
      });
    }

    // Create price for the product
    const priceAmount = courseData.priceHUF || 0;
    
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: priceAmount * 100, // Convert to smallest currency unit
      currency: 'huf',
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price: price.id,
        quantity: 1,
      }],
      success_url: `${APP_URL}/courses/${courseId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/courses/${courseId}?payment=canceled`,
      metadata: {
        userId,
        courseId,
        type: 'course'
      }
    });

    return {
      success: true,
      url: session.url
    };

  } catch (error: any) {
    console.error('❌ createCheckoutSession error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Handle Stripe webhook events
 */
export const handleStripeWebhook = onCall(async (request) => {
  try {
    const sig = request.rawRequest.headers['stripe-signature'];
    const webhookSecret = functions.config().stripe?.webhook_secret;

    if (!stripe || !webhookSecret) {
      throw new Error('Stripe webhook nincs konfigurálva');
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.rawRequest.rawBody,
        sig,
        webhookSecret
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, courseId, type } = session.metadata || {};

        if (type === 'course' && userId && courseId) {
          // Create enrollment
          const enrollmentData = {
            userId,
            courseId,
            enrolledAt: new Date(),
            status: 'ACTIVE',
            paymentStatus: 'PAID',
            stripeSessionId: session.id,
            amount: session.amount_total,
            currency: session.currency
          };

          await firestore
            .collection('enrollments')
            .doc(`${userId}_${courseId}`)
            .set(enrollmentData);

          // Get user and course data for email
          const [userDoc, courseDoc] = await Promise.all([
            firestore.collection('users').doc(userId).get(),
            firestore.collection('courses').doc(courseId).get()
          ]);

          const userData = userDoc.data();
          const courseData = courseDoc.data();

          if (userData && courseData) {
            // Send enrollment confirmation email
            await EmailTemplates.sendEnrollmentConfirmation(
              userData.email,
              courseData.title,
              `${APP_URL}/courses/${courseId}/learn`
            );

            // Send payment receipt
            if (session.amount_total) {
              await EmailTemplates.sendPaymentReceipt(
                userData.email,
                courseData.title,
                session.amount_total / 100,
                session.receipt_url || '#'
              );
            }
          }

          // Log activity
          await firestore.collection('activities').add({
            type: 'COURSE_ENROLLED',
            userId,
            courseId,
            timestamp: new Date(),
            metadata: { paymentMethod: 'stripe', amount: session.amount_total }
          });
        }

        if (type === 'subscription' && userId) {
          // Update user subscription status
          await firestore.collection('users').doc(userId).update({
            subscriptionStatus: 'ACTIVE',
            subscriptionId: session.subscription,
            subscriptionStartDate: new Date(),
            updatedAt: new Date()
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const userQuery = await firestore
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();

        if (!userQuery.empty) {
          const userId = userQuery.docs[0].id;
          
          // Update subscription status
          await firestore.collection('users').doc(userId).update({
            subscriptionStatus: 'CANCELED',
            subscriptionEndDate: new Date(subscription.ended_at * 1000),
            updatedAt: new Date()
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', paymentIntent.id);
        // TODO: Handle failed payment (send email, update status, etc.)
        break;
      }
    }

    return { success: true, received: true };

  } catch (error: any) {
    console.error('❌ handleStripeWebhook error:', error);
    return {
      success: false,
      error: error.message || 'Webhook processing failed'
    };
  }
});

/**
 * Create customer portal session for subscription management
 */
export const createPortalSession = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    if (!stripe) {
      throw new Error('Stripe nincs konfigurálva.');
    }

    const userId = request.auth.uid;
    const data = createPortalSessionSchema.parse(request.data);
    const { returnUrl } = data;

    // Get user's Stripe customer ID
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.stripeCustomerId) {
      throw new Error('Nincs aktív előfizetés.');
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      success: true,
      url: session.url
    };

  } catch (error: any) {
    console.error('❌ createPortalSession error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});
```

### 4.2 Environment Variable Frissítés

```bash
# Production Stripe setup
firebase functions:config:set \
  stripe.secret_key="sk_live_xxxxxxxxxx" \
  stripe.webhook_secret="whsec_xxxxxxxxxx" \
  stripe.monthly_price_id="price_xxxxxxxxxx" \
  app.url="https://elira.hu"

# Deploy
firebase deploy --only functions
```

---

## NAP 5: COURSE CREATION BACKEND (8 óra)

### 5.1 Course Creation Function Implementálása

```typescript
// Fájl: /functions/src/courseManageActions.ts - BŐVÍTÉS

const createCourseSchema = z.object({
  title: z.string().min(1, 'Kurzus cím kötelező').max(200),
  description: z.string().min(10, 'Leírás kötelező'),
  category: z.string().min(1, 'Kategória kötelező'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  thumbnailUrl: z.string().url().optional(),
  priceHUF: z.number().min(0),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  tags: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  language: z.string().default('hu'),
});

const deleteCourseSchema = z.object({
  courseId: z.string().min(1),
});

/**
 * Create new course
 */
export const createCourse = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;

    // Check if user is instructor or admin
    const userDoc = await firestore.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData || (userData.role !== 'INSTRUCTOR' && userData.role !== 'ADMIN')) {
      throw new Error('Nincs jogosultság kurzus létrehozásához.');
    }

    // Validate input
    const data = createCourseSchema.parse(request.data);

    // Create course document
    const courseData = {
      ...data,
      instructorId: userId,
      instructorName: `${userData.firstName} ${userData.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      reviewCount: 0,
      moduleCount: 0,
      lessonCount: 0,
      totalDuration: 0,
      isPlus: false,
      featured: false,
    };

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    courseData.slug = slug;

    // Create course
    const courseRef = await firestore.collection('courses').add(courseData);
    const courseId = courseRef.id;

    // Update with ID
    await courseRef.update({ id: courseId });

    // Log activity
    await firestore.collection('activities').add({
      type: 'COURSE_CREATED',
      userId,
      courseId,
      timestamp: new Date(),
      metadata: { title: data.title }
    });

    return {
      success: true,
      courseId,
      course: { id: courseId, ...courseData }
    };

  } catch (error: any) {
    console.error('❌ createCourse error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Delete course (soft delete)
 */
export const deleteCourse = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const data = deleteCourseSchema.parse(request.data);
    const { courseId } = data;

    // Check permissions
    const permitted = await canEdit(userId, courseId);
    if (!permitted) {
      throw new Error('Nincs jogosultság a kurzus törléséhez.');
    }

    // Check if course has active enrollments
    const enrollmentsQuery = await firestore
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .where('status', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (!enrollmentsQuery.empty) {
      throw new Error('Nem törölhető kurzus aktív beiratkozásokkal.');
    }

    // Soft delete - mark as deleted
    await firestore.collection('courses').doc(courseId).update({
      status: 'DELETED',
      deletedAt: new Date(),
      deletedBy: userId,
      updatedAt: new Date()
    });

    // Log activity
    await firestore.collection('activities').add({
      type: 'COURSE_DELETED',
      userId,
      courseId,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Kurzus sikeresen törölve.'
    };

  } catch (error: any) {
    console.error('❌ deleteCourse error:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validációs hiba',
        details: error.errors
      };
    }

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});

/**
 * Duplicate course
 */
export const duplicateCourse = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { courseId } = request.data;

    // Check permissions
    const permitted = await canEdit(userId, courseId);
    if (!permitted) {
      throw new Error('Nincs jogosultság a kurzus másolásához.');
    }

    // Get original course
    const originalDoc = await firestore.collection('courses').doc(courseId).get();
    if (!originalDoc.exists) {
      throw new Error('Eredeti kurzus nem található.');
    }

    const originalData = originalDoc.data();
    
    // Create duplicate
    const duplicateData = {
      ...originalData,
      title: `${originalData.title} - Másolat`,
      status: 'DRAFT',
      createdAt: new Date(),
      updatedAt: new Date(),
      enrollmentCount: 0,
      completionCount: 0,
      averageRating: 0,
      reviewCount: 0,
      stripeProductId: null, // Reset Stripe product
    };

    delete duplicateData.id;
    delete duplicateData.deletedAt;
    delete duplicateData.deletedBy;

    // Create new course
    const newCourseRef = await firestore.collection('courses').add(duplicateData);
    const newCourseId = newCourseRef.id;

    // Update with ID
    await newCourseRef.update({ id: newCourseId });

    // Copy modules and lessons
    const modulesSnapshot = await firestore
      .collection('courses')
      .doc(courseId)
      .collection('modules')
      .get();

    for (const moduleDoc of modulesSnapshot.docs) {
      const moduleData = moduleDoc.data();
      const newModuleRef = await firestore
        .collection('courses')
        .doc(newCourseId)
        .collection('modules')
        .add({
          ...moduleData,
          courseId: newCourseId,
          createdAt: new Date(),
          updatedAt: new Date()
        });

      // Copy lessons for this module
      const lessonsSnapshot = await firestore
        .collection('courses')
        .doc(courseId)
        .collection('modules')
        .doc(moduleDoc.id)
        .collection('lessons')
        .get();

      for (const lessonDoc of lessonsSnapshot.docs) {
        const lessonData = lessonDoc.data();
        await firestore
          .collection('courses')
          .doc(newCourseId)
          .collection('modules')
          .doc(newModuleRef.id)
          .collection('lessons')
          .add({
            ...lessonData,
            moduleId: newModuleRef.id,
            courseId: newCourseId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
    }

    return {
      success: true,
      courseId: newCourseId,
      message: 'Kurzus sikeresen másolva.'
    };

  } catch (error: any) {
    console.error('❌ duplicateCourse error:', error);
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba történt'
    };
  }
});
```

---

## NAP 6: RATE LIMITING & MONITORING (6 óra)

### 6.1 Rate Limiting Implementálása

```typescript
// Fájl: /functions/src/middleware/rateLimiter.ts
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';

const firestore = getFirestore();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<void> {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  const rateLimitKey = `${config.keyPrefix}_${userId}`;
  const rateLimitRef = firestore.collection('rateLimits').doc(rateLimitKey);

  try {
    await firestore.runTransaction(async (transaction) => {
      const doc = await transaction.get(rateLimitRef);
      
      if (!doc.exists) {
        // First request
        transaction.set(rateLimitRef, {
          requests: [now],
          updatedAt: now
        });
        return;
      }

      const data = doc.data();
      const requests = data.requests || [];
      
      // Filter out old requests outside the window
      const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart);
      
      if (recentRequests.length >= config.maxRequests) {
        throw new HttpsError(
          'resource-exhausted',
          `Túl sok kérés. Kérjük, várjon ${Math.ceil(config.windowMs / 1000)} másodpercet.`
        );
      }

      // Add current request
      recentRequests.push(now);
      
      transaction.update(rateLimitRef, {
        requests: recentRequests,
        updatedAt: now
      });
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    console.error('Rate limit error:', error);
    // Don't block on rate limit errors
  }
}

/**
 * Apply rate limiting to functions
 */
export function withRateLimit(
  fn: Function,
  config: Partial<RateLimitConfig> = {}
) {
  const defaultConfig: RateLimitConfig = {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyPrefix: fn.name,
    ...config
  };

  return async (request: any) => {
    if (request.auth?.uid) {
      await rateLimit(request.auth.uid, defaultConfig);
    } else {
      // For unauthenticated requests, use IP
      const ip = request.rawRequest.ip || 'unknown';
      await rateLimit(ip, { ...defaultConfig, maxRequests: 20 }); // Lower limit for anonymous
    }

    return fn(request);
  };
}
```

### 6.2 Error Monitoring (Sentry)

```bash
# Telepítés
cd functions
npm install @sentry/node @sentry/integrations
```

```typescript
// Fájl: /functions/src/monitoring.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import * as functions from 'firebase-functions';

// Initialize Sentry
const SENTRY_DSN = functions.config().monitoring?.sentry_dsn;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      new ProfilingIntegration(),
    ],
    environment: functions.config().app?.environment || 'development',
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

/**
 * Wrap function with error monitoring
 */
export function withMonitoring(fn: Function) {
  return async (request: any) => {
    const transaction = Sentry.startTransaction({
      op: 'function',
      name: fn.name,
    });

    Sentry.configureScope((scope) => {
      scope.setSpan(transaction);
      scope.setUser({
        id: request.auth?.uid,
        email: request.auth?.token?.email,
      });
      scope.setContext('request', {
        data: request.data,
        auth: !!request.auth,
      });
    });

    try {
      const result = await fn(request);
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      Sentry.captureException(error);
      transaction.setStatus('internal_error');
      throw error;
    } finally {
      transaction.finish();
    }
  };
}

/**
 * Log custom events
 */
export function logEvent(eventName: string, data?: any) {
  if (SENTRY_DSN) {
    Sentry.captureMessage(eventName, {
      level: 'info',
      extra: data,
    });
  }
  console.log(`📊 Event: ${eventName}`, data);
}

/**
 * Track performance metrics
 */
export function trackMetric(name: string, value: number, unit: string = 'ms') {
  if (SENTRY_DSN) {
    const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
    if (transaction) {
      transaction.setMeasurement(name, value, unit);
    }
  }
  console.log(`⏱️ Metric: ${name} = ${value}${unit}`);
}
```

### 6.3 Apply Middleware to All Functions

```typescript
// Fájl: /functions/src/index.ts - Frissítés
import { withRateLimit } from './middleware/rateLimiter';
import { withMonitoring } from './monitoring';

// Wrap all functions
export const enhancedRegister = withMonitoring(withRateLimit(register, {
  maxRequests: 5,
  windowMs: 3600000 // 1 hour for registration
}));

export const enhancedLogin = withMonitoring(withRateLimit(firebaseLogin, {
  maxRequests: 10,
  windowMs: 300000 // 5 minutes for login attempts
}));

export const enhancedCreateCourse = withMonitoring(withRateLimit(createCourse, {
  maxRequests: 10,
  windowMs: 3600000 // 10 courses per hour
}));

// Apply to all other functions...
```

---

## NAP 7: BACKUP & GDPR COMPLIANCE (6 óra)

### 7.1 Automated Backup System

```typescript
// Fájl: /functions/src/backupService.ts
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const firestore = getFirestore();
const storage = getStorage();

/**
 * Daily backup of critical data
 */
export const dailyBackup = onSchedule({
  schedule: 'every day 03:00',
  timeZone: 'Europe/Budapest',
}, async (context) => {
  try {
    const backupDate = new Date().toISOString().split('T')[0];
    const bucket = storage.bucket();

    // Collections to backup
    const collections = [
      'users',
      'courses',
      'enrollments',
      'lessonProgress',
      'quizResults',
      'reviews',
      'activities'
    ];

    for (const collectionName of collections) {
      console.log(`Backing up ${collectionName}...`);
      
      const snapshot = await firestore.collection(collectionName).get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Save to Cloud Storage
      const fileName = `backups/${backupDate}/${collectionName}.json`;
      const file = bucket.file(fileName);
      
      await file.save(JSON.stringify(data, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            backupDate,
            documentCount: data.length.toString()
          }
        }
      });

      console.log(`✅ Backed up ${data.length} documents from ${collectionName}`);
    }

    // Clean up old backups (keep last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [files] = await bucket.getFiles({ prefix: 'backups/' });
    
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      const created = new Date(metadata.timeCreated);
      
      if (created < thirtyDaysAgo) {
        await file.delete();
        console.log(`🗑️ Deleted old backup: ${file.name}`);
      }
    }

    console.log('✅ Daily backup completed successfully');

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
});

/**
 * Restore data from backup
 */
export const restoreFromBackup = onCall(async (request) => {
  try {
    // Only admins can restore
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (userData?.role !== 'ADMIN') {
      throw new Error('Nincs jogosultság a visszaállításhoz.');
    }

    const { backupDate, collectionName } = request.data;

    const bucket = storage.bucket();
    const fileName = `backups/${backupDate}/${collectionName}.json`;
    const file = bucket.file(fileName);

    const [exists] = await file.exists();
    if (!exists) {
      throw new Error('Backup fájl nem található.');
    }

    const [contents] = await file.download();
    const data = JSON.parse(contents.toString());

    // Restore data
    const batch = firestore.batch();
    let count = 0;

    for (const doc of data) {
      const { id, ...docData } = doc;
      batch.set(firestore.collection(collectionName).doc(id), docData);
      count++;

      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await batch.commit();
        batch = firestore.batch();
      }
    }

    if (count % 500 !== 0) {
      await batch.commit();
    }

    return {
      success: true,
      message: `${count} dokumentum visszaállítva.`
    };

  } catch (error: any) {
    console.error('❌ Restore failed:', error);
    return {
      success: false,
      error: error.message || 'Visszaállítás sikertelen'
    };
  }
});
```

### 7.2 GDPR Compliance Functions

```typescript
// Fájl: /functions/src/gdprActions.ts
import { onCall } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { z } from 'zod';

const firestore = getFirestore();
const auth = getAuth();
const storage = getStorage();

/**
 * Export all user data (GDPR Article 15 - Right of access)
 */
export const exportUserData = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const userData: any = { exportDate: new Date().toISOString() };

    // 1. User profile
    const userDoc = await firestore.collection('users').doc(userId).get();
    userData.profile = userDoc.data();

    // 2. Enrollments
    const enrollments = await firestore
      .collection('enrollments')
      .where('userId', '==', userId)
      .get();
    userData.enrollments = enrollments.docs.map(doc => doc.data());

    // 3. Progress
    const progress = await firestore
      .collection('lessonProgress')
      .where('userId', '==', userId)
      .get();
    userData.progress = progress.docs.map(doc => doc.data());

    // 4. Quiz results
    const quizResults = await firestore
      .collection('quizResults')
      .where('userId', '==', userId)
      .get();
    userData.quizResults = quizResults.docs.map(doc => doc.data());

    // 5. Reviews
    const reviews = await firestore
      .collection('reviews')
      .where('userId', '==', userId)
      .get();
    userData.reviews = reviews.docs.map(doc => doc.data());

    // 6. Activities
    const activities = await firestore
      .collection('activities')
      .where('userId', '==', userId)
      .get();
    userData.activities = activities.docs.map(doc => doc.data());

    // Save to storage and generate download link
    const bucket = storage.bucket();
    const fileName = `gdpr-exports/${userId}/${Date.now()}.json`;
    const file = bucket.file(fileName);

    await file.save(JSON.stringify(userData, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          userId,
          exportDate: new Date().toISOString()
        }
      }
    });

    // Generate signed URL (valid for 1 hour)
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 3600000 // 1 hour
    });

    return {
      success: true,
      downloadUrl: url,
      message: 'Adatok exportálva. A link 1 óráig érvényes.'
    };

  } catch (error: any) {
    console.error('❌ exportUserData error:', error);
    return {
      success: false,
      error: error.message || 'Export sikertelen'
    };
  }
});

/**
 * Delete all user data (GDPR Article 17 - Right to erasure)
 */
export const deleteUserData = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { confirmDelete, password } = request.data;

    if (!confirmDelete) {
      throw new Error('Törlés megerősítése szükséges.');
    }

    // Verify password
    // TODO: Implement password verification

    // Create deletion log before deleting
    await firestore.collection('deletionLogs').add({
      userId,
      deletedAt: new Date(),
      reason: 'User requested GDPR deletion',
      ip: request.rawRequest.ip
    });

    // Delete from all collections
    const collections = [
      'enrollments',
      'lessonProgress',
      'quizResults',
      'reviews',
      'activities',
      'wishlist'
    ];

    for (const collectionName of collections) {
      const snapshot = await firestore
        .collection(collectionName)
        .where('userId', '==', userId)
        .get();

      const batch = firestore.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Anonymize user profile instead of deleting (for data integrity)
    await firestore.collection('users').doc(userId).update({
      email: `deleted_${userId}@deleted.com`,
      firstName: 'Deleted',
      lastName: 'User',
      profilePictureUrl: null,
      bio: null,
      deletedAt: new Date(),
      status: 'DELETED'
    });

    // Delete from Firebase Auth
    await auth.deleteUser(userId);

    return {
      success: true,
      message: 'Fiók és minden kapcsolódó adat törölve.'
    };

  } catch (error: any) {
    console.error('❌ deleteUserData error:', error);
    return {
      success: false,
      error: error.message || 'Törlés sikertelen'
    };
  }
});

/**
 * Update consent preferences
 */
export const updateConsent = onCall(async (request) => {
  try {
    if (!request.auth) {
      throw new Error('Bejelentkezés szükséges.');
    }

    const userId = request.auth.uid;
    const { marketing, analytics, personalization } = request.data;

    await firestore.collection('users').doc(userId).update({
      consent: {
        marketing: marketing || false,
        analytics: analytics || false,
        personalization: personalization || false,
        updatedAt: new Date()
      },
      updatedAt: new Date()
    });

    return {
      success: true,
      message: 'Hozzájárulási beállítások frissítve.'
    };

  } catch (error: any) {
    console.error('❌ updateConsent error:', error);
    return {
      success: false,
      error: error.message || 'Frissítés sikertelen'
    };
  }
});
```

---

## NAP 8: CI/CD PIPELINE & FINAL DEPLOYMENT (4 óra)

### 8.1 GitHub Actions CI/CD

```yaml
# Fájl: /.github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci
          
      - name: Run tests
        run: npm test
        
      - name: Run linting
        run: npm run lint
        
      - name: Type checking
        run: npx tsc --noEmit

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci
          
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
          NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: ${{ secrets.STRIPE_MONTHLY_PRICE_ID }}
          
      - name: Build functions
        run: cd functions && npm run build

      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting,functions,firestore
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Install dependencies
        run: |
          npm ci
          cd functions && npm ci
          
      - name: Build for staging
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.STAGING_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.STAGING_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.STAGING_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.STAGING_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.STAGING_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.STAGING_FIREBASE_APP_ID }}
          
      - name: Deploy to staging
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only hosting:staging
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
          PROJECT_ID: ${{ secrets.STAGING_FIREBASE_PROJECT_ID }}
```

### 8.2 Environment Setup Script

```bash
# Fájl: /scripts/setup-production.sh
#!/bin/bash

echo "🚀 Setting up DMA production environment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed. Installing...${NC}"
    npm install -g firebase-tools
fi

# Login to Firebase
echo -e "${YELLOW}Logging in to Firebase...${NC}"
firebase login

# Select project
echo -e "${YELLOW}Select your Firebase project:${NC}"
firebase use --add

# Set production config
echo -e "${GREEN}Setting production configuration...${NC}"

read -p "Enter Stripe Secret Key: " STRIPE_SECRET
read -p "Enter Stripe Webhook Secret: " STRIPE_WEBHOOK
read -p "Enter Stripe Monthly Price ID: " STRIPE_PRICE_ID
read -p "Enter SendGrid API Key: " SENDGRID_KEY
read -p "Enter Sentry DSN: " SENTRY_DSN
read -p "Enter Production URL (e.g., https://elira.hu): " APP_URL

firebase functions:config:set \
  stripe.secret_key="$STRIPE_SECRET" \
  stripe.webhook_secret="$STRIPE_WEBHOOK" \
  stripe.monthly_price_id="$STRIPE_PRICE_ID" \
  email.sendgrid_api_key="$SENDGRID_KEY" \
  monitoring.sentry_dsn="$SENTRY_DSN" \
  app.url="$APP_URL" \
  app.environment="production"

echo -e "${GREEN}Configuration set successfully!${NC}"

# Deploy security rules
echo -e "${YELLOW}Deploying security rules...${NC}"
firebase deploy --only firestore:rules,storage:rules

# Deploy functions
echo -e "${YELLOW}Building and deploying functions...${NC}"
cd functions
npm run build
cd ..
firebase deploy --only functions

# Build and deploy hosting
echo -e "${YELLOW}Building application...${NC}"
npm run build

echo -e "${YELLOW}Deploying to hosting...${NC}"
firebase deploy --only hosting

echo -e "${GREEN}✅ Production deployment complete!${NC}"
echo -e "${GREEN}Your app is live at: $APP_URL${NC}"
```

### 8.3 Final Checklist

```markdown
# Fájl: /docs/production_checklist.md

# DMA Production Deployment Checklist

## Pre-Deployment
- [ ] All API keys rotated and secured
- [ ] Environment variables configured in GitHub Secrets
- [ ] Firebase Functions config set for production
- [ ] Firestore security rules deployed
- [ ] Firestore indexes created
- [ ] Backup system tested
- [ ] Rate limiting configured
- [ ] Error monitoring (Sentry) configured

## Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing of critical flows:
  - [ ] User registration with email verification
  - [ ] Password reset flow
  - [ ] Course enrollment (free and paid)
  - [ ] Video playback
  - [ ] Quiz completion
  - [ ] Progress tracking
  - [ ] Payment processing

## Security
- [ ] No secrets in codebase
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] SQL injection protection verified
- [ ] XSS protection verified

## Performance
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] CDN configured for assets
- [ ] Database queries optimized
- [ ] Caching strategy implemented

## Legal & Compliance
- [ ] GDPR compliance verified
- [ ] Privacy Policy updated
- [ ] Terms of Service updated
- [ ] Cookie consent implemented
- [ ] Data retention policies configured

## Monitoring
- [ ] Error tracking active (Sentry)
- [ ] Performance monitoring configured
- [ ] Uptime monitoring set up
- [ ] Alerts configured for critical errors
- [ ] Analytics tracking verified

## Documentation
- [ ] API documentation complete
- [ ] Deployment guide updated
- [ ] Admin guide created
- [ ] User guide available

## Post-Deployment
- [ ] Verify all services are running
- [ ] Test critical user flows in production
- [ ] Monitor error rates for first 24 hours
- [ ] Check performance metrics
- [ ] Verify backup system is working
- [ ] Announce launch to stakeholders
```

---

## 🎯 VÉGREHAJTÁSI ÖSSZEFOGLALÓ

### Azonnali teendők (NAP 1-2):
1. **API kulcsok rotálása és biztonságba helyezése**
2. **Git history tisztítása**
3. **Firestore biztonsági szabályok telepítése**
4. **Email szolgáltatás implementálása**

### Kritikus javítások (NAP 3-5):
1. **Authentication rendszer teljes körű javítása**
2. **Payment system aktiválása és konfigurálása**
3. **Course creation backend implementálása**

### Minőségbiztosítás (NAP 6-7):
1. **Rate limiting és monitoring bevezetése**
2. **Backup rendszer és GDPR compliance**

### Production deployment (NAP 8):
1. **CI/CD pipeline beállítása**
2. **Végleges production deployment**
3. **Post-deployment monitoring**

## ⚠️ FONTOS MEGJEGYZÉSEK

1. **Minden lépést tesztelj local környezetben először**
2. **Készíts biztonsági mentést minden változtatás előtt**
3. **Dokumentáld a változásokat**
4. **Kommunikáld a csapattal a kritikus változásokat**
5. **Monitor closely az első 48 órában deployment után**

---

*Ez a terv 8 nap intenzív munkát igényel, napi 6-8 óra dedikált fejlesztési idővel. A kritikus biztonsági problémákat AZONNAL orvosolni kell!*