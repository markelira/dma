# Course Type Differentiation - Comprehensive Development Plan

## Overview

This document outlines the comprehensive refactoring of the DMA platform to support differentiated course types with unique terminology, player layouts, and user experiences.

## Executive Summary

### Goals
1. Remove module hierarchy - all courses have flat lesson lists
2. Differentiate UI/UX per course type (WEBINAR, PODCAST, MASTERCLASS, ACADEMIA)
3. Implement instructor roles (Mentor vs Szereplő)
4. Create Célközönség (Target Audience) entity system
5. Enable MASTERCLASS lesson import from existing courses
6. Update terminology: "kurzus" → "tartalom", type-specific labels

### Course Type Specifications

| Course Type | Player Layout | Instructor Term | Structure | Special Features |
|-------------|---------------|-----------------|-----------|------------------|
| WEBINAR | Netflix (no sidebar) | Mentor | Flat lessons | Single video focus |
| PODCAST | Netflix (no sidebar) | Szereplő | Flat lessons | Audio-first experience |
| MASTERCLASS | Custom sidebar | Mentor | Flat lessons | Import lessons from other courses |
| ACADEMIA | Standard sidebar | Mentor | Flat lessons | Traditional course experience |

---

## Phase 1: Foundation & Database Schema

### 1.1 Type Definitions (`src/types/index.ts`)

#### New Types to Add

```typescript
// Instructor Role Type
export type InstructorRole = 'MENTOR' | 'SZEREPLŐ';

// Instructor Role Labels (Hungarian)
export const INSTRUCTOR_ROLE_LABELS: Record<InstructorRole, string> = {
  MENTOR: 'Mentor',
  SZEREPLŐ: 'Szereplő',
};

// Target Audience Interface
export interface TargetAudience {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Instructor Interface

```typescript
export interface Instructor {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  profilePictureUrl?: string;
  role: InstructorRole; // NEW: Required role field
  createdAt: string;
  updatedAt: string;
}
```

#### Updated Course Interface

```typescript
export interface Course {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  courseType: CourseType;

  // Instructors
  instructorIds?: string[];

  // Categories
  categoryIds?: string[];

  // Target Audiences (NEW)
  targetAudienceIds?: string[];

  // Flat lessons (replaces modules)
  lessons: Lesson[];

  // For MASTERCLASS - imported lesson references
  importedLessonIds?: string[];

  // Learning outcomes
  whatYouWillLearn?: string[];

  // ... other existing fields
}
```

#### Remove from Course Interface
- `modules?: Module[]` - REMOVE
- `Module` interface - DEPRECATE (keep for migration reference)

### 1.2 Firestore Collections

#### New Collection: `targetAudiences`

```
targetAudiences/{targetAudienceId}
├── name: string
├── description?: string
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### Updated Collection: `instructors`

```
instructors/{instructorId}
├── name: string
├── title?: string
├── bio?: string
├── profilePictureUrl?: string
├── role: 'MENTOR' | 'SZEREPLŐ'  // NEW
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### Updated Collection: `courses`

```
courses/{courseId}
├── title: string
├── description: string
├── status: string
├── courseType: string
├── instructorIds: string[]
├── categoryIds: string[]
├── targetAudienceIds: string[]  // NEW
├── lessons: Lesson[]  // CHANGED from modules
├── importedLessonIds?: string[]  // NEW for MASTERCLASS
├── whatYouWillLearn: string[]
├── createdAt: timestamp
└── updatedAt: timestamp
```

### 1.3 Cloud Functions - Target Audience

**File:** `functions/src/targetAudienceActions.ts`

```typescript
// getTargetAudiences - Public, returns all target audiences
// createTargetAudience - Admin only
// updateTargetAudience - Admin only
// deleteTargetAudience - Admin only, checks if assigned to courses
```

### 1.4 Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/index.ts` | MODIFY | Add new types, update interfaces |
| `functions/src/targetAudienceActions.ts` | CREATE | Target audience CRUD functions |
| `functions/src/instructorActions.ts` | MODIFY | Add role field handling |
| `firestore.rules` | MODIFY | Add rules for targetAudiences collection |

---

## Phase 2: Database Migration

### 2.1 Migration Strategy

The migration will:
1. Flatten all existing module→lesson structures
2. Preserve lesson order across modules
3. Add metadata for reference
4. Update instructors with default role

### 2.2 Migration Script

**File:** `functions/src/migrations/flattenCoursesToLessons.ts`

```typescript
export async function migrateCoursesToFlatLessons() {
  const coursesSnapshot = await firestore.collection('courses').get();

  for (const courseDoc of coursesSnapshot.docs) {
    const course = courseDoc.data();

    if (!course.modules || course.modules.length === 0) {
      continue; // Already flat or no content
    }

    // Flatten modules to lessons
    const flatLessons: Lesson[] = [];
    let orderCounter = 0;

    for (const module of course.modules) {
      for (const lesson of module.lessons || []) {
        flatLessons.push({
          ...lesson,
          order: orderCounter++,
          originalModuleId: module.id,
          originalModuleTitle: module.title,
        });
      }
    }

    // Update course document
    await courseDoc.ref.update({
      lessons: flatLessons,
      modules: admin.firestore.FieldValue.delete(), // Remove modules
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
```

### 2.3 Instructor Role Migration

```typescript
export async function addDefaultInstructorRoles() {
  const instructorsSnapshot = await firestore.collection('instructors').get();

  const batch = firestore.batch();

  for (const doc of instructorsSnapshot.docs) {
    const instructor = doc.data();
    if (!instructor.role) {
      batch.update(doc.ref, { role: 'MENTOR' });
    }
  }

  await batch.commit();
}
```

### 2.4 Seed Target Audiences

```typescript
const defaultTargetAudiences = [
  { name: 'Vállalkozók', description: 'Cégtulajdonosok és vállalkozók' },
  { name: 'HR szakemberek', description: 'Emberi erőforrás területen dolgozók' },
  { name: 'Vezetők', description: 'Menedzserek és csapatvezetők' },
  { name: 'Marketingesek', description: 'Marketing és kommunikáció területen dolgozók' },
  { name: 'Értékesítők', description: 'Sales és üzletfejlesztés területen dolgozók' },
  { name: 'Pályakezdők', description: 'Karrierjük elején járók' },
  { name: 'Szakemberek', description: 'Tapasztalt szakemberek továbbképzéshez' },
];
```

---

## Phase 3: Admin Management Pages

### 3.1 Target Audience Admin Page

**File:** `src/app/(admin)/admin/target-audiences/page.tsx`

Features:
- Table listing all target audiences
- Create/Edit dialog with name and description
- Delete with confirmation (check course assignments)
- Search/filter functionality

### 3.2 React Query Hooks

**File:** `src/hooks/useTargetAudienceQueries.ts`

```typescript
export function useTargetAudiences() {
  return useQuery({
    queryKey: ['target-audiences'],
    queryFn: () => getTargetAudiences(),
  });
}

export function useCreateTargetAudience() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTargetAudience,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['target-audiences'] });
    },
  });
}

// ... update, delete mutations
```

### 3.3 Instructor Admin Update

**File:** `src/app/(admin)/admin/instructors/page.tsx`

Add to create/edit dialog:
- Role selector (Mentor / Szereplő)
- Role displayed as badge in table

---

## Phase 4: Course Creation Wizard Restructure

### 4.1 CourseBasicInfoStep Changes

**File:** `src/components/course-creation/CourseBasicInfoStep.tsx`

#### Remove
- "Tanulási célok" (learningObjectives) textarea

#### Add/Move
- "Mit fogsz tanulni?" / "Miről szól?" (type-specific label) - moved to main form
- Target Audience multi-select (from targetAudiences entity)

#### Type-Specific Labels

```typescript
const getOutcomesLabel = (courseType: CourseType): string => {
  switch (courseType) {
    case 'PODCAST':
      return 'Miről szól?';
    case 'WEBINAR':
      return 'Mit fogsz megtanulni?';
    case 'MASTERCLASS':
      return 'Mit fogsz elsajátítani?';
    case 'ACADEMIA':
      return 'Mit fogsz megtanulni?';
    default:
      return 'Mit fogsz megtanulni?';
  }
};
```

### 4.2 New CourseLessonsStep

**File:** `src/components/course-creation/CourseLessonsStep.tsx`

Replaces `CurriculumStructureStep.tsx`

Features:
- Flat lesson list (no module grouping)
- Add lesson button
- Drag-and-drop reordering
- Lesson edit inline or modal
- For MASTERCLASS: "Import lecke" button

### 4.3 Lesson Import Modal (MASTERCLASS)

**File:** `src/components/course-creation/LessonImportModal.tsx`

```typescript
interface LessonImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (lessonIds: string[]) => void;
  excludeCourseId: string; // Current course being edited
}
```

Features:
- Browse all published courses
- Expand to see lessons
- Checkbox selection for multiple lessons
- Preview imported lesson details
- Import creates reference (not copy)

### 4.4 CourseWizardStore Updates

**File:** `src/stores/courseWizardStore.ts`

```typescript
interface CourseWizardState {
  // ... existing fields

  // Replace modules with lessons
  lessons: Lesson[];

  // For MASTERCLASS
  importedLessonIds: string[];

  // Target audiences
  targetAudienceIds: string[];
}

interface CourseWizardActions {
  // Lesson actions (replace module actions)
  addLesson: (lesson: Omit<Lesson, 'id'>) => void;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  removeLesson: (lessonId: string) => void;
  reorderLessons: (startIndex: number, endIndex: number) => void;

  // Import actions
  importLessons: (lessonIds: string[]) => void;
  removeImportedLesson: (lessonId: string) => void;
}
```

### 4.5 Wizard Step Flow Update

**File:** `src/components/course-creation/CourseCreationWizard.tsx`

```typescript
const WIZARD_STEPS = [
  { id: 0, title: 'Típus', component: CourseTypeSelection },
  { id: 1, title: 'Alapadatok', component: CourseBasicInfoStep },
  { id: 2, title: 'Leckék', component: CourseLessonsStep }, // Renamed from Curriculum
  { id: 3, title: 'Publikálás', component: CoursePublishStep },
];

// Skip lessons step for WEBINAR and PODCAST (single lesson auto-created)
const shouldSkipLessonsStep = (courseType: CourseType) => {
  return courseType === 'WEBINAR' || courseType === 'PODCAST';
};
```

---

## Phase 5: Course Player Differentiation

### 5.1 Player Layout Components

#### Netflix Layout (WEBINAR, PODCAST)

**File:** `src/components/course-player/NetflixPlayerLayout.tsx`

```typescript
export function NetflixPlayerLayout({ lesson, course, progress }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Full-width video player */}
      <div className="w-full max-w-7xl mx-auto">
        <NewVideoPlayer ... />
      </div>

      {/* Minimal info below */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-white text-3xl font-bold">{lesson.title}</h1>
        <p className="text-gray-400 mt-4">{lesson.description}</p>
      </div>
    </div>
  );
}
```

#### Academia Layout (Standard Sidebar)

**File:** `src/components/course-player/AcademiaSidebar.tsx`

```typescript
export function AcademiaSidebar({ lessons, currentLessonId, progress }) {
  return (
    <div className="w-96 bg-white border-r overflow-y-auto">
      {/* Progress bar */}
      <div className="p-4 border-b">
        <ProgressBar completed={progress.completedCount} total={lessons.length} />
      </div>

      {/* Flat lesson list (no modules) */}
      <div className="p-4">
        {lessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={index + 1}
            isActive={lesson.id === currentLessonId}
            isCompleted={progress.completedIds.includes(lesson.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### Masterclass Layout

**File:** `src/components/course-player/MasterclassSidebar.tsx`

```typescript
export function MasterclassSidebar({ course, lessons, currentLessonId }) {
  return (
    <div className="w-96 bg-white border-r overflow-y-auto">
      {/* Masterclass title header */}
      <div className="p-6 border-b bg-gradient-to-r from-amber-50 to-amber-100">
        <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
        <p className="text-sm text-gray-600 mt-1">Masterclass</p>
      </div>

      {/* Simple lesson names only */}
      <nav className="p-4">
        {lessons.map((lesson, index) => (
          <Link
            key={lesson.id}
            href={`/courses/${course.id}/player/${lesson.id}`}
            className={cn(
              "block py-3 px-4 rounded-lg mb-2",
              lesson.id === currentLessonId
                ? "bg-amber-100 text-amber-900"
                : "hover:bg-gray-100"
            )}
          >
            <span className="text-sm font-medium">
              {index + 1}. {lesson.title}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
```

### 5.2 Player Page Router

**File:** `src/app/(marketing)/courses/[courseId]/player/[lessonId]/page.tsx`

```typescript
export default function CoursePlayerPage({ params }) {
  const { data: playerData } = usePlayerData(params.courseId, params.lessonId);

  if (!playerData) return <Loading />;

  const { course, currentLesson } = playerData;

  // Route to appropriate layout based on course type
  switch (course.courseType) {
    case 'WEBINAR':
    case 'PODCAST':
      return <NetflixPlayerLayout course={course} lesson={currentLesson} />;

    case 'MASTERCLASS':
      return (
        <MasterclassPlayerLayout course={course} lesson={currentLesson}>
          <MasterclassSidebar course={course} lessons={course.lessons} />
        </MasterclassPlayerLayout>
      );

    case 'ACADEMIA':
    default:
      return (
        <AcademiaPlayerLayout course={course} lesson={currentLesson}>
          <AcademiaSidebar lessons={course.lessons} />
        </AcademiaPlayerLayout>
      );
  }
}
```

### 5.3 usePlayerData Hook Update

**File:** `src/hooks/usePlayerData.ts`

Remove module-related logic:
- Remove `loadModulesFromSubcollection`
- Remove module navigation helpers
- Return flat `lessons[]` directly from course

Add MASTERCLASS handling:
- Fetch imported lesson details if `importedLessonIds` exists
- Merge imported lessons with course lessons

---

## Phase 6: Course Detail Page Differentiation

### 6.1 Enrollment Button Text

**File:** `src/lib/terminology.ts`

```typescript
export const getEnrollmentButtonText = (
  courseType: CourseType,
  isEnrolled: boolean
): string => {
  const typeLabel = COURSE_TYPE_LABELS[courseType];

  if (isEnrolled) {
    return `${typeLabel} folytatása`;
  }

  return `${typeLabel} indítása`;
};

// Examples:
// WEBINAR, not enrolled → "Webinár indítása"
// PODCAST, enrolled → "Podcast folytatása"
// MASTERCLASS, not enrolled → "Masterclass indítása"
```

### 6.2 Type-Specific Section Labels

**File:** `src/lib/terminology.ts`

```typescript
export interface CourseTypeTerminology {
  instructorLabel: string;       // "Mentor" or "Szereplő"
  instructorsLabel: string;      // "Mentorok" or "Szereplők"
  outcomesLabel: string;         // "Mit fogsz tanulni?" or "Miről szól?"
  contentLabel: string;          // "Tartalom"
  lessonLabel: string;           // "Lecke" or "Epizód"
  lessonsLabel: string;          // "Leckék" or "Epizódok"
}

export const getCourseTypeTerminology = (courseType: CourseType): CourseTypeTerminology => {
  switch (courseType) {
    case 'PODCAST':
      return {
        instructorLabel: 'Szereplő',
        instructorsLabel: 'Szereplők',
        outcomesLabel: 'Miről szól?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Epizód',
        lessonsLabel: 'Epizódok',
      };

    case 'WEBINAR':
      return {
        instructorLabel: 'Mentor',
        instructorsLabel: 'Mentorok',
        outcomesLabel: 'Mit fogsz megtanulni?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Előadás',
        lessonsLabel: 'Előadások',
      };

    case 'MASTERCLASS':
      return {
        instructorLabel: 'Mentor',
        instructorsLabel: 'Mentorok',
        outcomesLabel: 'Mit fogsz elsajátítani?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Lecke',
        lessonsLabel: 'Leckék',
      };

    case 'ACADEMIA':
    default:
      return {
        instructorLabel: 'Mentor',
        instructorsLabel: 'Mentorok',
        outcomesLabel: 'Mit fogsz megtanulni?',
        contentLabel: 'Tartalom',
        lessonLabel: 'Lecke',
        lessonsLabel: 'Leckék',
      };
  }
};
```

### 6.3 CourseDetailLayout Updates

**File:** `src/components/course-detail/CourseDetailLayout.tsx`

Use terminology config for:
- Section headers
- Tab labels
- Instructor section title
- Curriculum section title

### 6.4 CourseInstructorCard Updates

**File:** `src/components/course/CourseInstructorCard.tsx`

Display instructor's role from their profile, using appropriate label based on course type context.

### 6.5 Curriculum Section (Flat Lessons)

**File:** `src/components/course-detail/CurriculumSection.tsx`

Remove module accordion, display flat lesson list:

```typescript
export function CurriculumSection({ lessons, courseType }) {
  const terminology = getCourseTypeTerminology(courseType);

  return (
    <section>
      <h2 className="text-2xl font-bold mb-6">{terminology.contentLabel}</h2>

      <div className="space-y-3">
        {lessons.map((lesson, index) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            index={index + 1}
            label={terminology.lessonLabel}
          />
        ))}
      </div>
    </section>
  );
}
```

---

## Phase 7: UI Terminology Updates

### 7.1 Global Text Replacements

| Original | Replacement | Context |
|----------|-------------|---------|
| kurzus | tartalom | Generic references |
| kurzusok | tartalmak | Plural generic |
| Kurzus | Tartalom | Titles |
| modul | (remove) | Remove all module references |
| modulok | (remove) | Remove all module references |

### 7.2 Components to Update

| Component | Changes |
|-----------|---------|
| `PremiumCourseCard.tsx` | Use type-specific labels |
| `CourseStatsBar.tsx` | "Tartalmak" instead of "Kurzusok" |
| `CrossTypeNavigation.tsx` | Type-specific navigation text |
| `CourseTypesSection.tsx` | Update marketing copy |
| `CourseCarousel.tsx` | "Tartalmak" label |
| `FeaturedCoursesCarousel.tsx` | Update headers |
| Navbar | "Tartalmak" menu item |
| Dashboard | "Folyamatban lévő tartalmak" |

### 7.3 Page Title Updates

| Page | New Title |
|------|-----------|
| /courses | Tartalmak |
| /webinar | Webinárok |
| /podcast | Podcastok |
| /masterclass | Masterclass |
| /akadémia | Akadémia |

---

## Phase 8: Testing & Polish

### 8.1 Test Cases

#### Course Creation
- [ ] Create WEBINAR course (skips lessons step)
- [ ] Create PODCAST course (skips lessons step)
- [ ] Create ACADEMIA course (lessons step)
- [ ] Create MASTERCLASS course (lessons step + import)
- [ ] Import lessons in MASTERCLASS

#### Course Player
- [ ] WEBINAR plays in Netflix layout
- [ ] PODCAST plays in Netflix layout
- [ ] ACADEMIA plays with sidebar
- [ ] MASTERCLASS plays with custom sidebar
- [ ] Navigation works in all layouts

#### Course Detail Page
- [ ] Enrollment button shows correct text per type
- [ ] Instructor section uses correct terminology
- [ ] Outcomes section uses correct label
- [ ] Curriculum shows flat lessons

#### Migration
- [ ] Existing courses migrated correctly
- [ ] Lesson order preserved
- [ ] No data loss

### 8.2 Edge Cases

- Courses with no lessons yet
- MASTERCLASS with all imported lessons
- Instructor without role (migration fallback)
- Course without target audiences

### 8.3 Performance Checks

- Player page load time
- Lesson navigation speed
- Admin page with many items

---

## Implementation Order

```
Week 1:
├── Phase 1: Foundation (types, Cloud Functions)
├── Phase 2: Migration script
└── Phase 3: Admin pages

Week 2:
├── Phase 4: Course wizard restructure
└── Phase 5: Player layouts

Week 3:
├── Phase 6: Course detail differentiation
├── Phase 7: Terminology updates
└── Phase 8: Testing & polish
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Backup before migration, add `migratedAt` timestamp |
| Breaking existing courses | Keep backwards compatibility, handle missing fields |
| Performance regression | Lazy load player layouts, optimize queries |
| UI inconsistency | Create centralized terminology config |

---

## Success Criteria

1. All 4 course types create and display correctly
2. No module references remain in UI
3. Instructors show correct role labels
4. Target audiences are manageable via admin
5. MASTERCLASS can import lessons
6. All player layouts work correctly
7. Enrollment buttons show type-specific text
8. Zero data loss from migration

---

## Appendix: File Index

### New Files to Create
```
src/lib/terminology.ts
src/hooks/useTargetAudienceQueries.ts
src/app/(admin)/admin/target-audiences/page.tsx
src/components/course-creation/CourseLessonsStep.tsx
src/components/course-creation/LessonImportModal.tsx
src/components/course-player/NetflixPlayerLayout.tsx
src/components/course-player/AcademiaPlayerLayout.tsx
src/components/course-player/MasterclassPlayerLayout.tsx
src/components/course-player/AcademiaSidebar.tsx
src/components/course-player/MasterclassSidebar.tsx
functions/src/targetAudienceActions.ts
functions/src/migrations/flattenCoursesToLessons.ts
```

### Major Files to Modify
```
src/types/index.ts
src/stores/courseWizardStore.ts
src/components/course-creation/CourseBasicInfoStep.tsx
src/components/course-creation/CourseCreationWizard.tsx
src/app/(marketing)/courses/[courseId]/player/[lessonId]/page.tsx
src/components/course-player/NewSidebar.tsx
src/components/course/CourseEnrollmentCard.tsx
src/app/(marketing)/courses/[courseId]/ClientCourseDetailPage.tsx
src/components/course-detail/CurriculumSection.tsx
functions/src/courseManagement.ts
functions/src/instructorActions.ts
```
