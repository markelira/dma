
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context
DMA is a B2B2C e-learning platform built with Next.js 15, TypeScript, Firebase, and Tailwind CSS. The platform enables universities to offer professional development courses with video streaming, interactive assessments, and multi-tenant support.

## Development Commands

### Essential Commands
```bash
# Development (starts emulators + Next.js dev server)
npm run dev

# Building & Deployment
npm run build                          # Build Next.js app (for Vercel)
git push origin main                   # Deploy frontend to Vercel (auto-deploy)
firebase deploy --only functions       # Deploy Cloud Functions only
firebase deploy --only firestore:rules # Deploy Firestore rules
firebase deploy --only firestore:indexes # Deploy Firestore indexes

# NOTE: Frontend is deployed to VERCEL (academion.hu), NOT Firebase Hosting
# Firebase Hosting is only used for local emulator testing

# Testing
npm run test                          # Run Jest tests
npm run test:watch                    # Run tests in watch mode
npm run test:firestore                # Test Firestore rules with emulator
npm run lint                          # Run ESLint

# Cloud Functions (from /functions directory)
cd functions && npm run build         # Build TypeScript functions
firebase functions:log                # View function logs
firebase functions:config:set key=val # Set function environment variables

# Database
npm run seed                          # Seed development data
firebase emulators:start              # Start all Firebase emulators
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **Database**: Firestore (NoSQL)
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **State**: Zustand (global), TanStack Query (server state)
- **Payments**: Stripe
- **Video**: Mux Player
- **Hosting**: Vercel (Frontend), Firebase (Backend only)

### Data Flow Architecture
```
User Action → React Component → Custom Hook → Cloud Function → Firestore
                    ↓                              ↓
              Zustand Store                 Email Service (SendGrid)
                    ↓                              ↓
              UI Update                    Stripe/Payment Processing
```

### Deployment Architecture
```
PRODUCTION SETUP:
┌──────────────────────────────────────────────────┐
│  academion.hu (Custom Domain)                    │
│         ↓                                         │
│    VERCEL (Frontend Hosting)                     │
│    - Auto-deploy from GitHub main branch         │
│    - Domain: academion.hu                        │
│    - Framework: Next.js 15                       │
│         ↓                                         │
│    NEXT.JS APP                                   │
│    - All routes: /courses, /dashboard, /admin   │
│    - Components: /src/components                 │
│         ↓                                         │
│    FIREBASE (Backend Only)                       │
│    - Firestore (database)                        │
│    - Cloud Functions (API)                       │
│    - Authentication (users)                      │
│    - Storage (files)                             │
└──────────────────────────────────────────────────┘

IMPORTANT: Firebase Hosting is NOT used in production.
           It's only for local emulator testing.
```

### Firebase Collection Structure
```
users/{userId}
  - role: 'student' | 'instructor' | 'admin' | 'university_admin'
  - universityId?: string (for multi-tenant)
  - stripeCustomerId?: string

courses/{courseId}
  - instructorId: string
  - universityId?: string
  - modules: Module[] (embedded array with lessons)
  - /modules/{moduleId}/lessons/{lessonId} (optional subcollection)

enrollments/{userId_courseId}
  - userId, courseId, progress, status
  - currentLessonId: string
  - lastAccessedAt: timestamp

lessonProgress/{userId}_{lessonId}
  - userId, lessonId, courseId
  - watchPercentage: number (0-100)
  - timeSpent: number (seconds)
  - resumePosition: number (seconds)
  - completed: boolean (auto-set at 90%)
  - lastWatchedAt: timestamp

quizResults/{resultId}
  - userId, quizId, score, attemptNumber

payments/{paymentId}
  - userId, courseId, stripeSessionId, status

universities/{universityId}
  - settings, departments, admins
```

## Critical Development Guidelines

### 1. Code Response Format
- **ALWAYS** provide complete, runnable code snippets - no placeholders or pseudo-code
- **ALWAYS** include all necessary imports at the top of code blocks
- **ALWAYS** specify the exact file path where code should be placed
- **NEVER** use comments like "// ... rest of the code" or "// implement here"

### 2. Firebase Integration Rules
- **ALWAYS** use Firebase Admin SDK in Cloud Functions (`firebase-admin`)
- **ALWAYS** use Firebase Client SDK in React components (`firebase`)
- **NEVER** mix admin and client SDKs
- **ALWAYS** handle Firebase errors with proper error messages in Hungarian

### 3. Component Development Pattern
```typescript
'use client' // Only if needed

import { required imports } from 'package'
import { local imports } from '@/path'
import { types } from '@/types'

interface ComponentProps {
  // Complete prop definitions
}

export function ComponentName({ props }: ComponentProps) {
  // Hooks at the top
  // State management
  // Effects
  // Handlers
  // Render
}
```

### 4. Cloud Function Pattern
```typescript
import { onCall } from 'firebase-functions/v2/https';
import * as z from 'zod';

const InputSchema = z.object({
  // validation schema
});

export const functionName = onCall(async (request) => {
  // 1. Authentication check
  if (!request.auth) throw new Error('Authentication required');
  
  // 2. Permission check
  const userDoc = await firestore.collection('users').doc(request.auth.uid).get();
  
  // 3. Input validation with Zod
  const validatedData = InputSchema.parse(request.data);
  
  // 4. Business logic
  
  // 5. Return standardized response
  return { success: true, data: result };
});
```

### 5. React Query Pattern
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

## Project Structure
```
/src
  /app              # Next.js App Router pages
    /(admin)        # Admin routes
    /(auth)         # Auth routes (login/register)
    /(dashboard)    # User dashboard
    /(marketing)    # Public pages
  /components       # React components
    /ui             # Shadcn/UI components
  /hooks            # Custom React hooks
  /lib              # Utilities and configs
  /stores           # Zustand stores
  /types            # TypeScript types

/functions
  /src              # Cloud Functions source
  /lib              # Compiled functions

/docs               # Documentation
  expanded_production_roadmap.md  # Complete dev roadmap
```

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

### Cloud Functions
```bash
firebase functions:config:set sendgrid.key="SG.xxx"
firebase functions:config:set stripe.secret_key="sk_xxx"
firebase functions:config:set stripe.webhook_secret="whsec_xxx"
```

## UI Language Convention
- **Hungarian**: All user-facing text in the UI
- **English**: Code, comments, technical documentation, console logs

## User Roles & Permissions
- **STUDENT**: Can enroll, view courses, take quizzes
- **INSTRUCTOR**: Can create/edit own courses, view analytics
- **ADMIN**: Full system access, user management, platform settings
- **UNIVERSITY_ADMIN**: Manage university context, departments, instructors

## Testing Approach
- Unit tests: Jest for utilities and helpers
- Integration tests: Firebase emulators for Cloud Functions
- E2E tests: Playwright for user flows
- Always test with Firebase emulators before deploying

## Performance Guidelines
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load heavy components
- Optimize images with Next.js Image component
- Use Firestore composite indexes for complex queries
- Batch Firestore operations when possible

## Security Requirements
- Validate all inputs in Cloud Functions with Zod
- Use Firestore security rules for client-side access control
- Never expose sensitive configuration in client code
- Always check user permissions in Cloud Functions
- Sanitize user inputs before database operations

## Common Patterns

### Error Handling
```typescript
try {
  // Operation
} catch (error) {
  console.error('Function context error:', error);
  
  if (error instanceof z.ZodError) {
    return { success: false, error: 'Validation error', details: error.errors };
  }
  
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error occurred'
  };
}
```

### Firestore Batch Operations
```typescript
const batch = firestore.batch();
docs.forEach(doc => {
  batch.update(doc.ref, { field: value });
});
await batch.commit();
```

### File Upload Pattern
```typescript
// Always validate file type and size
// Generate unique filename with timestamp
// Track upload progress
// Clean up on failure
```

## Course Player Architecture

### Route Structure
```
URL Pattern: /courses/[courseId]/player/[lessonId]

Example: https://academion.hu/courses/djeht7E3baCx7wsF2Dio/player/IL0Ep7sAyzsP5UoQrIvs
         └─────────────────┬────────────────────┘  └────────┬──────┘  └────────┬──────────┘
                          domain                     courseId          lessonId
```

### File Locations

**Main Route & Layout:**
- Route: `src/app/(marketing)/courses/[courseId]/player/[lessonId]/page.tsx`
- Layout: `src/app/(marketing)/courses/[courseId]/player/layout.tsx`
  - Hides navbar/footer with aggressive CSS
  - Creates fullscreen player experience

**NEW Player Components** (All in `src/components/course-player/`):
- `NewSidebar.tsx` - 384px sidebar with rich lesson cards, progress bar, accordion modules
- `NewVideoPlayer.tsx` - Custom HTML5 player with large centered play button
- `NewLessonContent.tsx` - "A leckéről" description and "Amit megtanulsz:" learning outcomes
- `NewLessonNavigation.tsx` - Previous/Next lesson buttons (styled blue with shadow)
- `MobileBottomTabs.tsx` - Mobile responsive bottom tabs (Videó/Leckék)

**Icons** (`src/components/icons/CoursePlayerIcons.tsx`):
- PlayCircleIcon, CheckCircleIcon, EmptyCircleIcon (lesson states)
- DocumentIcon (non-video lessons)
- ChevronDownIcon/ChevronUpIcon (accordion)
- LargePlayButton, PlayIcon, PauseIcon (video controls)
- FullscreenIcon, ExitFullscreenIcon (fullscreen)
- ArrowLeftIcon, ArrowRightIcon (navigation)

### Component Hierarchy

```
CoursePlayerPage (page.tsx)
├── Desktop Layout (hidden md:flex)
│   ├── NewSidebar
│   │   ├── Progress bar (blue, animated)
│   │   └── Module Accordion
│   │       └── Lesson Cards
│   │           ├── PlayCircleIcon (current, blue)
│   │           ├── CheckCircleIcon (completed, green)
│   │           ├── EmptyCircleIcon (not started, gray)
│   │           ├── DocumentIcon (reading lessons)
│   │           ├── Full lesson title
│   │           └── Duration (e.g., "Videó • 10:15")
│   │
│   └── Main Content (max-w-5xl)
│       ├── Back Link ("← Vissza a kurzushoz")
│       ├── NewVideoPlayer
│       │   ├── HTML5 video element
│       │   ├── LargePlayButton (overlay)
│       │   └── Custom controls (auto-hide)
│       ├── Lesson Title (h1, 3xl font)
│       ├── Breadcrumb ("1. Modul: {moduleName}")
│       ├── NewLessonNavigation
│       │   ├── Previous button (left, gray)
│       │   └── Next button (right, blue with shadow)
│       ├── Horizontal Divider
│       └── NewLessonContent
│           ├── "A leckéről" section (description)
│           └── "Amit megtanulsz:" section (learning outcomes)
│
└── Mobile Layout (md:hidden)
    ├── Back Link (header)
    ├── Tab Content (video or lessons)
    │   ├── Video Tab: NewVideoPlayer + NewLessonContent
    │   └── Lessons Tab: NewSidebar (full width)
    └── MobileBottomTabs (fixed bottom)
        ├── Videó tab
        └── Leckék tab
```

### Data Flow

```
1. Route Hit: /courses/{courseId}/player/{lessonId}
   ↓
2. Authentication Check (useAuthStore)
   - authReady? → Show loading
   - isAuthenticated? → Continue OR redirect to /login
   ↓
3. Subscription Check (useSubscriptionStatus)
   - Cloud Function: getSubscriptionStatus
   - hasSub? → Continue OR redirect to /pricing
   ↓
4. Fetch Player Data (usePlayerData)
   Query Key: ['player-data', courseId, lessonId]

   Firestore Operations:
   a) Resolve courseId (by slug or direct ID)
      - Query: courses where slug == courseId
      - Fallback: Direct document lookup

   b) Get course document: /courses/{courseId}

   c) Load modules & lessons:
      - Primary: course.modules[] (embedded array)
      - Fallback: /courses/{id}/modules subcollection
      - Each module contains lessons[]

   Returns:
   - course: { id, title, modules: Module[] }
   - signedPlaybackUrl: null (no Mux signing currently)
   ↓
5. Fetch Progress (useCourseProgress)
   Query Key: ['course-progress', courseId, userId]

   Firestore Query: lessonProgress collection
   - Where: userId == currentUser.uid
   - Where: courseId == courseId

   Returns:
   - completedLessonIds: string[] (completed or >90% watched)
   - progressMap: { [lessonId]: { watchPercentage, timeSpent } }
   ↓
6. Get Resume Position (useResumePosition)
   Query Key: ['resume-position', lessonId, userId]

   Firestore Doc: lessonProgress/{userId}_{lessonId}
   Returns: resumePosition (seconds) - where user left off
   ↓
7. Track Enrollment (useEnrollmentTracking)
   Triggered on component mount

   Firestore Update: enrollments/{userId}_{courseId}
   Updates:
   - currentLessonId: lessonId
   - lastAccessedAt: now()
   ↓
8. Render UI
   - Show NewSidebar with progress and lessons
   - Show NewVideoPlayer with resume position
   - Show NewLessonNavigation with prev/next
   - Show NewLessonContent with description/outcomes
   ↓
9. User Interactions:

   Video Progress (every 10s while playing):
   → useLessonProgress.mutate()
   → Saves to: lessonProgress/{userId}_{lessonId}
   → Fields: watchPercentage, timeSpent, resumePosition
   → Auto-completes at 90% (completed: true)

   Video Ended:
   → Mark as completed (100%)
   → Auto-advance to next lesson (2s delay)

   Lesson Click:
   → router.push(/courses/{courseId}/player/{newLessonId})
   → Prefetch next lesson data
   → Scroll to top, switch to video tab (mobile)
```

### Key Hooks

**usePlayerData(courseId, lessonId)**
- Fetches course with modules and lessons
- Resolves courseId by slug or direct ID
- Returns course object and signed playback URL
- Located in: `src/hooks/usePlayerData.ts`

**useCourseProgress(courseId)**
- Fetches all lesson progress for a course
- Returns completedLessonIds[] and progressMap{}
- Located in: `src/hooks/useCourseProgress.ts`

**useLessonProgress()**
- Mutation for saving lesson progress
- Updates watchPercentage, timeSpent, resumePosition
- Auto-completes at 90% watch threshold
- Located in: `src/hooks/useLessonProgress.ts`

**useResumePosition(lessonId)**
- Fetches where user left off in a lesson
- Returns resumePosition in seconds
- Located in: `src/hooks/useCourseProgress.ts`

**useSubscriptionStatus()**
- Checks if user has active subscription
- Calls Cloud Function
- Returns hasActiveSubscription boolean
- Located in: `src/hooks/useSubscriptionStatus.ts`

**useEnrollmentTracking()**
- Tracks current lesson access
- Updates enrollments/{userId}_{courseId}
- Located in: `src/hooks/useEnrollmentTracking.ts`

### Design Specifications

**Sidebar (NewSidebar):**
- Width: 384px fixed
- Progress bar: Blue (#3B82F6), animated, shows percentage
- Module accordion: Chevron icons, smooth expansion
- Lesson cards:
  - Current lesson: Blue PlayCircleIcon, white background
  - Completed: Green CheckCircleIcon
  - Not started: Gray EmptyCircleIcon
  - Full lesson titles (not truncated)
  - Duration display: "Videó • 10:15"
  - Type indicators: Play icon (video), Document icon (reading)

**Video Player (NewVideoPlayer):**
- Large centered play button (72px, blue)
- Auto-hide controls after 3s of inactivity
- Progress bar with click-to-seek
- Fullscreen support
- Resume position on load
- Progress tracking every 10s

**Navigation (NewLessonNavigation):**
- Previous: Left-aligned, gray text with left arrow
- Next: Right-aligned, blue button with shadow, right arrow
- Shadow: `shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40`

**Content (NewLessonContent):**
- "A leckéről" section: Gray text, leading-relaxed
- "Amit megtanulsz:" section: Bullet list with blue dots
- Proper spacing: space-y-8 between sections

**Mobile (MobileBottomTabs):**
- Fixed bottom position
- Two tabs: "Videó" and "Leckék"
- Active tab: Blue text and bottom border
- Smooth tab switching

### Troubleshooting

**"Old design showing on academion.hu"**

Possible causes and solutions:

1. **Browser Cache (MOST COMMON)**
   - Solution: Hard refresh (Cmd+Shift+R / Ctrl+F5)
   - Clear browser storage (DevTools → Application → Clear Storage)

2. **Vercel Build Failure**
   - Check: Vercel dashboard → Deployments
   - Verify: Latest deployment matches git commit
   - Solution: Trigger manual redeploy if needed

3. **CDN Propagation Delay**
   - Vercel uses global CDN
   - Propagation: 2-60 seconds typically
   - Solution: Wait or check from different region/VPN

4. **Service Worker Cache**
   - If PWA was previously registered
   - Solution: Unregister service worker in DevTools

5. **Build Errors Silently Ignored**
   - next.config.js has `ignoreBuildErrors: true`
   - Solution: Check Vercel deployment logs for errors

6. **Wrong Git Commit Deployed**
   - Vercel should auto-deploy from main branch
   - Verify: Deployment uses commit after 0267d2e
   - Solution: Ensure Vercel is connected to correct GitHub repo/branch

**Verification Steps:**

```bash
# 1. Check local build works
npm run build
npm run start
# Visit http://localhost:3000/courses/{id}/player/{id}

# 2. Check git status
git log --oneline -5
# Should see: 0267d2e feat: Complete course player redesign

# 3. Trigger Vercel deployment
git commit --allow-empty -m "Trigger Vercel rebuild"
git push origin main

# 4. Check in incognito mode
# Open academion.hu in private/incognito window
# Hard refresh on player page

# 5. Inspect browser console
# Look for errors loading components
# Check Network tab for failed requests
```

### Common Issues

**Issue: Modules not loading**
- Check: course.modules exists (not null/undefined)
- Verify: Firestore document structure matches expected format
- Solution: Ensure modules are embedded array in course doc OR subcollection exists

**Issue: Video not playing**
- Check: videoUrl or muxPlaybackId exists on lesson
- Verify: User has permission to access course (enrolled + subscribed)
- Check console for CORS errors or 403 responses

**Issue: Progress not saving**
- Check: User is authenticated
- Verify: useLessonProgress mutation is being called
- Check Firestore rules allow writes to lessonProgress collection
- Verify: Document ID format is {userId}_{lessonId}

**Issue: Next lesson button not working**
- Check: nextLesson is not null (there is a next lesson)
- Verify: Only PUBLISHED lessons are included in navigation
- Check: Lessons are sorted by order field correctly

## IMPORTANT: Response Requirements
1. **COMPLETE CODE**: Never use placeholders. Provide full implementations.
2. **EXACT PATHS**: Always specify exact file paths for code placement.
3. **WORKING EXAMPLES**: Code must be immediately runnable without modifications.
4. **ERROR HANDLING**: Always include comprehensive error handling.
5. **TYPE SAFETY**: Full TypeScript support with no `any` types.