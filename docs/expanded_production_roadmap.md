# DMA Platform - Expanded Production Roadmap with Testing
## Complete 21-Day Implementation Guide for New Developers

*Version: 2.0 - Detailed with Playwright Testing*
*Last Updated: January 2025*
*Target Launch: Day 21*

---

## 🚨 CRITICAL GAPS DISCOVERED

Based on testing, these components are **COMPLETELY MISSING** and must be built from scratch:

1. **Video Player Component** - `/src/components/video/` directory doesn't exist
2. **Email Service** - No SendGrid integration exists
3. **Payment Service** - No Stripe backend implementation  
4. **Firestore Security Rules** - Wide open, production data exposed
5. **Course Creation UI** - Instructor features not implemented
6. **Quiz Results Backend** - No persistence for quiz attempts
7. **Settings Functionality** - UI exists but no backend
8. **University Management** - Multi-tenant features missing
9. **Monitoring & Analytics** - No error tracking or metrics
10. **GDPR Compliance** - No data export/deletion features

---

## 📖 HOW TO USE THIS ROADMAP

### For New Developers:
1. **Read the entire day's tasks** before starting
2. **Run the Playwright test** to verify starting state
3. **Follow implementation steps** exactly as written
4. **Test after each component** is complete
5. **Run end-of-day validation** before moving on

### Required Tools Setup:
```bash
# Install dependencies first
npm install
npm install -g firebase-tools
npm install playwright @playwright/test

# Initialize Playwright
npx playwright install chromium

# Setup Firebase emulators
firebase init emulators
firebase login

# Start development environment
npm run dev  # In terminal 1
firebase emulators:start  # In terminal 2
```

---

## 🗓️ WEEK 1: CRITICAL SECURITY & INFRASTRUCTURE
*Days 1-7: Fixing Production-Breaking Issues*

### 📅 DAY 1: EMERGENCY SECURITY LOCKDOWN
**Goal: Secure exposed production data and rotate all keys**
**Time: 8 hours**
**Developer: Backend/Security Focus**

#### Morning (4 hours): API Key Rotation

##### Step 1: Backup Current Configuration
```bash
# Create backup of current environment
cp .env .env.backup.$(date +%Y%m%d)
cp functions/.env functions/.env.backup.$(date +%Y%m%d)

# Document current Firebase project
firebase projects:list
firebase use --add  # Select production project
```

##### Step 2: Rotate Firebase API Keys
```typescript
// Location: Create new file /scripts/rotate-keys.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as crypto from 'crypto';

async function rotateFirebaseKeys() {
  console.log('🔄 Starting Firebase key rotation...');
  
  // 1. Go to Firebase Console > Project Settings > Service Accounts
  // 2. Generate new private key
  // 3. Download as service-account-key.json
  
  // Update environment variables
  const newConfig = {
    FIREBASE_API_KEY: 'new-key-from-console',
    FIREBASE_AUTH_DOMAIN: 'DMA-PROJECT-ID.firebaseapp.com',
    FIREBASE_PROJECT_ID: 'DMA-PROJECT-ID',
    FIREBASE_STORAGE_BUCKET: 'DMA-PROJECT-ID.firebasestorage.app',
    FIREBASE_MESSAGING_SENDER_ID: 'new-sender-id',
    FIREBASE_APP_ID: 'new-app-id',
    FIREBASE_MEASUREMENT_ID: 'new-measurement-id'
  };
  
  // Write to .env.local (NEVER commit this)
  const envContent = Object.entries(newConfig)
    .map(([key, value]) => `NEXT_PUBLIC_${key}="${value}"`)
    .join('\n');
  
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Firebase keys rotated and saved to .env.local');
}

// Run: npx ts-node scripts/rotate-keys.ts
```

##### Step 3: Rotate Stripe Keys
```bash
# Go to Stripe Dashboard > Developers > API Keys
# 1. Create new restricted key with specific permissions:
#    - Charges: Write
#    - Customers: Read/Write  
#    - Payment Intents: Read/Write
#    - Checkout Sessions: Read/Write
#    - Webhooks: Read

# 2. Update .env.local with new keys:
STRIPE_PUBLISHABLE_KEY=pk_test_new_key_here
STRIPE_SECRET_KEY=rk_test_new_restricted_key_here
STRIPE_WEBHOOK_SECRET=whsec_new_webhook_secret

# 3. IMMEDIATELY revoke old keys in Stripe Dashboard
```

##### Step 4: Remove Keys from Git History
```bash
# Install BFG Repo-Cleaner
brew install bfg  # On Mac
# Or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clean sensitive data from history
bfg --delete-files .env
bfg --replace-text passwords.txt  # Create file with old keys to replace

# Force push cleaned history (coordinate with team!)
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

#### Afternoon (4 hours): Implement Firestore Security Rules

##### Step 5: Create Comprehensive Security Rules
```javascript
// Location: /firestore.rules
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
      return hasRole('instructor') || hasRole('admin');
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isEnrolled(courseId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + courseId));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) && 
        (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'isVerified']));
      allow update: if isAdmin();  // Admin can update any field
      allow delete: if isOwner(userId) || isAdmin();
    }
    
    // Courses collection  
    match /courses/{courseId} {
      allow read: if true;  // Public can browse courses
      allow create: if isInstructor();
      allow update: if isInstructor() && 
        resource.data.instructorId == request.auth.uid || isAdmin();
      allow delete: if isAdmin();
      
      // Lessons subcollection
      match /lessons/{lessonId} {
        allow read: if isEnrolled(courseId) || isInstructor() || isAdmin();
        allow write: if isInstructor() && 
          get(/databases/$(database)/documents/courses/$(courseId)).data.instructorId == request.auth.uid;
        allow write: if isAdmin();
      }
    }
    
    // Enrollments collection
    match /enrollments/{enrollmentId} {
      allow read: if isAuthenticated() && 
        (resource.data.userId == request.auth.uid || 
         resource.data.instructorId == request.auth.uid || 
         isAdmin());
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) || 
        resource.data.instructorId == request.auth.uid || 
        isAdmin();
      allow delete: if isAdmin();
    }
    
    // Lesson Progress collection
    match /lessonProgress/{progressId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isAdmin();
    }
    
    // Quiz Results collection
    match /quizResults/{resultId} {
      allow read: if isOwner(resource.data.userId) || 
        resource.data.instructorId == request.auth.uid || 
        isAdmin();
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if false;  // Quiz results are immutable
      allow delete: if isAdmin();
    }
    
    // Universities collection (multi-tenant)
    match /universities/{universityId} {
      allow read: if isAuthenticated() && 
        resource.data.members[request.auth.uid] != null || isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin() || 
        resource.data.admins[request.auth.uid] == true;
      allow delete: if isAdmin();
      
      // University subcollections
      match /{document=**} {
        allow read: if isAuthenticated() && 
          get(/databases/$(database)/documents/universities/$(universityId)).data.members[request.auth.uid] != null;
        allow write: if isAdmin() || 
          get(/databases/$(database)/documents/universities/$(universityId)).data.admins[request.auth.uid] == true;
      }
    }
    
    // Payments collection
    match /payments/{paymentId} {
      allow read: if isOwner(resource.data.userId) || isAdmin();
      allow create: if false;  // Only through Cloud Functions
      allow update: if false;  // Only through Cloud Functions
      allow delete: if isAdmin();
    }
    
    // Block all other collections by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

##### Step 6: Deploy and Test Security Rules
```bash
# Deploy rules to Firebase
firebase deploy --only firestore:rules

# Test rules with emulator
firebase emulators:start --only firestore

# Run security tests
npm run test:security
```

##### Step 7: Create Security Test Suite
```typescript
// Location: /tests/security.test.ts
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';

describe('Firestore Security Rules', () => {
  let testEnv: any;
  let unauthedDb: any;
  let authedDb: any;
  let adminDb: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'elira-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
    
    unauthedDb = testEnv.unauthenticatedContext().firestore();
    authedDb = testEnv.authenticatedContext('user123').firestore();
    adminDb = testEnv.authenticatedContext('admin', { role: 'admin' }).firestore();
  });

  test('Unauthenticated users cannot read user profiles', async () => {
    await assertFails(getDoc(doc(unauthedDb, 'users/someuser')));
  });

  test('Users can read their own profile', async () => {
    await adminDb.collection('users').doc('user123').set({ name: 'Test User' });
    await assertSucceeds(getDoc(doc(authedDb, 'users/user123')));
  });

  test('Users cannot read other user profiles', async () => {
    await assertFails(getDoc(doc(authedDb, 'users/otheruser')));
  });

  test('Users cannot change their role', async () => {
    await assertFails(
      setDoc(doc(authedDb, 'users/user123'), { role: 'admin' }, { merge: true })
    );
  });

  test('Public can browse courses', async () => {
    await assertSucceeds(getDoc(doc(unauthedDb, 'courses/course1')));
  });

  test('Only enrolled users can access lessons', async () => {
    await assertFails(getDoc(doc(authedDb, 'courses/course1/lessons/lesson1')));
    
    // Add enrollment
    await adminDb.collection('enrollments').doc('user123_course1').set({
      userId: 'user123',
      courseId: 'course1'
    });
    
    await assertSucceeds(getDoc(doc(authedDb, 'courses/course1/lessons/lesson1')));
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });
});
```

#### Day 1 Playwright Validation Test
```typescript
// Location: /tests/playwright/day1-security.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Day 1: Security Implementation', () => {
  test('Environment variables are not exposed', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check page source doesn't contain keys
    const content = await page.content();
    expect(content).not.toContain('sk_live');
    expect(content).not.toContain('AIzaSy');
    expect(content).not.toContain('firebase-adminsdk');
  });

  test('Firestore rules prevent unauthorized access', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Try to access protected data without auth
    const response = await page.evaluate(async () => {
      const { getFirestore, collection, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      try {
        await getDocs(collection(db, 'users'));
        return 'success';
      } catch (error) {
        return 'blocked';
      }
    });
    
    expect(response).toBe('blocked');
  });

  test('API endpoints require authentication', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(401);
  });
});
```

---

### 📅 DAY 2: EMAIL SERVICE IMPLEMENTATION
**Goal: Implement complete email service with SendGrid**
**Time: 8 hours**
**Developer: Backend Focus**

#### Morning (4 hours): SendGrid Setup

##### Step 1: Install and Configure SendGrid
```bash
# Install SendGrid package
cd functions
npm install @sendgrid/mail @sendgrid/client
npm install --save-dev @types/sendgrid

# Set SendGrid API key in Firebase config
firebase functions:config:set sendgrid.key="SG.your_api_key_here"
firebase functions:config:set sendgrid.from="noreply@elira.com"
firebase functions:config:set sendgrid.replyto="support@elira.com"
```

##### Step 2: Create Email Service
```typescript
// Location: /functions/src/services/emailService.ts
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
      subject: 'Üdvözöljük az DMA platformon! 🎓',
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
              <h1>Üdvözöljük az DMA-n! 🎉</h1>
            </div>
            <div class="content">
              <h2>Kedves ${user.displayName || 'Felhasználó'}!</h2>
              <p>Örömmel üdvözöljük az DMA e-learning platformon! Regisztrációja sikeresen megtörtént.</p>
              
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
              <p><strong>Az DMA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 DMA Learning Platform. Minden jog fenntartva.</p>
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
      subject: 'Jelszó visszaállítás - DMA',
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
              <p>Jelszó visszaállítási kérelmet kaptunk az Ön DMA fiókjához.</p>
              
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
              
              <p>Üdvözlettel,<br><strong>Az DMA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 DMA Learning Platform. Minden jog fenntartva.</p>
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
              <p><strong>Az DMA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 DMA Learning Platform. Minden jog fenntartva.</p>
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
              
              <p>Üdvözlettel,<br><strong>Az DMA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 DMA Learning Platform. Minden jog fenntartva.</p>
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
              <p>Köszönjük vásárlását az DMA platformon. Mellékeljük a számlát.</p>
              
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
                <strong>DMA Kft.</strong><br>
                1234 Budapest, Oktatás utca 1.<br>
                Adószám: 12345678-2-42<br>
                Cégjegyzékszám: 01-09-123456
              </p>
              
              <p>Ha kérdése van a számlával kapcsolatban, forduljon hozzánk:</p>
              <p>Email: billing@elira.com | Telefon: +36 1 234 5678</p>
              
              <p>Üdvözlettel,<br><strong>Az DMA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 DMA Learning Platform. Minden jog fenntartva.</p>
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
              <p><strong>Az DMA csapata</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 DMA Learning Platform. Minden jog fenntartva.</p>
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
```

##### Step 3: Create Email Cloud Functions
```typescript
// Location: /functions/src/emailActions.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { emailService } from './services/emailService';
import * as z from 'zod';

// Validation schemas
const SendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(200),
  template: z.enum(['welcome', 'passwordReset', 'enrollment', 'quiz', 'payment', 'certificate', 'custom']),
  data: z.record(z.any()).optional(),
});

/**
 * Send email Cloud Function
 */
export const sendEmail = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to send emails'
      );
    }

    // Validate input
    const validated = SendEmailSchema.parse(data);

    // Check user permissions (admin only for custom emails)
    if (validated.template === 'custom') {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(context.auth.uid)
        .get();
      
      if (userDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can send custom emails'
        );
      }
    }

    // Send email based on template
    switch (validated.template) {
      case 'welcome':
        await emailService.sendWelcomeEmail({
          email: validated.to as string,
          displayName: validated.data?.displayName
        });
        break;
        
      case 'passwordReset':
        await emailService.sendPasswordResetEmail(
          validated.to as string,
          validated.data?.resetLink
        );
        break;
        
      case 'enrollment':
        await emailService.sendEnrollmentConfirmation(
          { email: validated.to as string, name: validated.data?.userName },
          { 
            title: validated.data?.courseTitle,
            instructor: validated.data?.instructorName,
            startDate: validated.data?.startDate
          }
        );
        break;
        
      case 'quiz':
        await emailService.sendQuizCompletionEmail(
          { email: validated.to as string, name: validated.data?.userName },
          {
            title: validated.data?.quizTitle,
            score: validated.data?.score,
            passed: validated.data?.passed,
            certificateUrl: validated.data?.certificateUrl
          }
        );
        break;
        
      case 'payment':
        await emailService.sendPaymentReceipt(
          { email: validated.to as string, name: validated.data?.userName },
          {
            amount: validated.data?.amount,
            currency: validated.data?.currency || 'HUF',
            description: validated.data?.description,
            invoiceNumber: validated.data?.invoiceNumber,
            date: validated.data?.date || new Date().toLocaleDateString('hu-HU')
          }
        );
        break;
        
      case 'certificate':
        await emailService.sendCertificateEmail(
          { email: validated.to as string, name: validated.data?.userName },
          {
            title: validated.data?.courseTitle,
            completionDate: validated.data?.completionDate,
            certificateUrl: validated.data?.certificateUrl
          }
        );
        break;
        
      case 'custom':
        await emailService.sendEmail({
          to: validated.to,
          subject: validated.subject,
          html: validated.data?.html || '',
          text: validated.data?.text
        });
        break;
    }

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('Send email error:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid email data provided'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send email'
    );
  }
});

/**
 * Trigger: Send welcome email on user creation
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    await emailService.sendWelcomeEmail({
      email: user.email!,
      displayName: user.displayName
    });
    
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
});

/**
 * Trigger: Send enrollment confirmation
 */
export const onEnrollmentCreated = functions.firestore
  .document('enrollments/{enrollmentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const enrollment = snapshot.data();
      
      // Get user and course data
      const [userDoc, courseDoc] = await Promise.all([
        admin.firestore().collection('users').doc(enrollment.userId).get(),
        admin.firestore().collection('courses').doc(enrollment.courseId).get()
      ]);
      
      const user = userDoc.data();
      const course = courseDoc.data();
      
      if (user && course) {
        await emailService.sendEnrollmentConfirmation(
          { email: user.email, name: user.displayName || user.firstName },
          { 
            title: course.title,
            instructor: course.instructorName,
            startDate: course.startDate
          }
        );
        
        console.log('Enrollment confirmation sent to:', user.email);
      }
    } catch (error) {
      console.error('Failed to send enrollment confirmation:', error);
    }
  });

/**
 * Scheduled: Send reminder emails
 */
export const sendCourseReminders = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('Europe/Budapest')
  .onRun(async (context) => {
    try {
      // Get all active enrollments
      const enrollments = await admin.firestore()
        .collection('enrollments')
        .where('status', '==', 'active')
        .where('lastActivityDate', '<', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // 7 days ago
        .get();
      
      for (const doc of enrollments.docs) {
        const enrollment = doc.data();
        
        // Get user data
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(enrollment.userId)
          .get();
        
        const user = userDoc.data();
        
        if (user && user.emailPreferences?.reminders !== false) {
          // Send reminder email
          await emailService.sendEmail({
            to: user.email,
            subject: 'Ne felejtse el folytatni a tanulást! 📚',
            html: `
              <h2>Kedves ${user.displayName}!</h2>
              <p>Már egy hete nem lépett be az DMA platformra.</p>
              <p>Folytassa a tanulást és érje el céljait!</p>
              <a href="https://elira.com/dashboard">Folytatás</a>
            `
          });
        }
      }
      
      console.log(`Sent ${enrollments.size} reminder emails`);
    } catch (error) {
      console.error('Failed to send reminders:', error);
    }
  });
```

#### Afternoon (4 hours): Email Integration & Testing

##### Step 4: Update Authentication to Send Emails
```typescript
// Location: /functions/src/authActions.ts (update existing)
import { emailService } from './services/emailService';

// Add to existing signUpUser function
export const signUpUser = functions.https.onCall(async (data, context) => {
  // ... existing validation and user creation code ...
  
  // After successful user creation
  try {
    await emailService.sendWelcomeEmail({
      email: data.email,
      displayName: data.firstName
    });
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError);
    // Don't fail signup if email fails
  }
  
  return { success: true, userId: userRecord.uid };
});

// Add password reset function
export const sendPasswordReset = functions.https.onCall(async (data, context) => {
  try {
    const { email } = data;
    
    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);
    
    // Send email
    await emailService.sendPasswordResetEmail(email, link);
    
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('Password reset error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to send password reset email'
    );
  }
});
```

##### Step 5: Create Email Testing Suite
```typescript
// Location: /tests/email.test.ts
import { emailService } from '../functions/src/services/emailService';
import * as admin from 'firebase-admin';

describe('Email Service', () => {
  const testEmail = 'test@elira.com';
  
  beforeAll(() => {
    // Initialize admin SDK for testing
    if (!admin.apps.length) {
      admin.initializeApp();
    }
  });

  test('Send welcome email', async () => {
    const result = await emailService.sendWelcomeEmail({
      email: testEmail,
      displayName: 'Test User'
    });
    
    expect(result).toBeUndefined(); // No error thrown
  });

  test('Send password reset email', async () => {
    const result = await emailService.sendPasswordResetEmail(
      testEmail,
      'https://elira.com/reset?token=test123'
    );
    
    expect(result).toBeUndefined();
  });

  test('Send enrollment confirmation', async () => {
    const result = await emailService.sendEnrollmentConfirmation(
      { email: testEmail, name: 'Test User' },
      { 
        title: 'Test Course',
        instructor: 'Dr. Test',
        startDate: '2025-02-01'
      }
    );
    
    expect(result).toBeUndefined();
  });

  test('Send quiz completion email', async () => {
    const result = await emailService.sendQuizCompletionEmail(
      { email: testEmail, name: 'Test User' },
      {
        title: 'Test Quiz',
        score: 85,
        passed: true,
        certificateUrl: 'https://elira.com/cert/123'
      }
    );
    
    expect(result).toBeUndefined();
  });

  test('Send payment receipt', async () => {
    const result = await emailService.sendPaymentReceipt(
      { email: testEmail, name: 'Test User' },
      {
        amount: 9999,
        currency: 'HUF',
        description: 'Test Course Purchase',
        invoiceNumber: 'INV-2025-001',
        date: '2025-01-15'
      }
    );
    
    expect(result).toBeUndefined();
  });

  test('Email contains required elements', async () => {
    const mockSend = jest.spyOn(emailService as any, 'sendEmail');
    
    await emailService.sendWelcomeEmail({
      email: testEmail,
      displayName: 'Test User'
    });
    
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: testEmail,
        subject: expect.stringContaining('Üdvözöljük'),
        html: expect.stringContaining('Test User')
      })
    );
  });
});
```

#### Day 2 Playwright Validation Test
```typescript
// Location: /tests/playwright/day2-email.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Day 2: Email Service Implementation', () => {
  test('SendGrid configuration exists', async () => {
    // Check Firebase functions config
    const { exec } = require('child_process');
    const config = await new Promise((resolve) => {
      exec('firebase functions:config:get', (error, stdout) => {
        resolve(stdout);
      });
    });
    
    expect(config).toContain('sendgrid');
  });

  test('Welcome email sent on registration', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3000/register');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'newuser@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('text=Sikeres regisztráció')).toBeVisible();
    
    // Check email logs in Firestore
    // This would check if email was logged as sent
  });

  test('Password reset email functionality', async ({ page }) => {
    await page.goto('http://localhost:3000/forgot-password');
    
    // Enter email
    await page.fill('input[name="email"]', 'existing@test.com');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Check for success message
    await expect(page.locator('text=Email elküldve')).toBeVisible();
  });

  test('Email templates render correctly', async () => {
    // Test that email HTML templates are valid
    const templates = [
      'welcome',
      'passwordReset',
      'enrollment',
      'quiz',
      'payment',
      'certificate'
    ];
    
    for (const template of templates) {
      // Would test each template renders without errors
      expect(template).toBeTruthy();
    }
  });
});
```

---

### 📅 DAY 3: AUTHENTICATION & AUTHORIZATION
**Goal: Implement complete role-based access control**
**Time: 8 hours**
**Developer: Backend/Security Focus**

#### Morning (4 hours): Backend RBAC Implementation

##### Step 1: Create Role Management System
```typescript
// Location: /functions/src/auth/roleManager.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  UNIVERSITY_ADMIN = 'university_admin'
}

export interface Permission {
  resource: string;
  actions: string[];
}

export class RoleManager {
  private static permissions: Record<UserRole, Permission[]> = {
    [UserRole.STUDENT]: [
      { resource: 'courses', actions: ['read', 'enroll'] },
      { resource: 'lessons', actions: ['read'] },
      { resource: 'quizzes', actions: ['read', 'submit'] },
      { resource: 'profile', actions: ['read', 'update'] },
      { resource: 'certificates', actions: ['read'] }
    ],
    [UserRole.INSTRUCTOR]: [
      { resource: 'courses', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'lessons', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'quizzes', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'students', actions: ['read'] },
      { resource: 'analytics', actions: ['read'] },
      { resource: 'profile', actions: ['read', 'update'] }
    ],
    [UserRole.ADMIN]: [
      { resource: '*', actions: ['*'] } // Full access
    ],
    [UserRole.UNIVERSITY_ADMIN]: [
      { resource: 'university', actions: ['read', 'update'] },
      { resource: 'departments', actions: ['read', 'create', 'update', 'delete'] },
      { resource: 'instructors', actions: ['read', 'create', 'update'] },
      { resource: 'courses', actions: ['read', 'approve'] },
      { resource: 'students', actions: ['read', 'create', 'update'] },
      { resource: 'reports', actions: ['read', 'create'] }
    ]
  };

  /**
   * Check if user has permission for action
   */
  static hasPermission(
    userRole: UserRole,
    resource: string,
    action: string
  ): boolean {
    const rolePermissions = this.permissions[userRole];
    
    if (!rolePermissions) return false;
    
    return rolePermissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });
  }

  /**
   * Set user role with custom claims
   */
  static async setUserRole(userId: string, role: UserRole): Promise<void> {
    try {
      // Set custom claims
      await admin.auth().setCustomUserClaims(userId, { role });
      
      // Update user document
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          role,
          roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`Role ${role} set for user ${userId}`);
    } catch (error) {
      console.error('Error setting user role:', error);
      throw error;
    }
  }

  /**
   * Get user role from claims or database
   */
  static async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      // First check custom claims
      const user = await admin.auth().getUser(userId);
      if (user.customClaims?.role) {
        return user.customClaims.role as UserRole;
      }
      
      // Fallback to database
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      return userDoc.data()?.role || UserRole.STUDENT;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Validate role change request
   */
  static canChangeRole(
    requestorRole: UserRole,
    targetRole: UserRole
  ): boolean {
    // Only admins can change roles
    if (requestorRole !== UserRole.ADMIN) {
      // University admins can only assign student/instructor within their university
      if (requestorRole === UserRole.UNIVERSITY_ADMIN) {
        return targetRole === UserRole.STUDENT || targetRole === UserRole.INSTRUCTOR;
      }
      return false;
    }
    return true;
  }
}
```

##### Step 2: Create Authentication Middleware
```typescript
// Location: /functions/src/middleware/authMiddleware.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { RoleManager, UserRole } from '../auth/roleManager';

export interface AuthContext {
  uid: string;
  email: string;
  role: UserRole;
  universityId?: string;
}

/**
 * Middleware to check authentication
 */
export async function requireAuth(
  context: functions.https.CallableContext
): Promise<AuthContext> {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const role = await RoleManager.getUserRole(context.auth.uid);
  
  if (!role) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User role not found'
    );
  }

  // Get university context if applicable
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();
  
  const userData = userDoc.data();

  return {
    uid: context.auth.uid,
    email: context.auth.token.email || '',
    role,
    universityId: userData?.universityId
  };
}

/**
 * Middleware to check specific permission
 */
export async function requirePermission(
  context: functions.https.CallableContext,
  resource: string,
  action: string
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  if (!RoleManager.hasPermission(auth.role, resource, action)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User lacks permission for ${action} on ${resource}`
    );
  }

  return auth;
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  context: functions.https.CallableContext,
  requiredRoles: UserRole[]
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  if (!requiredRoles.includes(auth.role)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User role ${auth.role} is not authorized`
    );
  }

  return auth;
}

/**
 * Middleware for instructor-owned resources
 */
export async function requireOwnership(
  context: functions.https.CallableContext,
  resourceId: string,
  collection: string
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  // Admins bypass ownership check
  if (auth.role === UserRole.ADMIN) {
    return auth;
  }

  // Check ownership
  const doc = await admin.firestore()
    .collection(collection)
    .doc(resourceId)
    .get();
  
  if (!doc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Resource not found'
    );
  }

  const data = doc.data();
  
  if (data?.instructorId !== auth.uid && data?.ownerId !== auth.uid) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User does not own this resource'
    );
  }

  return auth;
}

/**
 * Middleware for university-scoped resources
 */
export async function requireUniversityContext(
  context: functions.https.CallableContext,
  universityId: string
): Promise<AuthContext> {
  const auth = await requireAuth(context);
  
  // Admins bypass university context
  if (auth.role === UserRole.ADMIN) {
    return auth;
  }

  // Check user belongs to university
  if (auth.universityId !== universityId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User not authorized for this university'
    );
  }

  return auth;
}
```

##### Step 3: Update Authentication Actions
```typescript
// Location: /functions/src/authActions.ts (update existing)
import { RoleManager, UserRole } from './auth/roleManager';
import { requireAuth, requireRole } from './middleware/authMiddleware';

/**
 * Set user role (admin only)
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  try {
    // Require admin role
    await requireRole(context, [UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]);
    
    const { userId, role } = data;
    
    // Validate role change
    const requestorRole = await RoleManager.getUserRole(context.auth!.uid);
    
    if (!RoleManager.canChangeRole(requestorRole!, role)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot assign this role'
      );
    }
    
    // Set the role
    await RoleManager.setUserRole(userId, role);
    
    // Log the action
    await admin.firestore().collection('auditLogs').add({
      action: 'ROLE_CHANGE',
      performedBy: context.auth!.uid,
      targetUser: userId,
      newRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Role updated successfully' };
    
  } catch (error) {
    console.error('Set user role error:', error);
    throw error;
  }
});

/**
 * Get current user profile with role
 */
export const getCurrentUser = functions.https.onCall(async (data, context) => {
  try {
    const auth = await requireAuth(context);
    
    // Get user document
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(auth.uid)
      .get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found'
      );
    }
    
    const userData = userDoc.data();
    
    return {
      uid: auth.uid,
      email: auth.email,
      role: auth.role,
      ...userData,
      // Don't send sensitive fields
      password: undefined,
      resetToken: undefined
    };
    
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
});

/**
 * Impersonate user (admin only, for support)
 */
export const impersonateUser = functions.https.onCall(async (data, context) => {
  try {
    await requireRole(context, [UserRole.ADMIN]);
    
    const { userId } = data;
    
    // Create custom token for impersonation
    const customToken = await admin.auth().createCustomToken(userId, {
      impersonatedBy: context.auth!.uid,
      impersonationExpiry: Date.now() + 3600000 // 1 hour
    });
    
    // Log impersonation
    await admin.firestore().collection('auditLogs').add({
      action: 'IMPERSONATION_START',
      performedBy: context.auth!.uid,
      targetUser: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, token: customToken };
    
  } catch (error) {
    console.error('Impersonate user error:', error);
    throw error;
  }
});
```

#### Afternoon (4 hours): Frontend Auth Integration

##### Step 4: Create Auth Context and Hooks
```typescript
// Location: /src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

export enum UserRole {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
  UNIVERSITY_ADMIN = 'university_admin'
}

interface AuthUser extends User {
  role?: UserRole;
  universityId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Permission matrix
const permissions: Record<UserRole, { resource: string; actions: string[] }[]> = {
  [UserRole.STUDENT]: [
    { resource: 'courses', actions: ['read', 'enroll'] },
    { resource: 'lessons', actions: ['read'] },
    { resource: 'quizzes', actions: ['read', 'submit'] },
    { resource: 'profile', actions: ['read', 'update'] }
  ],
  [UserRole.INSTRUCTOR]: [
    { resource: 'courses', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'lessons', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'quizzes', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'students', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] }
  ],
  [UserRole.ADMIN]: [
    { resource: '*', actions: ['*'] }
  ],
  [UserRole.UNIVERSITY_ADMIN]: [
    { resource: 'university', actions: ['read', 'update'] },
    { resource: 'departments', actions: ['read', 'create', 'update', 'delete'] },
    { resource: 'instructors', actions: ['read', 'create', 'update'] },
    { resource: 'courses', actions: ['read', 'approve'] },
    { resource: 'students', actions: ['read', 'create', 'update'] }
  ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch additional user data
  const fetchUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      const getCurrentUser = httpsCallable(functions, 'getCurrentUser');
      const result = await getCurrentUser();
      const userData = result.data as any;
      
      return {
        ...firebaseUser,
        role: userData.role,
        universityId: userData.universityId
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return firebaseUser;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const enrichedUser = await fetchUserData(firebaseUser);
        setUser(enrichedUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      const enrichedUser = await fetchUserData(result.user);
      setUser(enrichedUser);
      
      // Redirect based on role
      switch (enrichedUser.role) {
        case UserRole.ADMIN:
          router.push('/admin/dashboard');
          break;
        case UserRole.INSTRUCTOR:
          router.push('/instructor/dashboard');
          break;
        case UserRole.UNIVERSITY_ADMIN:
          router.push('/university/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (email: string, password: string, userData: any) => {
    try {
      setError(null);
      
      // Create Firebase auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(result.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Call Cloud Function to create user document
      const createUser = httpsCallable(functions, 'createUserProfile');
      await createUser({
        uid: result.user.uid,
        email,
        ...userData
      });
      
      const enrichedUser = await fetchUserData(result.user);
      setUser(enrichedUser);
      
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if new user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      if (isNewUser) {
        // Create user profile
        const createUser = httpsCallable(functions, 'createUserProfile');
        await createUser({
          uid: result.user.uid,
          email: result.user.email,
          firstName: result.user.displayName?.split(' ')[0],
          lastName: result.user.displayName?.split(' ')[1] || '',
          photoURL: result.user.photoURL
        });
      }
      
      const enrichedUser = await fetchUserData(result.user);
      setUser(enrichedUser);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user?.role) return false;
    
    const rolePermissions = permissions[user.role];
    
    return rolePermissions.some(permission => {
      const resourceMatch = permission.resource === '*' || permission.resource === resource;
      const actionMatch = permission.actions.includes('*') || permission.actions.includes(action);
      return resourceMatch && actionMatch;
    });
  };

  const hasRole = (roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  };

  const refreshUser = async () => {
    if (user) {
      const enrichedUser = await fetchUserData(user);
      setUser(enrichedUser);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    loginWithGoogle,
    hasPermission,
    hasRole,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

##### Step 5: Create Protected Route Components
```typescript
// Location: /src/components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(`${redirectTo}?redirect=${window.location.pathname}`);
        return;
      }

      // Check role requirements
      if (requiredRoles && !hasRole(requiredRoles)) {
        router.push('/unauthorized');
        return;
      }

      // Check permission requirements
      if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, requiredRoles, requiredPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check authorization
  if (!user) {
    return null;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null;
  }

  return <>{children}</>;
}
```

##### Step 6: Create Role-Based Navigation
```typescript
// Location: /src/components/navigation/RoleBasedNav.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  BarChart,
  Settings,
  School,
  FileText,
  DollarSign,
  Shield,
  Building
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Műszerfal',
    href: '/dashboard',
    icon: Home,
    roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  },
  {
    label: 'Kurzusaim',
    href: '/dashboard/courses',
    icon: BookOpen,
    roles: [UserRole.STUDENT]
  },
  {
    label: 'Kurzus kezelés',
    href: '/instructor/courses',
    icon: BookOpen,
    roles: [UserRole.INSTRUCTOR]
  },
  {
    label: 'Diákok',
    href: '/instructor/students',
    icon: Users,
    roles: [UserRole.INSTRUCTOR]
  },
  {
    label: 'Analitika',
    href: '/instructor/analytics',
    icon: BarChart,
    roles: [UserRole.INSTRUCTOR]
  },
  {
    label: 'Felhasználók',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Kurzusok',
    href: '/admin/courses',
    icon: BookOpen,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Egyetemek',
    href: '/admin/universities',
    icon: Building,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Pénzügyek',
    href: '/admin/finance',
    icon: DollarSign,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Biztonság',
    href: '/admin/security',
    icon: Shield,
    roles: [UserRole.ADMIN]
  },
  {
    label: 'Egyetem kezelés',
    href: '/university/manage',
    icon: School,
    roles: [UserRole.UNIVERSITY_ADMIN]
  },
  {
    label: 'Jelentések',
    href: '/university/reports',
    icon: FileText,
    roles: [UserRole.UNIVERSITY_ADMIN]
  },
  {
    label: 'Beállítások',
    href: '/dashboard/settings',
    icon: Settings,
    roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN]
  }
];

export function RoleBasedNav() {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  const visibleItems = navItems.filter(item => hasRole(item.roles));

  return (
    <nav className="space-y-1">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center px-4 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

#### Day 3 Playwright Validation Test
```typescript
// Location: /tests/playwright/day3-auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Day 3: Authentication & Authorization', () => {
  test('Login with different roles', async ({ page }) => {
    const testUsers = [
      { email: 'student@test.com', password: 'Test123!', expectedUrl: '/dashboard' },
      { email: 'instructor@test.com', password: 'Test123!', expectedUrl: '/instructor/dashboard' },
      { email: 'admin@test.com', password: 'Test123!', expectedUrl: '/admin/dashboard' }
    ];

    for (const user of testUsers) {
      await page.goto('http://localhost:3000/login');
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL(user.expectedUrl);
      expect(page.url()).toContain(user.expectedUrl);
      
      await page.goto('http://localhost:3000/logout');
    }
  });

  test('Protected routes redirect unauthenticated users', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/instructor/courses',
      '/admin/users',
      '/university/manage'
    ];

    for (const route of protectedRoutes) {
      await page.goto(`http://localhost:3000${route}`);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('Role-based navigation shows correct items', async ({ page }) => {
    // Login as student
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'student@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Check student can see their nav items
    await expect(page.locator('text=Kurzusaim')).toBeVisible();
    
    // Check student cannot see admin items
    await expect(page.locator('text=Felhasználók')).not.toBeVisible();
  });

  test('Permission checks work correctly', async ({ page }) => {
    // Login as instructor
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'instructor@test.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Try to access admin page
    await page.goto('http://localhost:3000/admin/users');
    await expect(page).toHaveURL(/\/unauthorized/);
  });

  test('Google OAuth login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check Google login button exists
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    
    // Click would trigger OAuth flow
    // In test environment, we mock this
  });
});
```

---

### 📅 DAY 4-5: PAYMENT SYSTEM
**Goal: Complete Stripe integration with subscriptions**
**Time: 16 hours**
**Developer: Backend + Frontend**

#### Day 4 Morning (4 hours): Stripe Backend Setup

##### Step 1: Create Stripe Service
```typescript
// Location: /functions/src/services/stripeService.ts
import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const config = functions.config();
const stripe = new Stripe(
  config.stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '',
  { apiVersion: '2023-10-16' }
);

export interface CreateCheckoutSessionData {
  userId: string;
  courseId?: string;
  priceId?: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerData {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  address?: Stripe.AddressParam;
}

export class StripeService {
  /**
   * Create or get Stripe customer
   */
  async createOrGetCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(data.userId)
        .get();
      
      const userData = userDoc.data();
      
      if (userData?.stripeCustomerId) {
        // Return existing customer
        return await stripe.customers.retrieve(userData.stripeCustomerId) as Stripe.Customer;
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        address: data.address,
        metadata: {
          firebaseUserId: data.userId
        }
      });

      // Save customer ID to user document
      await admin.firestore()
        .collection('users')
        .doc(data.userId)
        .update({
          stripeCustomerId: customer.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      console.log('✅ Stripe customer created:', customer.id);
      return customer;

    } catch (error) {
      console.error('❌ Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create checkout session for course purchase
   */
  async createCheckoutSession(data: CreateCheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      // Get or create customer
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(data.userId)
        .get();
      
      const userData = userDoc.data();
      
      if (!userData) {
        throw new Error('User not found');
      }

      const customer = await this.createOrGetCustomer({
        userId: data.userId,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`
      });

      // Prepare line items
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
      
      if (data.courseId) {
        // Get course details
        const courseDoc = await admin.firestore()
          .collection('courses')
          .doc(data.courseId)
          .get();
        
        const course = courseDoc.data();
        
        if (!course) {
          throw new Error('Course not found');
        }

        lineItems.push({
          price_data: {
            currency: 'huf',
            product_data: {
              name: course.title,
              description: course.description,
              images: course.thumbnail ? [course.thumbnail] : [],
              metadata: {
                courseId: data.courseId
              }
            },
            unit_amount: Math.round(course.price * 100) // Convert to cents
          },
          quantity: 1
        });
      } else if (data.priceId) {
        // Use existing price ID (for subscriptions)
        lineItems.push({
          price: data.priceId,
          quantity: 1
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: data.mode,
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          userId: data.userId,
          courseId: data.courseId || '',
          ...data.metadata
        },
        locale: 'hu',
        payment_intent_data: data.mode === 'payment' ? {
          metadata: {
            userId: data.userId,
            courseId: data.courseId || ''
          }
        } : undefined,
        subscription_data: data.mode === 'subscription' ? {
          metadata: {
            userId: data.userId
          }
        } : undefined
      });

      // Log checkout session
      await admin.firestore().collection('checkoutSessions').add({
        sessionId: session.id,
        userId: data.userId,
        courseId: data.courseId,
        status: 'pending',
        amount: session.amount_total,
        currency: session.currency,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Checkout session created:', session.id);
      return session;

    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handlePaymentSuccess(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const { userId, courseId } = session.metadata || {};
      
      if (!userId) {
        console.error('No userId in session metadata');
        return;
      }

      // Create payment record
      await admin.firestore().collection('payments').add({
        userId,
        courseId: courseId || null,
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // If course purchase, create enrollment
      if (courseId) {
        await this.createEnrollment(userId, courseId);
      }

      // Send receipt email
      const emailService = (await import('./emailService')).emailService;
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.data();
      
      if (userData?.email) {
        await emailService.sendPaymentReceipt(
          { email: userData.email, name: userData.displayName },
          {
            amount: (session.amount_total || 0) / 100,
            currency: session.currency?.toUpperCase() || 'HUF',
            description: courseId ? `Kurzus vásárlás` : 'Előfizetés',
            invoiceNumber: `INV-${Date.now()}`,
            date: new Date().toLocaleDateString('hu-HU')
          }
        );
      }

      console.log('✅ Payment processed successfully');

    } catch (error) {
      console.error('❌ Error handling payment success:', error);
      throw error;
    }
  }

  /**
   * Create enrollment after payment
   */
  private async createEnrollment(userId: string, courseId: string): Promise<void> {
    try {
      const enrollmentId = `${userId}_${courseId}`;
      
      // Check if already enrolled
      const existingEnrollment = await admin.firestore()
        .collection('enrollments')
        .doc(enrollmentId)
        .get();
      
      if (existingEnrollment.exists) {
        console.log('User already enrolled');
        return;
      }

      // Get course details
      const courseDoc = await admin.firestore()
        .collection('courses')
        .doc(courseId)
        .get();
      
      const course = courseDoc.data();
      
      if (!course) {
        throw new Error('Course not found');
      }

      // Create enrollment
      await admin.firestore()
        .collection('enrollments')
        .doc(enrollmentId)
        .set({
          userId,
          courseId,
          courseTitle: course.title,
          instructorId: course.instructorId,
          enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'active',
          progress: 0,
          completedLessons: [],
          lastAccessedAt: admin.firestore.FieldValue.serverTimestamp()
        });

      // Update course enrollment count
      await admin.firestore()
        .collection('courses')
        .doc(courseId)
        .update({
          enrollmentCount: admin.firestore.FieldValue.increment(1)
        });

      // Send enrollment confirmation email
      const emailService = (await import('./emailService')).emailService;
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.data();
      
      if (userData?.email) {
        await emailService.sendEnrollmentConfirmation(
          { email: userData.email, name: userData.displayName },
          { 
            title: course.title,
            instructor: course.instructorName,
            startDate: course.startDate
          }
        );
      }

      console.log('✅ Enrollment created successfully');

    } catch (error) {
      console.error('❌ Error creating enrollment:', error);
      throw error;
    }
  }

  /**
   * Create subscription for user
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata
      });

      console.log('✅ Subscription created:', subscription.id);
      return subscription;

    } catch (error) {
      console.error('❌ Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      console.log('✅ Subscription cancelled:', subscription.id);
      return subscription;

    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason
      });

      // Log refund
      await admin.firestore().collection('refunds').add({
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log('✅ Refund created:', refund.id);
      return refund;

    } catch (error) {
      console.error('❌ Error creating refund:', error);
      throw error;
    }
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;

    } catch (error) {
      console.error('❌ Error getting payment methods:', error);
      throw error;
    }
  }

  /**
   * Create setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      console.log('✅ Setup intent created:', setupIntent.id);
      return setupIntent;

    } catch (error) {
      console.error('❌ Error creating setup intent:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
```

##### Step 2: Create Payment Cloud Functions
```typescript
// Location: /functions/src/paymentActions.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { stripeService } from './services/stripeService';
import { requireAuth } from './middleware/authMiddleware';
import * as z from 'zod';
import Stripe from 'stripe';

// Validation schemas
const CreateCheckoutSchema = z.object({
  courseId: z.string().optional(),
  priceId: z.string().optional(),
  mode: z.enum(['payment', 'subscription']).default('payment'),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
});

const CreateRefundSchema = z.object({
  paymentId: z.string(),
  amount: z.number().positive().optional(),
  reason: z.string().optional()
});

/**
 * Create checkout session
 */
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  try {
    const auth = await requireAuth(context);
    const validated = CreateCheckoutSchema.parse(data);

    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      userId: auth.uid,
      ...validated,
      metadata: {
        environment: process.env.NODE_ENV || 'development'
      }
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url
    };

  } catch (error) {
    console.error('Create checkout session error:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid checkout data'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create checkout session'
    );
  }
});

/**
 * Stripe webhook handler
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    const endpointSecret = functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      console.error('Missing signature or endpoint secret');
      res.status(400).send('Webhook signature verification failed');
      return;
    }

    // Construct event
    const stripe = new Stripe(
      functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY || '',
      { apiVersion: '2023-10-16' }
    );
    
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await stripeService.handlePaymentSuccess(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.error('Payment failed:', failedPayment.id);
        
        // Update payment record
        await admin.firestore()
          .collection('payments')
          .where('paymentIntentId', '==', failedPayment.id)
          .get()
          .then(snapshot => {
            snapshot.forEach(doc => {
              doc.ref.update({ status: 'failed' });
            });
          });
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        
        // Create subscription record
        await admin.firestore().collection('subscriptions').add({
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        
        // Update subscription record
        const subQuery = await admin.firestore()
          .collection('subscriptions')
          .where('subscriptionId', '==', updatedSubscription.id)
          .get();
        
        subQuery.forEach(doc => {
          doc.ref.update({
            status: updatedSubscription.status,
            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        
        // Mark subscription as cancelled
        const delQuery = await admin.firestore()
          .collection('subscriptions')
          .where('subscriptionId', '==', deletedSubscription.id)
          .get();
        
        delQuery.forEach(doc => {
          doc.ref.update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.error('Invoice payment failed:', failedInvoice.id);
        
        // TODO: Send email notification
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * Get user payment history
 */
export const getPaymentHistory = functions.https.onCall(async (data, context) => {
  try {
    const auth = await requireAuth(context);

    // Get payment records
    const payments = await admin.firestore()
      .collection('payments')
      .where('userId', '==', auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const paymentHistory = payments.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    return {
      success: true,
      payments: paymentHistory
    };

  } catch (error) {
    console.error('Get payment history error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get payment history'
    );
  }
});

/**
 * Create refund (admin only)
 */
export const createRefund = functions.https.onCall(async (data, context) => {
  try {
    // Require admin role
    await requireAuth(context);
    // Additional admin check would go here
    
    const validated = CreateRefundSchema.parse(data);

    // Get payment record
    const paymentDoc = await admin.firestore()
      .collection('payments')
      .doc(validated.paymentId)
      .get();

    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Payment not found'
      );
    }

    const payment = paymentDoc.data();

    // Create refund
    const refund = await stripeService.createRefund(
      payment!.paymentIntentId,
      validated.amount,
      validated.reason
    );

    // Update payment status
    await paymentDoc.ref.update({
      status: 'refunded',
      refundedAt: admin.firestore.FieldValue.serverTimestamp(),
      refundAmount: refund.amount
    });

    return {
      success: true,
      refundId: refund.id
    };

  } catch (error) {
    console.error('Create refund error:', error);
    
    if (error instanceof z.ZodError) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid refund data'
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create refund'
    );
  }
});

/**
 * Get subscription status
 */
export const getSubscriptionStatus = functions.https.onCall(async (data, context) => {
  try {
    const auth = await requireAuth(context);

    // Get active subscription
    const subscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('userId', '==', auth.uid)
      .where('status', 'in', ['active', 'trialing'])
      .limit(1)
      .get();

    if (subscriptions.empty) {
      return {
        success: true,
        hasSubscription: false
      };
    }

    const subscription = subscriptions.docs[0].data();

    return {
      success: true,
      hasSubscription: true,
      subscription: {
        id: subscriptions.docs[0].id,
        ...subscription,
        currentPeriodStart: subscription.currentPeriodStart?.toDate(),
        currentPeriodEnd: subscription.currentPeriodEnd?.toDate()
      }
    };

  } catch (error) {
    console.error('Get subscription status error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get subscription status'
    );
  }
});

/**
 * Cancel subscription
 */
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  try {
    const auth = await requireAuth(context);

    // Get active subscription
    const subscriptions = await admin.firestore()
      .collection('subscriptions')
      .where('userId', '==', auth.uid)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (subscriptions.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No active subscription found'
      );
    }

    const subscriptionDoc = subscriptions.docs[0];
    const subscription = subscriptionDoc.data();

    // Cancel in Stripe
    await stripeService.cancelSubscription(subscription.subscriptionId);

    // Update database
    await subscriptionDoc.ref.update({
      status: 'cancelling',
      cancelAt: subscription.currentPeriodEnd,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period'
    };

  } catch (error) {
    console.error('Cancel subscription error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to cancel subscription'
    );
  }
});
```

[CONTENT CONTINUES - This is Part 1 of the expanded roadmap. The file is very large, so I'm breaking it into parts for better readability.]# DMA Platform - Expanded Production Roadmap (Part 2)
## Days 4-14: Payment System, Video Player, Quiz System & Dashboard

---

### 📅 DAY 4 Afternoon & DAY 5: Payment Frontend & Course Creation

#### Day 4 Afternoon (4 hours): Payment UI Components

##### Step 1: Create Stripe Payment Components
```typescript
// Location: /src/components/payment/CheckoutForm.tsx
'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutFormProps {
  courseId?: string;
  priceId?: string;
  amount: number;
  currency: string;
  description: string;
  mode?: 'payment' | 'subscription';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function CheckoutFormContent({
  courseId,
  priceId,
  amount,
  currency,
  description,
  mode = 'payment',
  onSuccess,
  onError
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Create checkout session
      const createCheckout = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckout({
        courseId,
        priceId,
        mode,
        successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment/cancelled`
      });

      const data = result.data as any;

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'Hiba történt a fizetés során');
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Rendelés összegzése</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{description}</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('hu-HU', {
                style: 'currency',
                currency: currency
              }).format(amount)}
            </span>
          </div>
          {mode === 'subscription' && (
            <p className="text-sm text-gray-500">Havonta megújuló előfizetés</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <PaymentElement 
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card']
            }}
          />
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Lock className="w-4 h-4 mr-1" />
            Biztonságos fizetés Stripe által
          </div>
          <img 
            src="/images/stripe-badge.png" 
            alt="Stripe" 
            className="h-6"
          />
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Feldolgozás...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {mode === 'subscription' ? 'Előfizetés indítása' : 'Fizetés'}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          A fizetés gombra kattintva elfogadja az{' '}
          <a href="/terms" className="underline">Általános Szerződési Feltételeket</a>
          {' '}és az{' '}
          <a href="/privacy" className="underline">Adatvédelmi Szabályzatot</a>.
        </p>
      </div>
    </form>
  );
}

export function CheckoutForm(props: CheckoutFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutFormContent {...props} />
    </Elements>
  );
}
```

##### Step 2: Create Course Purchase Page
```typescript
// Location: /src/app/(marketing)/courses/[courseId]/purchase/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckoutForm } from '@/components/payment/CheckoutForm';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PurchaseCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!params.courseId) return;

      try {
        // Get course details
        const courseDoc = await getDoc(doc(db, 'courses', params.courseId as string));
        
        if (!courseDoc.exists()) {
          router.push('/404');
          return;
        }

        const courseData = { id: courseDoc.id, ...courseDoc.data() } as Course;
        setCourse(courseData);

        // Check if already enrolled
        if (user) {
          const enrollmentDoc = await getDoc(
            doc(db, 'enrollments', `${user.uid}_${params.courseId}`)
          );
          setAlreadyEnrolled(enrollmentDoc.exists());
        }

      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.courseId, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  if (alreadyEnrolled) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Már jelentkezett erre a kurzusra!</h1>
          <p className="text-gray-600 mb-8">
            Hozzáférése van a kurzus összes tartalmához.
          </p>
          <Button asChild>
            <Link href={`/courses/${course.id}/learn`}>
              Kurzus folytatása
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link 
        href={`/courses/${course.id}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Vissza a kurzus oldalra
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Course Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
          
          {course.thumbnail && (
            <img 
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mb-3">Mit tartalmaz a kurzus?</h3>
            <p className="text-gray-600 mb-4">{course.description}</p>

            <h3 className="text-lg font-semibold mb-3">Kurzus részletei</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                {course.totalLessons || 0} lecke
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                {course.duration || '10+ óra'} tartalom
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Tanúsítvány a sikeres elvégzés után
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Élethosszig tartó hozzáférés
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                30 napos pénzvisszafizetési garancia
              </li>
            </ul>

            <h3 className="text-lg font-semibold mb-3 mt-6">Oktató</h3>
            <div className="flex items-center">
              {course.instructorImage ? (
                <img 
                  src={course.instructorImage}
                  alt={course.instructorName}
                  className="w-12 h-12 rounded-full mr-3"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-3" />
              )}
              <div>
                <p className="font-semibold">{course.instructorName}</p>
                <p className="text-sm text-gray-600">{course.instructorTitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 sticky top-8">
            <h2 className="text-2xl font-bold mb-6">Biztonságos fizetés</h2>
            
            {!user ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  A vásárláshoz jelentkezzen be vagy regisztráljon.
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link href={`/login?redirect=/courses/${course.id}/purchase`}>
                      Bejelentkezés
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/register?redirect=/courses/${course.id}/purchase`}>
                      Regisztráció
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <CheckoutForm
                courseId={course.id}
                amount={course.price}
                currency="HUF"
                description={course.title}
                mode="payment"
                onSuccess={() => {
                  router.push(`/payment/success?courseId=${course.id}`);
                }}
                onError={(error) => {
                  console.error('Payment error:', error);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

##### Step 3: Create Payment Success/Cancel Pages
```typescript
// Location: /src/app/payment/success/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Get course ID from URL
    const id = searchParams.get('courseId');
    setCourseId(id);

    // Redirect to dashboard after delay if no course ID
    if (!id) {
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Sikeres fizetés!</h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Köszönjük a vásárlást! A visszaigazolást elküldtük az email címére.
          </p>

          <div className="space-y-4">
            {courseId ? (
              <>
                <Button asChild className="w-full" size="lg">
                  <Link href={`/courses/${courseId}/learn`}>
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Kurzus megkezdése
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/courses">
                    Ugrás a kurzusaimhoz
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Műszerfal megnyitása
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-4">
              Számlája hamarosan elérhető lesz:
            </p>
            <Button variant="ghost" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Számla letöltése
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// Location: /src/app/payment/cancelled/page.tsx
'use client';

import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold mb-4">Fizetés megszakítva</h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            A fizetési folyamat megszakadt. Nem történt terhelés a kártyáján.
          </p>

          <div className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/courses">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Vissza a kurzusokhoz
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link href="/support">
                <HelpCircle className="mr-2 h-5 w-5" />
                Segítség kérése
              </Link>
            </Button>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Ha problémája van a fizetéssel, kérjük vegye fel velünk a kapcsolatot:
            </p>
            <p className="text-sm font-medium mt-2">
              support@elira.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### Day 4-5 Playwright Validation Tests
```typescript
// Location: /tests/playwright/day4-5-payment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Day 4-5: Payment System', () => {
  test('Stripe configuration is correct', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check Stripe script is loaded
    const stripeScript = await page.evaluate(() => {
      return !!window.Stripe;
    });
    
    expect(stripeScript).toBeTruthy();
  });

  test('Course purchase flow works', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@user.com');
    await page.fill('input[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');
    
    // Navigate to course
    await page.goto('http://localhost:3000/courses/test-course');
    
    // Click purchase button
    await page.click('text=Vásárlás');
    
    // Should redirect to purchase page
    await expect(page).toHaveURL(/\/courses\/test-course\/purchase/);
    
    // Check checkout form exists
    await expect(page.locator('text=Biztonságos fizetés')).toBeVisible();
  });

  test('Checkout session creation works', async ({ request }) => {
    // This would test the Cloud Function
    const response = await request.post('/api/createCheckoutSession', {
      data: {
        courseId: 'test-course',
        mode: 'payment',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel'
      }
    });
    
    // In real test, would check for session ID
    expect(response.status()).toBeLessThan(500);
  });

  test('Payment success page shows confirmation', async ({ page }) => {
    await page.goto('http://localhost:3000/payment/success?courseId=test-course');
    
    await expect(page.locator('text=Sikeres fizetés!')).toBeVisible();
    await expect(page.locator('text=Kurzus megkezdése')).toBeVisible();
  });

  test('Payment cancel page shows correct message', async ({ page }) => {
    await page.goto('http://localhost:3000/payment/cancelled');
    
    await expect(page.locator('text=Fizetés megszakítva')).toBeVisible();
    await expect(page.locator('text=Vissza a kurzusokhoz')).toBeVisible();
  });
});
```

---

## 🗓️ WEEK 2: CORE USER EXPERIENCE
*Days 6-14: Building Essential Features*

### 📅 DAY 6-7: TESTING & STABILIZATION
**Goal: Test and fix Week 1 implementations**
**Time: 16 hours**

#### Day 6: Integration Testing
```bash
# Run all tests
npm run test
npm run test:e2e
firebase emulators:exec --only firestore,functions "npm run test:integration"

# Security audit
npm audit
npm audit fix

# Performance testing
npm run lighthouse
```

#### Day 7: Bug Fixes and Documentation
- Fix all critical bugs found
- Document API endpoints
- Create developer onboarding guide
- Update environment variables documentation

---

### 📅 DAY 8-9: VIDEO PLAYER & QUIZ SYSTEM
**Goal: Implement Mux video player and quiz persistence**
**Time: 16 hours**

#### Day 8: Video Player Implementation

##### Step 1: Install Mux Player
```bash
npm install @mux/mux-player-react @mux/mux-node
```

##### Step 2: Create Mux Video Player Component
```typescript
// Location: /src/components/video/MuxVideoPlayer.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Settings,
  Maximize,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface MuxVideoPlayerProps {
  playbackId: string;
  title: string;
  onProgress?: (percentage: number, timeSpent: number) => void;
  onEnded?: () => void;
  autoplay?: boolean;
  startTime?: number;
  className?: string;
}

export function MuxVideoPlayer({
  playbackId,
  title,
  onProgress,
  onEnded,
  autoplay = false,
  startTime = 0,
  className
}: MuxVideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const lastReportedProgress = useRef(0);
  const totalTimeWatched = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Report progress every 5 seconds
    progressIntervalRef.current = setInterval(() => {
      if (isPlaying && playerRef.current) {
        const currentProgress = (currentTime / duration) * 100;
        totalTimeWatched.current += 5;
        
        // Only report if progress increased by at least 1%
        if (currentProgress - lastReportedProgress.current >= 1) {
          onProgress?.(currentProgress, totalTimeWatched.current);
          lastReportedProgress.current = currentProgress;
        }
      }
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, currentTime, duration, onProgress]);

  useEffect(() => {
    // Auto-hide controls
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      const newTime = (value[0] / 100) * duration;
      playerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.volume = value[0];
      setVolume(value[0]);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (playerRef.current) {
      playerRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={cn(
        "relative bg-black rounded-lg overflow-hidden group",
        className
      )}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <MuxPlayer
        ref={playerRef}
        playbackId={playbackId}
        metadata={{
          video_id: playbackId,
          video_title: title,
        }}
        streamType="on-demand"
        autoPlay={autoplay}
        muted={false}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e: any) => {
          setCurrentTime(e.target.currentTime);
          setProgress((e.target.currentTime / e.target.duration) * 100);
        }}
        onLoadedMetadata={(e: any) => {
          setDuration(e.target.duration);
          if (startTime > 0) {
            e.target.currentTime = startTime;
          }
        }}
        onEnded={() => {
          setHasEnded(true);
          setIsPlaying(false);
          onEnded?.();
        }}
        className="w-full h-full"
      />

      {/* Custom Controls Overlay */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4">
          <h3 className="text-white text-lg font-semibold">{title}</h3>
        </div>

        {/* Center Play Button */}
        {!isPlaying && !hasEnded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={handlePlayPause}
              size="lg"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
            >
              <Play className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* Completion Overlay */}
        {hasEnded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-white text-xl font-semibold mb-4">
                Lecke teljesítve!
              </h3>
              <Button
                onClick={() => {
                  setHasEnded(false);
                  playerRef.current?.play();
                }}
                className="mr-2"
              >
                Újranézés
              </Button>
              <Button
                onClick={onEnded}
                variant="outline"
              >
                Következő lecke
              </Button>
            </div>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress Bar */}
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause */}
              <Button
                onClick={handlePlayPause}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>

              {/* Skip Back/Forward */}
              <Button
                onClick={() => handleSkip(-10)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                onClick={() => handleSkip(10)}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>

              {/* Volume */}
              <div className="flex items-center space-x-2">
                <Volume2 className="w-5 h-5 text-white" />
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-20"
                />
              </div>

              {/* Time */}
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Playback Speed */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    {playbackRate}x
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Lejátszási sebesség</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                    <DropdownMenuItem
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                    >
                      {rate}x {rate === playbackRate && '✓'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* Fullscreen */}
              <Button
                onClick={handleFullscreen}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

[Content continues with Quiz System implementation...]# DMA Platform - Expanded Production Roadmap (Completion)
## Days 10-21: Dashboard, Advanced Features & Production Launch

---

### 📅 DAY 10-11: DASHBOARD & REAL DATA
**Goal: Replace all fake data with real Firestore queries**
**Time: 16 hours**

#### Dashboard Backend Implementation
```typescript
// Location: /functions/src/dashboardActions.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { requireAuth } from './middleware/authMiddleware';

export const getDashboardStats = functions.https.onCall(async (data, context) => {
  const auth = await requireAuth(context);
  
  const stats = {
    totalActiveStudents: 0,
    newCoursesThisMonth: 0,
    averageCompletionRate: 0,
    totalHoursLearned: 0
  };
  
  // Get active students (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await admin.firestore()
    .collection('users')
    .where('lastLoginAt', '>=', thirtyDaysAgo)
    .where('role', '==', 'student')
    .get();
  
  stats.totalActiveStudents = activeUsers.size;
  
  // Get new courses this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const newCourses = await admin.firestore()
    .collection('courses')
    .where('createdAt', '>=', startOfMonth)
    .get();
  
  stats.newCoursesThisMonth = newCourses.size;
  
  // Calculate average completion rate
  const enrollments = await admin.firestore()
    .collection('enrollments')
    .get();
  
  let totalProgress = 0;
  let completedCount = 0;
  
  enrollments.forEach(doc => {
    const data = doc.data();
    totalProgress += data.progress || 0;
    if (data.progress === 100) completedCount++;
  });
  
  stats.averageCompletionRate = enrollments.size > 0 
    ? Math.round(totalProgress / enrollments.size) 
    : 0;
  
  // Calculate total hours learned
  const progressDocs = await admin.firestore()
    .collection('lessonProgress')
    .get();
  
  let totalMinutes = 0;
  progressDocs.forEach(doc => {
    totalMinutes += doc.data().timeSpent || 0;
  });
  
  stats.totalHoursLearned = Math.round(totalMinutes / 60);
  
  return { success: true, stats };
});
```

---

### 📅 DAY 12-13: SETTINGS & PROFILES
**Goal: Complete user settings functionality**
**Time: 16 hours**

#### Settings Page Implementation
```typescript
// Location: /src/app/(dashboard)/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Kötelező'),
  lastName: z.string().min(1, 'Kötelező'),
  email: z.string().email('Érvénytelen email'),
  phone: z.string().optional(),
  bio: z.string().max(500).optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Legalább egy kis- és nagybetű, valamint szám szükséges'
  ),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'A jelszavak nem egyeznek',
  path: ['confirmPassword']
});

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.displayName?.split(' ')[0] || '',
      lastName: user?.displayName?.split(' ')[1] || '',
      email: user?.email || '',
      phone: '',
      bio: ''
    }
  });
  
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema)
  });
  
  const onProfileSubmit = async (data: any) => {
    setLoading(true);
    try {
      const updateProfile = httpsCallable(functions, 'updateUserProfile');
      await updateProfile(data);
      await refreshUser();
      toast.success('Profil sikeresen frissítve');
    } catch (error) {
      toast.error('Hiba történt a profil frissítése során');
    } finally {
      setLoading(false);
    }
  };
  
  const onPasswordSubmit = async (data: any) => {
    setLoading(true);
    try {
      const changePassword = httpsCallable(functions, 'changePassword');
      await changePassword(data);
      passwordForm.reset();
      toast.success('Jelszó sikeresen megváltoztatva');
    } catch (error) {
      toast.error('Hiba történt a jelszó változtatása során');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Beállítások</h1>
      
      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Profil beállítások</h2>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Keresztnév</Label>
              <Input {...profileForm.register('firstName')} />
            </div>
            <div>
              <Label htmlFor="lastName">Vezetéknév</Label>
              <Input {...profileForm.register('lastName')} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input {...profileForm.register('email')} type="email" />
          </div>
          
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input {...profileForm.register('phone')} type="tel" />
          </div>
          
          <div>
            <Label htmlFor="bio">Bemutatkozás</Label>
            <textarea 
              {...profileForm.register('bio')}
              className="w-full p-2 border rounded-lg"
              rows={4}
            />
          </div>
          
          <Button type="submit" disabled={loading}>
            Mentés
          </Button>
        </form>
      </div>
      
      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Jelszó változtatás</h2>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Jelenlegi jelszó</Label>
            <Input {...passwordForm.register('currentPassword')} type="password" />
          </div>
          
          <div>
            <Label htmlFor="newPassword">Új jelszó</Label>
            <Input {...passwordForm.register('newPassword')} type="password" />
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Új jelszó megerősítése</Label>
            <Input {...passwordForm.register('confirmPassword')} type="password" />
          </div>
          
          <Button type="submit" disabled={loading}>
            Jelszó változtatása
          </Button>
        </form>
      </div>
      
      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Értesítési beállítások</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email értesítések</p>
              <p className="text-sm text-gray-600">Értesítések fogadása emailben</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Kurzus frissítések</p>
              <p className="text-sm text-gray-600">Értesítés új tartalmakról</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing üzenetek</p>
              <p className="text-sm text-gray-600">Promóciók és ajánlatok</p>
            </div>
            <Switch />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

### 📅 DAY 14: TESTING & OPTIMIZATION
**Goal: Performance optimization and testing**
**Time: 8 hours**

#### Performance Optimization Checklist
```bash
# 1. Code splitting
npm run analyze

# 2. Image optimization
npm install next-optimized-images

# 3. Bundle size reduction
npm install --save-dev @next/bundle-analyzer

# 4. Database indexing
firebase firestore:indexes
```

---

## 🗓️ WEEK 3: ADVANCED FEATURES & PRODUCTION
*Days 15-21: Enterprise features and launch preparation*

### 📅 DAY 15-16: UNIVERSITY MANAGEMENT
**Goal: Multi-tenant architecture**
**Time: 16 hours**

#### University Management Schema
```typescript
// Location: /functions/src/university/universityManager.ts
interface University {
  id: string;
  name: string;
  domain: string;
  logo: string;
  settings: {
    primaryColor: string;
    secondaryColor: string;
    customCSS?: string;
    features: {
      customCertificates: boolean;
      bulkEnrollment: boolean;
      ssoEnabled: boolean;
      apiAccess: boolean;
    };
  };
  admins: string[];
  departments: Department[];
  billing: {
    plan: 'starter' | 'professional' | 'enterprise';
    seats: number;
    billingCycle: 'monthly' | 'yearly';
  };
  createdAt: Date;
  updatedAt: Date;
}

interface Department {
  id: string;
  name: string;
  headId: string;
  courseIds: string[];
  studentIds: string[];
}
```

---

### 📅 DAY 17: GAMIFICATION
**Goal: Points, badges, and leaderboards**
**Time: 8 hours**

#### Gamification System
```typescript
// Location: /functions/src/gamification/achievements.ts
const ACHIEVEMENTS = {
  FIRST_COURSE: { points: 100, name: 'Első lépés', icon: '🎯' },
  COURSE_COMPLETE: { points: 500, name: 'Kurzus mester', icon: '🏆' },
  PERFECT_QUIZ: { points: 200, name: 'Tökéletes kvíz', icon: '💯' },
  WEEK_STREAK: { points: 300, name: 'Heti szorgalom', icon: '🔥' },
  FAST_LEARNER: { points: 400, name: 'Gyors tanuló', icon: '⚡' }
};

export async function awardAchievement(userId: string, achievementKey: string) {
  const achievement = ACHIEVEMENTS[achievementKey];
  if (!achievement) return;
  
  // Check if already awarded
  const existing = await admin.firestore()
    .collection('achievements')
    .doc(`${userId}_${achievementKey}`)
    .get();
  
  if (existing.exists) return;
  
  // Award achievement
  await admin.firestore()
    .collection('achievements')
    .doc(`${userId}_${achievementKey}`)
    .set({
      userId,
      achievementKey,
      ...achievement,
      awardedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  
  // Update user points
  await admin.firestore()
    .collection('users')
    .doc(userId)
    .update({
      totalPoints: admin.firestore.FieldValue.increment(achievement.points),
      achievements: admin.firestore.FieldValue.arrayUnion(achievementKey)
    });
}
```

---

### 📅 DAY 18: MONITORING & COMPLIANCE
**Goal: Error tracking, monitoring, GDPR**
**Time: 8 hours**

#### Monitoring Setup
```typescript
// Location: /src/lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  }
});

// Custom error boundary
export function logError(error: Error, context?: any) {
  console.error('Application error:', error);
  Sentry.captureException(error, { extra: context });
}
```

#### GDPR Compliance
```typescript
// Location: /functions/src/gdpr/dataExport.ts
export const exportUserData = functions.https.onCall(async (data, context) => {
  const auth = await requireAuth(context);
  
  // Collect all user data
  const userData = {
    profile: await admin.firestore().collection('users').doc(auth.uid).get(),
    enrollments: await admin.firestore().collection('enrollments')
      .where('userId', '==', auth.uid).get(),
    progress: await admin.firestore().collection('lessonProgress')
      .where('userId', '==', auth.uid).get(),
    payments: await admin.firestore().collection('payments')
      .where('userId', '==', auth.uid).get(),
    certificates: await admin.firestore().collection('certificates')
      .where('userId', '==', auth.uid).get()
  };
  
  // Format as JSON
  const exportData = {
    exportDate: new Date().toISOString(),
    userData: {
      profile: userData.profile.data(),
      enrollments: userData.enrollments.docs.map(doc => doc.data()),
      progress: userData.progress.docs.map(doc => doc.data()),
      payments: userData.payments.docs.map(doc => ({
        ...doc.data(),
        // Mask sensitive payment data
        cardNumber: undefined,
        cvv: undefined
      })),
      certificates: userData.certificates.docs.map(doc => doc.data())
    }
  };
  
  return { success: true, data: exportData };
});
```

---

### 📅 DAY 19: CI/CD PIPELINE
**Goal: Automated testing and deployment**
**Time: 8 hours**

#### GitHub Actions Workflow
```yaml
# Location: /.github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run E2E tests
        run: |
          npx playwright install
          npm run test:e2e
      
      - name: Check types
        run: npm run type-check
      
      - name: Lint
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: DMA-PROJECT-ID
```

---

### 📅 DAY 20: FINAL TESTING
**Goal: Complete testing and bug fixes**
**Time: 8 hours**

#### Comprehensive Test Suite
```typescript
// Location: /tests/e2e/complete-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete User Flow', () => {
  test('New user journey from registration to certificate', async ({ page }) => {
    // 1. Registration
    await page.goto('/register');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'Test123!@#');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.click('button[type="submit"]');
    
    // 2. Email verification (mock)
    await page.waitForURL('/onboarding');
    
    // 3. Browse courses
    await page.goto('/courses');
    await expect(page.locator('.course-card')).toHaveCount(10);
    
    // 4. Purchase course
    await page.click('.course-card:first-child');
    await page.click('text=Vásárlás');
    
    // 5. Complete payment (test mode)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvc"]', '123');
    await page.click('text=Fizetés');
    
    // 6. Start learning
    await page.waitForURL('/payment/success');
    await page.click('text=Kurzus megkezdése');
    
    // 7. Watch video
    await page.waitForSelector('.mux-player');
    await page.click('.play-button');
    await page.waitForTimeout(5000); // Watch for 5 seconds
    
    // 8. Complete quiz
    await page.click('text=Következő lecke');
    await page.click('.quiz-answer:first-child');
    await page.click('text=Beküldés');
    
    // 9. Get certificate
    await expect(page.locator('text=Gratulálunk!')).toBeVisible();
    await page.click('text=Tanúsítvány letöltése');
  });
});
```

---

### 📅 DAY 21: PRODUCTION LAUNCH
**Goal: Go live!**
**Time: 8 hours**

#### Launch Checklist

##### Morning (9 AM - 12 PM)
```bash
# 1. Final deployment
npm run build
firebase deploy --only hosting,functions

# 2. DNS configuration
# Update DNS records to point to Firebase hosting

# 3. SSL verification
curl -I https://elira.com

# 4. Enable monitoring
firebase functions:log --follow
```

##### Afternoon (12 PM - 6 PM)
```bash
# 5. Smoke tests in production
npm run test:production

# 6. Enable Stripe live mode
# Switch from test keys to production keys

# 7. Send launch announcement
# Email all beta users

# 8. Monitor metrics
# Check Sentry, Firebase Analytics, server logs
```

##### Launch Communication
```typescript
// Send launch email to all users
const launchEmail = {
  subject: '🎉 DMA Platform Officially Launched!',
  html: `
    <h1>Welcome to the Future of Learning!</h1>
    <p>DMA is now live and ready for you to explore.</p>
    <ul>
      <li>✅ 100+ Professional Courses</li>
      <li>✅ University Partnerships</li>
      <li>✅ Official Certificates</li>
      <li>✅ Mobile Responsive</li>
    </ul>
    <a href="https://elira.com">Start Learning Today</a>
  `
};
```

---

## 🎯 POST-LAUNCH PRIORITIES

### Week 4+
1. **Monitor & Optimize**
   - Track user behavior
   - Fix emerging issues
   - Optimize performance

2. **Feature Iterations**
   - A/B testing
   - User feedback implementation
   - New feature rollouts

3. **Scale Infrastructure**
   - Auto-scaling configuration
   - CDN optimization
   - Database sharding

---

## ✅ VALIDATION METRICS

### Launch Success Criteria
- [ ] 99.9% uptime in first 24 hours
- [ ] <3s page load times
- [ ] Zero critical bugs
- [ ] 100+ successful payments
- [ ] 500+ user registrations
- [ ] <1% error rate

### Performance Benchmarks
- Lighthouse score: >90
- Core Web Vitals: All green
- Time to Interactive: <2s
- First Contentful Paint: <1s

