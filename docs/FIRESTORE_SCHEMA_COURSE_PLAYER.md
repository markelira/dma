# Firestore Schema Updates for Course Player

This document outlines the required Firestore schema updates to support the enhanced course player features.

## Schema Updates

### 1. Lessons Collection

**Path:** `courses/{courseId}/lessons/{lessonId}`

**New Fields to Add:**

```typescript
{
  // Existing fields...
  id: string
  title: string
  description?: string
  type: 'VIDEO' | 'QUIZ' | 'TEXT' | 'READING' | 'PDF' | 'AUDIO' | 'ASSIGNMENT'
  duration?: number
  order: number

  // NEW FIELDS:
  learningOutcomes?: string[]  // Learning objectives for this lesson
  concepts?: string[]          // Key concepts covered (for badges/tags)
  tags?: string[]              // Searchable tags for filtering
  transcript?: {
    text: string               // Full transcript text
    segments?: Array<{
      start: number            // Start time in seconds
      end: number              // End time in seconds
      text: string             // Segment text
    }>
  }
  resources?: Array<{
    title: string
    type: string               // 'PDF' | 'CODE' | 'LINK' | 'FILE'
    url: string                // Firebase Storage path or external URL
    size?: number              // File size in bytes
    downloadable: boolean
  }>
}
```

### 2. Lesson Progress Collection

**Path:** `lessonProgress/{userId}_{lessonId}`

**Schema:**

```typescript
{
  userId: string
  lessonId: string
  courseId: string

  // Progress tracking
  watchPercentage: number      // 0-100
  timeSpent: number            // Minutes watched
  completed: boolean           // true if watchPercentage >= 90
  completedAt?: Timestamp      // When lesson was completed

  // Engagement tracking
  lastWatchedAt: Timestamp     // Last time user watched
  sessionCount: number         // Number of times user opened lesson

  // Analytics
  engagementEvents?: Array<{
    type: 'play' | 'pause' | 'seek' | 'complete'
    timestamp: Timestamp
    currentTime: number
  }>

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### 3. Support Tickets Collection (NEW)

**Path:** `supportTickets/{ticketId}`

**Schema:**

```typescript
{
  id: string                   // Auto-generated
  userId: string
  userEmail: string
  userName: string

  // Issue context
  lessonId?: string            // If related to specific lesson
  courseId?: string            // If related to specific course
  issueType: 'technical' | 'content' | 'billing' | 'other'

  // Issue details
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'

  // Metadata
  browser?: string
  platform?: string
  url?: string                 // Page where issue occurred

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  resolvedAt?: Timestamp

  // Assignment
  assignedTo?: string          // Admin user ID

  // Communication
  responses?: Array<{
    userId: string
    message: string
    timestamp: Timestamp
    isAdmin: boolean
  }>
}
```

## Migration Scripts

### Add Learning Outcomes to Existing Lessons

```typescript
// Run in Firebase Console or Cloud Function
async function migrateLessonData() {
  const firestore = admin.firestore()
  const coursesSnapshot = await firestore.collection('courses').get()

  const batch = firestore.batch()
  let count = 0

  for (const courseDoc of coursesSnapshot.docs) {
    const lessonsSnapshot = await courseDoc.ref.collection('lessons').get()

    for (const lessonDoc of lessonsSnapshot.docs) {
      const data = lessonDoc.data()

      // Add default empty arrays if not present
      if (!data.learningOutcomes) {
        batch.update(lessonDoc.ref, {
          learningOutcomes: [],
          concepts: [],
          tags: []
        })
        count++
      }

      // Commit in batches of 500
      if (count >= 500) {
        await batch.commit()
        count = 0
      }
    }
  }

  if (count > 0) {
    await batch.commit()
  }

  console.log('Migration complete')
}
```

## Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Support Tickets
match /supportTickets/{ticketId} {
  // Users can create tickets
  allow create: if request.auth != null
    && request.resource.data.userId == request.auth.uid;

  // Users can read their own tickets
  allow read: if request.auth != null
    && (resource.data.userId == request.auth.uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');

  // Only admins can update/delete
  allow update, delete: if request.auth != null
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// Lesson Progress
match /lessonProgress/{progressId} {
  // Users can read/write their own progress
  allow read, write: if request.auth != null
    && progressId.matches('^' + request.auth.uid + '_.*$');
}
```

## Composite Indexes

Add these to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "supportTickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "supportTickets",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "priority", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "lessonProgress",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" }
      ]
    }
  ]
}
```

## TypeScript Types

Add to `/src/types/firestore.ts`:

```typescript
export interface LessonData {
  id: string
  title: string
  description?: string
  type: LessonType
  duration?: number
  order: number
  learningOutcomes?: string[]
  concepts?: string[]
  tags?: string[]
  transcript?: {
    text: string
    segments?: TranscriptSegment[]
  }
  resources?: LessonResource[]
}

export interface TranscriptSegment {
  start: number
  end: number
  text: string
}

export interface LessonResource {
  title: string
  type: 'PDF' | 'CODE' | 'LINK' | 'FILE'
  url: string
  size?: number
  downloadable: boolean
}

export interface SupportTicket {
  id: string
  userId: string
  userEmail: string
  userName: string
  lessonId?: string
  courseId?: string
  issueType: 'technical' | 'content' | 'billing' | 'other'
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  browser?: string
  platform?: string
  url?: string
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
  assignedTo?: string
  responses?: TicketResponse[]
}

export interface TicketResponse {
  userId: string
  message: string
  timestamp: Date
  isAdmin: boolean
}
```

## Next Steps

1. ✅ Review schema changes
2. ⏳ Update Firestore security rules
3. ⏳ Create composite indexes
4. ⏳ Run migration script for existing lessons
5. ⏳ Implement Cloud Functions
6. ⏳ Update TypeScript types in codebase
