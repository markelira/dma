# Course Player Differentiation - Implementation Plan

**Created**: 2025-11-22
**Status**: In Progress
**Priority**: High

---

## Problem Statement

WEBINAR and ACADEMIA courses show identical player layouts when they should be visually distinct. The Netflix layout (no sidebar) is not being triggered for WEBINAR courses.

### Current Behavior
- All course types show sidebar layout
- WEBINAR should show Netflix layout (full-width, no sidebar)

### Expected Behavior
| Course Type | Layout | Sidebar | Terminology |
|-------------|--------|---------|-------------|
| WEBINAR | Netflix | No | Mentor |
| PODCAST | Netflix | No | Szereplő |
| ACADEMIA | Sidebar | Yes (flat lessons) | Mentor |
| MASTERCLASS | Sidebar | Yes (flat lessons) | Mentor |

---

## Phase 1: Diagnosis & Bug Fix

### 1.1 Add Diagnostic Logging
- [ ] Add console logs to `usePlayerData.ts` to trace `courseType` value
- [ ] Add console logs to player `page.tsx` to verify `usesNetflixLayout` value
- [ ] Check Firestore documents to verify field name (`type` vs `courseType`)

### 1.2 Fix Field Name Mismatch
- [ ] Verify Course interface in `types/index.ts` (expects `courseType`)
- [ ] Verify player page reads correct field
- [ ] Verify `usePlayerData.ts` returns correct field
- [ ] Fix any mismatches found

### 1.3 Verify Conditional Rendering
- [ ] Confirm `NETFLIX_STYLE_COURSE_TYPES` includes `'WEBINAR'`
- [ ] Confirm `usesNetflixLayout` is returned from hook
- [ ] Confirm player page uses this value correctly

---

## Phase 2: ACADEMIA Flat Lessons Migration

### 2.1 Update Data Fetching
- [ ] Modify `usePlayerData.ts` to return flat lessons for ALL course types
- [ ] Remove the "default module" wrapper for ACADEMIA
- [ ] Ensure lessons are fetched from both `lessons[]` and `modules` subcollection

### 2.2 Create/Update Academia Sidebar
- [ ] Option A: Modify `NewSidebar.tsx` to support flat lessons
- [ ] Option B: Create new `AcademiaSidebar.tsx` with flat lesson list
- [ ] Match visual style (white bg, progress bar)

### 2.3 Update Player Page
- [ ] Update conditional rendering to use new ACADEMIA sidebar
- [ ] Remove module accordion dependency

---

## Phase 3: Terminology Integration

### 3.1 Instructor Terminology
- [ ] PODCAST: "Szereplő" (instead of "Mentor")
- [ ] Others: "Mentor"
- [ ] Use `getCourseTypeTerminology()` from `terminology.ts`

### 3.2 Navigation Labels
- [ ] Update lesson navigation buttons with type-specific text
- [ ] Update sidebar headers with appropriate labels

### 3.3 Player UI Labels
- [ ] "Következő lecke" → type-specific equivalent
- [ ] "Leckék" vs "Epizódok" based on type

---

## Phase 4: Navigation Control Differentiation

### 4.1 WEBINAR/PODCAST (Netflix Style)
- [ ] Auto-advance to next episode
- [ ] Larger play/pause controls
- [ ] Episode counter display
- [ ] Minimal lesson info below video

### 4.2 ACADEMIA/MASTERCLASS (Sidebar Style)
- [ ] Manual navigation with Prev/Next buttons
- [ ] Progress tracking prominent
- [ ] Full lesson description visible
- [ ] Learning outcomes displayed

---

## Phase 5: Testing & Polish

### 5.1 Test Matrix
- [ ] Create test courses for each type
- [ ] Verify correct layout rendered for each
- [ ] Test mobile responsiveness
- [ ] Verify terminology throughout

### 5.2 Edge Cases
- [ ] Courses with no lessons
- [ ] Single-lesson courses (WEBINAR)
- [ ] Courses mid-migration (both modules[] and lessons[])

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/usePlayerData.ts` | Fix courseType field, return flat lessons |
| `src/app/.../player/[lessonId]/page.tsx` | Fix conditional rendering, add logging |
| `src/components/course-player/NewSidebar.tsx` | Convert to flat lessons |
| `src/components/course-player/NetflixPlayerLayout.tsx` | Verify terminology |
| `src/lib/terminology.ts` | Add any missing terms |
| `functions/src/index.ts` | Ensure courseType returned in getCourse |

---

## Technical Notes

### Course Type Detection Flow
```
Firestore (course.courseType)
    ↓
getCourse Cloud Function
    ↓
usePlayerData hook
    ↓
usesNetflixLayout boolean
    ↓
Player page conditional rendering
    ↓
NetflixPlayerLayout OR Sidebar layout
```

### Key Constants
```typescript
// usePlayerData.ts
const NETFLIX_STYLE_COURSE_TYPES: CourseType[] = ['WEBINAR', 'PODCAST'];
const FLAT_LESSON_COURSE_TYPES: CourseType[] = ['WEBINAR', 'PODCAST', 'MASTERCLASS'];
```

---

## Progress Log

### 2025-11-22
- [x] Research completed
- [x] Plan created
- [ ] Phase 1 in progress
