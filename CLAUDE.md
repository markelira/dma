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
npm run build                          # Build Next.js app
firebase deploy                        # Deploy everything (hosting + functions)
firebase deploy --only functions       # Deploy Cloud Functions only
firebase deploy --only hosting         # Deploy hosting only
firebase deploy --only firestore:rules # Deploy Firestore rules

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

### Data Flow Architecture
```
User Action → React Component → Custom Hook → Cloud Function → Firestore
                    ↓                              ↓
              Zustand Store                 Email Service (SendGrid)
                    ↓                              ↓
              UI Update                    Stripe/Payment Processing
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
  - /lessons/{lessonId} (subcollection)

enrollments/{userId_courseId}
  - userId, courseId, progress, status

lessonProgress/{progressId}
  - userId, lessonId, timeSpent, completed

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

## IMPORTANT: Response Requirements
1. **COMPLETE CODE**: Never use placeholders. Provide full implementations.
2. **EXACT PATHS**: Always specify exact file paths for code placement.
3. **WORKING EXAMPLES**: Code must be immediately runnable without modifications.
4. **ERROR HANDLING**: Always include comprehensive error handling.
5. **TYPE SAFETY**: Full TypeScript support with no `any` types.