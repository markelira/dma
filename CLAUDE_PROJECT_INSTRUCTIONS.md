# DMA E-Learning Platform - Claude Project Instructions

## Project Overview

**DMA** is a B2B2C e-learning platform built with Next.js 15, TypeScript, Firebase, and modern web technologies. The platform enables universities and companies to offer professional development courses with video streaming, interactive assessments, and multi-tenant support.

**Current Phase:** Weekend Sprint - Implementing 5 critical features
**Timeline:** Weekend completion target
**Developer:** Hungarian-speaking team
**Language:** All communication in Hungarian, code/comments in English

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/UI + Radix UI
- **State Management:** Zustand (global), TanStack Query (server state)
- **Forms:** React Hook Form + Zod validation
- **Video Player:** Mux Player React

### Backend
- **Platform:** Firebase (Cloud Functions v2, Firestore, Storage, Auth)
- **Runtime:** Node.js 18
- **Functions:** TypeScript with ES modules
- **Email:** SendGrid (primary) + Nodemailer (fallback)
- **Payments:** Stripe
- **Video:** Mux (primary) + Firebase Storage (fallback)

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Testing:** Jest + Playwright
- **Git:** GitHub repository

---

## Project Structure

```
elira/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (admin)/admin/            # Admin dashboard
│   │   │   └── courses/create/       # Course creation wizard
│   │   ├── (auth)/                   # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/             # ⚠️ MODIFY: Remove company registration
│   │   ├── (company)/company/        # B2B Company dashboard
│   │   ├── (dashboard)/dashboard/    # Student dashboard
│   │   ├── (marketing)/              # Public pages
│   │   │   └── courses/[courseId]/   # ⚠️ MODIFY: Course detail pages
│   │   └── (learning)/courses/       # Course player
│   │       └── [courseId]/lessons/[lessonId]/
│   │
│   ├── components/                   # React components
│   │   ├── auth/                     # Auth components
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── AccountTypeSelector.tsx  # ⚠️ To be commented out
│   │   │   └── CompanyRegisterForm.tsx  # ⚠️ To be commented out
│   │   ├── course/                   # Course display components
│   │   │   ├── CourseDetailHero.tsx
│   │   │   ├── CourseCurriculumSection.tsx
│   │   │   └── CourseEnrollmentCard.tsx
│   │   ├── course-creation/          # ⚠️ MODIFY: Course creation components
│   │   │   ├── CourseCreationWizard.tsx
│   │   │   ├── CourseBasicInfoStep.tsx      # ⚠️ ADD marketing fields
│   │   │   ├── CurriculumStructureStep.tsx
│   │   │   ├── MuxVideoUploader.tsx         # ✅ DONE
│   │   │   └── LessonContentEditorModal.tsx # ✅ DONE
│   │   ├── payment/                  # ⚠️ MODIFY: Payment components
│   │   │   ├── CheckoutForm.tsx
│   │   │   └── EnhancedCheckoutButton.tsx
│   │   └── ui/                       # Shadcn/UI components
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCourseQueries.ts
│   │   └── useEnrollmentStatus.ts
│   │
│   ├── lib/                          # Utilities and configs
│   │   ├── firebase.ts               # Firebase client config
│   │   ├── stripe.ts                 # Stripe client config
│   │   └── payment.ts                # Payment utilities
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts
│   │   └── courseWizardStore.ts
│   │
│   └── types/                        # TypeScript types
│       ├── index.ts
│       ├── auth.ts
│       └── payment.ts
│
├── functions/                        # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                  # ⚠️ MODIFY: Main functions export
│   │   │   # Contains:
│   │   │   # - firebaseLogin ✅
│   │   │   # - requestPasswordReset ✅
│   │   │   # - sendEmailVerification ✅
│   │   │   # - SendGrid integration ✅
│   │   │
│   │   ├── muxActions.ts             # ✅ DONE: Mux video upload
│   │   ├── muxWebhook.ts             # ✅ DONE: Mux webhook handler
│   │   │
│   │   ├── stripe/                   # ⚠️ CREATE: Stripe integration
│   │   │   ├── createCheckoutSession.ts  # ⚠️ TODO
│   │   │   ├── stripeWebhook.ts          # ⚠️ TODO
│   │   │   └── handleEnrollment.ts       # ⚠️ TODO
│   │   │
│   │   └── company/                  # Company B2B features
│   │       ├── createCompany.ts
│   │       ├── employeeInvite.ts
│   │       └── sendReminder.ts
│   │
│   └── package.json
│
├── public/                           # Static assets
├── docs/                             # Documentation
│   └── expanded_production_roadmap.md
│
├── firebase.json                     # Firebase config
├── firestore.rules                   # Firestore security rules
├── storage.rules                     # Storage security rules
├── .env.local                        # Local environment variables
└── package.json                      # Project dependencies
```

---

## Current Features Status

### ✅ COMPLETED FEATURES

#### 1. Mux Video Integration (90%)
**Location:**
- `functions/src/muxActions.ts` - Upload URL generation, status checking
- `functions/src/muxWebhook.ts` - Webhook handler for video.asset.ready
- `src/components/course-creation/MuxVideoUploader.tsx` - Upload UI
- `src/components/course-creation/LessonContentEditorModal.tsx` - Video editor

**Implementation:**
- Direct upload to Mux from browser
- Automatic playbackId extraction via webhook
- Development mode with mock uploads
- Firestore lesson update with muxAssetId and muxPlaybackId

**What's Missing:**
- Production Mux credentials (MUX_TOKEN_ID, MUX_TOKEN_SECRET, MUX_WEBHOOK_SECRET)
- Webhook URL registration in Mux dashboard

#### 2. SendGrid Email Integration (95%)
**Location:** `functions/src/index.ts` (lines 1-300)

**Implementation:**
- SendGrid primary email provider
- Fallback chain: SendGrid → Brevo → Gmail → Ethereal
- Password reset emails (requestPasswordReset function)
- Email verification (sendEmailVerification function)
- Company invitation emails (company/employeeInvite.ts)

**What's Missing:**
- SendGrid API key configuration
- Sender domain verification

#### 3. Authentication System (100%)
**Location:**
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx` ⚠️ Needs modification
- `src/components/auth/RegisterForm.tsx`
- `functions/src/index.ts` - firebaseLogin function

**Implementation:**
- Firebase Authentication integration
- Role-based access control (STUDENT, INSTRUCTOR, ADMIN, COMPANY_ADMIN)
- Protected routes with auth guards
- JWT token management

---

## Weekend Sprint Features

### ⚠️ FEATURES TO IMPLEMENT

#### 1. Stripe Payment Integration (P0 - Critical)
**Estimated Time:** 4 hours

**Tasks:**
1. Create `functions/src/stripe/createCheckoutSession.ts`
2. Create `functions/src/stripe/stripeWebhook.ts`
3. Update `src/components/payment/CheckoutForm.tsx`
4. Update `src/app/(marketing)/courses/[courseId]/ClientCourseDetailPage.tsx`
5. Set up Stripe credentials
6. Register webhook URL

**Files to Create/Modify:**
```typescript
// functions/src/stripe/createCheckoutSession.ts
export const createCheckoutSession = onCall(async (request) => {
  // 1. Verify authentication
  // 2. Get course price from Firestore
  // 3. Create Stripe Checkout Session
  // 4. Return sessionId and url
})

// functions/src/stripe/stripeWebhook.ts
export const stripeWebhook = onRequest(async (req, res) => {
  // 1. Verify webhook signature
  // 2. Handle checkout.session.completed
  // 3. Create enrollment in Firestore
  // 4. Send confirmation email
})
```

#### 2. Course Detail Page - Marketing Content (P0 - Critical)
**Estimated Time:** 4 hours

**Current State:**
- Dynamic routing works: `/courses/[courseId]`
- Basic course info displays
- **PROBLEM:** Course creation doesn't save marketing/sales content

**Tasks:**
1. Add marketing fields to `CourseBasicInfoStep.tsx`
2. Update Firestore schema
3. Update `createCourse` and `updateCourse` functions
4. Update `ClientCourseDetailPage.tsx` to display new fields

**Fields to Add:**
```typescript
interface CourseMarketingData {
  // SEO
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }

  // Marketing
  marketing: {
    shortDescription: string        // 160 chars for cards
    detailedDescription: string     // Rich text - teljes leírás
    whatYouWillLearn: string[]      // Bullet points
    requirements: string[]          // Prerequisites
    targetAudience: string[]        // Who is this for
    features: string[]              // Course features
    highlights: string[]            // Key highlights
  }

  // Guarantee
  guarantee: {
    enabled: boolean
    text: string
    days: number
  }

  // FAQ
  faq: Array<{
    question: string
    answer: string
  }>
}
```

**Files to Modify:**
```
src/components/course-creation/CourseBasicInfoStep.tsx
src/app/(marketing)/courses/[courseId]/ClientCourseDetailPage.tsx
functions/src/index.ts (createCourse, updateCourse)
```

#### 3. Register Page - Remove Company Registration (P0 - Critical)
**Estimated Time:** 10 minutes

**File:** `src/app/(auth)/register/page.tsx`

**Task:** Comment out or conditionally hide company registration option

**Approach 1 (Simple):**
```typescript
// Line 108-114: Remove AccountTypeSelector
// Set accountType to 'individual' by default
const [accountType, setAccountType] = useState<AccountType>('individual');

// Remove:
<AccountTypeSelector ... />
```

**Approach 2 (Keep code, disable UI):**
```typescript
// Line 114-120: Comment out CompanyRegisterForm
accountType === 'company' ? (
  /* TEMPORARILY DISABLED
  <CompanyRegisterForm ... />
  */
  <div className="text-center py-8">
    <p>Vállalati regisztráció hamarosan elérhető</p>
    <Button onClick={() => setAccountType(null)}>Vissza</Button>
  </div>
)
```

---

## Development Commands

### Local Development
```bash
# Start Next.js dev server
npm run dev

# Start Firebase emulators
firebase emulators:start

# Both together (recommended)
npm run dev & firebase emulators:start
```

### Firebase Functions
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:createCheckoutSession

# View logs
firebase functions:log

# Real-time logs
firebase functions:log --only createCheckoutSession
```

### Environment Configuration
```bash
# Set Firebase Functions config
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set mux.token_id="..."
firebase functions:config:set sendgrid.api_key="SG...."

# Get current config
firebase functions:config:get

# Unset a config
firebase functions:config:unset stripe.secret_key
```

### Firestore & Storage
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Deploy everything
firebase deploy
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Firestore rules tests
npm run test:firestore

# Linting
npm run lint
```

---

## Firestore Data Structure

### Collections

#### `users/{userId}`
```typescript
{
  id: string                    // Firebase Auth UID
  email: string
  firstName: string
  lastName: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_EMPLOYEE'
  profilePictureUrl?: string
  companyId?: string
  emailVerified: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `courses/{courseId}`
```typescript
{
  id: string
  title: string
  description: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  instructorId: string
  categoryId: string
  price: number                 // In cents (HUF)
  thumbnailUrl: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  language: string
  certificateEnabled: boolean
  enrollmentCount: number
  averageRating: number
  reviewCount: number

  // Learning objectives
  learningObjectives: string[]

  // ⚠️ TO ADD: Marketing fields
  seo?: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
  marketing?: {
    shortDescription: string
    detailedDescription: string
    whatYouWillLearn: string[]
    requirements: string[]
    targetAudience: string[]
    features: string[]
    highlights: string[]
  }
  guarantee?: {
    enabled: boolean
    text: string
    days: number
  }
  faq?: Array<{question: string, answer: string}>

  createdAt: Timestamp
  updatedAt: Timestamp
}

// Subcollections:
// - modules/{moduleId}
//   - lessons/{lessonId}
```

#### `courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
```typescript
{
  id: string
  title: string
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'PDF' | 'AUDIO' | 'READING'
  order: number

  // Video (Mux primary, Firebase Storage fallback)
  muxAssetId?: string           // ✅ Set during upload
  muxPlaybackId?: string        // ✅ Set by webhook
  muxStatus?: 'uploading' | 'processing' | 'ready' | 'error'
  videoUrl?: string             // Fallback or generated from playbackId

  // Content
  content?: string              // For TEXT, READING, AUDIO
  quiz?: LessonQuiz             // Structured quiz data
  pdfUrl?: string
  audioUrl?: string

  // Metadata
  description?: string
  durationSec?: number
  isFreePreview?: boolean
  resources?: Array<{name: string, url: string}>

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### `enrollments/{enrollmentId}`
```typescript
{
  id: string                    // Format: {userId}_{courseId}
  userId: string
  courseId: string
  progress: number              // 0-100
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  completedLessons: string[]    // Array of lesson IDs
  enrolledAt: Timestamp
  lastAccessedAt: Timestamp
  completedAt?: Timestamp
}
```

#### `payments/{paymentId}`
```typescript
{
  id: string
  userId: string
  courseId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  stripeSessionId: string
  stripePaymentIntentId?: string
  metadata: {
    userEmail: string
    courseTitle: string
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

---

## API Functions Reference

### Authentication Functions

#### `firebaseLogin`
**Location:** `functions/src/index.ts`
**Type:** Callable
```typescript
// Request
{ idToken: string }

// Response
{
  success: true,
  user: UserData,
  token: string
}
```

#### `requestPasswordReset`
**Location:** `functions/src/index.ts` (line 176)
**Type:** Callable
```typescript
// Request
{ email: string }

// Response
{
  success: true,
  message: string
}
```

### Mux Functions

#### `getMuxUploadUrl`
**Location:** `functions/src/muxActions.ts`
**Type:** Callable
**Auth Required:** Yes (INSTRUCTOR or ADMIN)
```typescript
// Request: {}
// Response: { success: true, id, url, assetId }
```

#### `getMuxAssetStatus`
**Location:** `functions/src/muxActions.ts`
**Type:** Callable
```typescript
// Request: { assetId: string }
// Response: { success: true, status, playbackId?, duration?, aspectRatio? }
```

#### `muxWebhook`
**Location:** `functions/src/muxWebhook.ts`
**Type:** HTTP Request
**URL:** `https://us-central1-[PROJECT-ID].cloudfunctions.net/muxWebhook`

### ⚠️ Stripe Functions (TO IMPLEMENT)

#### `createCheckoutSession` (TODO)
**Type:** Callable
**Auth Required:** Yes
```typescript
// Request
{ courseId: string, successUrl?: string, cancelUrl?: string }

// Response
{ success: true, sessionId: string, url: string }
```

#### `stripeWebhook` (TODO)
**Type:** HTTP Request
**URL:** `https://us-central1-[PROJECT-ID].cloudfunctions.net/stripeWebhook`
**Events:** checkout.session.completed, payment_intent.succeeded

---

## Environment Variables

### Frontend (.env.local)
```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Backend (Firebase Functions Config)
```bash
# Mux
firebase functions:config:set mux.token_id="YOUR_TOKEN_ID"
firebase functions:config:set mux.token_secret="YOUR_TOKEN_SECRET"
firebase functions:config:set mux.webhook_secret="YOUR_WEBHOOK_SECRET"

# Stripe
firebase functions:config:set stripe.secret_key="sk_test_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."

# SendGrid
firebase functions:config:set sendgrid.api_key="SG...."
firebase functions:config:set sendgrid.from_email="noreply@dma.hu"
```

---

## Implementation Priorities

### P0 - Critical (Must Complete)
1. **Remove Company Registration** (10 min)
2. **Stripe Checkout Session** (2 hours)
3. **Stripe Webhook Handler** (2 hours)
4. **SendGrid Configuration** (30 min)

### P1 - Important (Should Complete)
5. **Course Marketing Fields** (4 hours)
6. **Mux Production Setup** (30 min)
7. **Backend Deployment** (1 hour)

### P2 - Optional (Nice to Have)
8. **Email Templates** (2 hours)
9. **Frontend Deployment** (1 hour)

**Total Estimated Time:** ~19 hours

---

## Coding Standards

### TypeScript
- Always use strict mode
- No `any` types (use `unknown` if necessary)
- Explicit return types for functions
- Interfaces for data structures

### React Components
```typescript
'use client'  // Only if needed

import { ... } from '...'

interface Props {
  // props
}

export default function ComponentName({ props }: Props) {
  // Hooks at top
  // State
  // Effects
  // Handlers
  // Render
}
```

### Firebase Functions
```typescript
import { onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';

const InputSchema = z.object({
  field: z.string().min(1)
});

export const functionName = onCall({
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 120,
}, async (request) => {
  try {
    // 1. Auth check
    if (!request.auth) throw new Error('Auth required');

    // 2. Validate input
    const data = InputSchema.parse(request.data);

    // 3. Business logic
    const result = await doSomething(data);

    // 4. Return
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Error:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation error', details: error.errors };
    }

    return { success: false, error: error.message || 'Unknown error' };
  }
});
```

---

## Deployment Checklist

### Backend (Firebase)
- [ ] Build: `cd functions && npm run build`
- [ ] Set environment variables
- [ ] Deploy: `firebase deploy --only functions`
- [ ] Register webhooks (Stripe, Mux)
- [ ] Test webhooks

### Frontend (Vercel)
- [ ] Set environment variables
- [ ] Deploy: `vercel --prod`
- [ ] Configure custom domain
- [ ] Test all flows

---

## Quick File Locations Reference

**P0 - Stripe:**
- Create: `functions/src/stripe/createCheckoutSession.ts`
- Create: `functions/src/stripe/stripeWebhook.ts`
- Modify: `src/app/(marketing)/courses/[courseId]/ClientCourseDetailPage.tsx`

**P0 - Register:**
- Modify: `src/app/(auth)/register/page.tsx` (line 108-120)

**P1 - Course Marketing:**
- Modify: `src/components/course-creation/CourseBasicInfoStep.tsx`
- Modify: `functions/src/index.ts` (createCourse, updateCourse)
- Modify: `src/app/(marketing)/courses/[courseId]/ClientCourseDetailPage.tsx`

---

**Last Updated:** 2025-10-22
**Version:** 1.0
**Status:** Ready for Weekend Sprint
**Next Action:** Start with P0 tasks
