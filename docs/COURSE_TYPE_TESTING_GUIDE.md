# Course Type Testing Guide

## Overview
This guide provides step-by-step instructions for testing the new course type system with 3 distinct types:
- **Akadémia**: Multi-lesson courses with structured curriculum
- **Webinár**: Single-lesson webinars with optional resources
- **Masterclass**: Comprehensive multi-module master courses

## Prerequisites
- Admin account with course creation permissions
- Access to `/admin/courses/new/edit`
- Firebase project: `dmaapp-477d4`
- Production URL: https://dma-3k3bbnq4z-dmas-projects-358f1142.vercel.app

---

## Test 1: Akadémia Course Creation

### Expected Flow
1. Type Selection (Step 0) → Basic Info (Step 1) → Curriculum (Step 2) → Publish (Step 3)

### Step-by-Step Instructions

#### 1. Navigate to Course Creation
- Go to `/admin/courses/new/edit`
- Should see **Step 0: Típus** (Course Type Selection)

#### 2. Select Akadémia Type
- Verify 3 cards are displayed:
  - **Akadémia** (Blue, BookOpen icon)
  - **Webinár** (Purple, Video icon)
  - **Masterclass** (Amber, GraduationCap icon)
- Click on **Akadémia** card
- Card should show checkmark and blue ring
- Info banner should appear: "Akadémia típusú kurzust választottál"
- Click **Tovább** button

#### 3. Fill Basic Info (Step 1)
- Toast should show: "Akadémia típus kiválasztva"
- Fill required fields:
  - **Cím**: "Teszt Akadémia Kurzus"
  - **Leírás**: "Ez egy teszt akadémia kurzus a típus ellenőrzésére"
  - **Kategória**: Select any (e.g., "Marketing")
  - **Oktató**: Select current user
  - **Nyelv**: "hu"
  - **Nehézség**: "BEGINNER"
  - **Tanulási célok**: "Akadémia kurzus tesztelése"
- **Verify**: Webinar fields should NOT be visible (no date, duration, livestream URL)
- Upload thumbnail (optional)
- Click **Tovább** button

#### 4. Build Curriculum (Step 2)
- Should navigate to **Curriculum Builder**
- Create at least 1 module:
  - Click **+ Modul hozzáadása**
  - Title: "1. modul"
  - Description: "Első modul leírása"
- Add at least 1 lesson to the module:
  - Click **+ Lecke hozzáadása**
  - Title: "1. lecke"
  - Type: "VIDEO"
  - Content: "Teszt tartalom"
- Click **Tovább** button

#### 5. Publish (Step 3)
- Review course details
- Click **Kurzus közzététele**
- Should see success toast: "Kurzus sikeresen létrehozva"

#### 6. Verification in Firestore
Check the created course document has:
```javascript
{
  courseType: "ACADEMIA",
  title: "Teszt Akadémia Kurzus",
  // No webinar-specific fields
  // modules subcollection exists with at least 1 module
  // lessons subcollection under module exists
}
```

#### 7. Check Cloud Function Logs
```bash
firebase functions:log --only createCourse
```
Should show:
- "Course created: {courseId} by user {userId} with type ACADEMIA"
- No webinar default module creation logs

---

## Test 2: Webinár Course Creation

### Expected Flow
1. Type Selection (Step 0) → Basic Info (Step 1) → **SKIP Curriculum** → Publish (Step 3)

### Step-by-Step Instructions

#### 1. Navigate to Course Creation
- Go to `/admin/courses/new/edit`
- Click **Új kurzus létrehozása** if not already in wizard

#### 2. Select Webinár Type
- Click on **Webinár** card (Purple)
- Card should show checkmark and purple ring
- Info banner: "Webinár típusú kurzust választottál"
- Click **Tovább** button

#### 3. Fill Basic Info (Step 1)
- Toast should show: "Webinár típus kiválasztva"
- Fill required fields:
  - **Cím**: "Teszt Webinár 2025"
  - **Leírás**: "Ez egy teszt webinár kurzus"
  - **Kategória**: Select any (e.g., "Sales")
  - **Oktató**: Select current user
  - **Nyelv**: "hu"
  - **Nehézség**: "BEGINNER"
  - **Tanulási célok**: "Webinár tesztelése"

#### 4. Fill Webinar-Specific Fields
**CRITICAL**: Verify webinar section is visible with purple border
- **Webinár dátuma és ideje**: Select any future date/time
- **Időtartam (percben)**: Enter "90"
- **Élő adás URL**: Enter "https://zoom.us/test" or leave empty
- **Felvétel elérhető**: Toggle ON or OFF
- Click **Tovább** button

#### 5. Verify Curriculum Step Skipped
- **CRITICAL**: Should navigate directly to **Step 3: Publish**
- Toast should show: "Webinár típusnál nincs tanterv lépés"
- Should NOT see Curriculum Builder
- Progress bar should show Step 2 as completed automatically

#### 6. Publish (Step 3)
- Review course details
- Click **Kurzus közzététele**
- Should see success toast

#### 7. Verification in Firestore
Check the created course document has:
```javascript
{
  courseType: "WEBINAR",
  title: "Teszt Webinár 2025",
  webinarDate: "2025-...",
  webinarDuration: 90,
  liveStreamUrl: "https://zoom.us/test",
  recordingAvailable: true,
  // Check subcollections:
  // - 1 auto-created module titled "Webinár"
  // - 1 auto-created lesson titled "Webinár felvétel" with type "VIDEO"
}
```

#### 8. Check Cloud Function Logs
```bash
firebase functions:log --only createCourse
```
Should show:
- "Course created: {courseId} by user {userId} with type WEBINAR"
- "Creating default module and lesson for webinar {courseId}"
- "Default module and lesson created for webinar {courseId}"

#### 9. Verify Auto-Created Structure
Navigate to Firestore console:
- `courses/{courseId}/modules` → Should have 1 document:
  - title: "Webinár"
  - description: "Webinár felvétel"
  - order: 0
  - status: "DRAFT"
- `courses/{courseId}/modules/{moduleId}/lessons` → Should have 1 document:
  - title: "Webinár felvétel"
  - content: "Töltsd fel a webinár videót"
  - type: "VIDEO"
  - order: 0
  - status: "DRAFT"

---

## Test 3: Masterclass Course Creation

### Expected Flow
1. Type Selection (Step 0) → Basic Info (Step 1) → Curriculum (Step 2) → Publish (Step 3)

### Step-by-Step Instructions

#### 1. Navigate to Course Creation
- Go to `/admin/courses/new/edit`
- Click **Új kurzus létrehozása** if needed

#### 2. Select Masterclass Type
- Click on **Masterclass** card (Amber)
- Card should show checkmark and amber ring
- Info banner: "Masterclass típusú kurzust választottál"
- Click **Tovább** button

#### 3. Fill Basic Info (Step 1)
- Toast should show: "Masterclass típus kiválasztva"
- Fill required fields:
  - **Cím**: "Teszt Masterclass - Marketing Excellence"
  - **Leírás**: "Átfogó marketing mesterkurzus"
  - **Kategória**: Select any (e.g., "Marketing")
  - **Oktató**: Select current user
  - **Nyelv**: "hu"
  - **Nehézség**: "ADVANCED"
  - **Tanulási célok**: "Masterclass tesztelése komplex tartalommal"
- **Verify**: Webinar fields should NOT be visible
- Click **Tovább** button

#### 4. Build Curriculum (Step 2)
- Should navigate to **Curriculum Builder**
- Create multiple modules (at least 2):
  - **Module 1**: "Alapok"
    - Lesson 1: "Bevezetés"
    - Lesson 2: "Marketing alapelvek"
  - **Module 2**: "Haladó technikák"
    - Lesson 1: "SEO optimalizálás"
    - Lesson 2: "Konverzió növelés"
- Click **Tovább** button

#### 5. Publish (Step 3)
- Review course details
- Click **Kurzus közzététele**
- Should see success toast

#### 6. Verification in Firestore
Check the created course document has:
```javascript
{
  courseType: "MASTERCLASS",
  title: "Teszt Masterclass - Marketing Excellence",
  difficulty: "ADVANCED",
  // No webinar-specific fields
  // modules subcollection exists with at least 2 modules
  // each module has lessons subcollection
}
```

#### 7. Check Cloud Function Logs
```bash
firebase functions:log --only createCourse
```
Should show:
- "Course created: {courseId} by user {userId} with type MASTERCLASS"
- No webinar default module creation logs

---

## Validation Checklist

### Type Selection (Step 0)
- [ ] All 3 course type cards display correctly
- [ ] Clicking a card shows visual feedback (checkmark, ring)
- [ ] Info banner appears with selected type
- [ ] "Tovább" button is disabled until selection
- [ ] "Tovább" button becomes enabled after selection

### Basic Info (Step 1)
- [ ] **Akadémia**: NO webinar fields visible
- [ ] **Webinár**: Webinar fields visible with purple border
- [ ] **Masterclass**: NO webinar fields visible
- [ ] Toast shows correct type name when proceeding

### Navigation Flow
- [ ] **Akadémia**: Step 0 → 1 → 2 → 3
- [ ] **Webinár**: Step 0 → 1 → **SKIP 2** → 3
- [ ] **Masterclass**: Step 0 → 1 → 2 → 3
- [ ] Webinar skipping shows info toast

### Cloud Function Validation
- [ ] **Akadémia**: Creates course with `courseType: "ACADEMIA"`, no auto-modules
- [ ] **Webinár**: Creates course with `courseType: "WEBINAR"` + webinar fields + auto-module/lesson
- [ ] **Masterclass**: Creates course with `courseType: "MASTERCLASS"`, no auto-modules
- [ ] All courses have `courseType` field (required)

### Firestore Structure
- [ ] **Akadémia**: Manually created modules/lessons exist
- [ ] **Webinár**: 1 auto-created module "Webinár" + 1 lesson "Webinár felvétel"
- [ ] **Masterclass**: Manually created modules/lessons exist

### Edge Cases
- [ ] Refreshing page mid-wizard preserves selected type (Zustand persistence)
- [ ] Going back from Step 1 to Step 0 allows changing type
- [ ] Validation errors display correctly for each type
- [ ] Thumbnail upload works for all types

---

## Common Issues and Troubleshooting

### Issue 1: Webinar Fields Not Showing
**Symptom**: Selected Webinár type but no date/duration fields visible

**Check**:
1. Verify `courseType` prop is passed to `CourseBasicInfoStep`:
   ```tsx
   <CourseBasicInfoStep courseType={courseType} ... />
   ```
2. Check browser console for errors
3. Verify Zustand store has `courseType` set:
   ```javascript
   useCourseWizardStore.getState().courseType // Should be "WEBINAR"
   ```

### Issue 2: Curriculum Not Skipped for Webinar
**Symptom**: Webinar shows Curriculum Builder instead of skipping to Publish

**Check**:
1. Verify `handleBasicInfoSubmit` in `CourseCreationWizard.tsx`:
   ```tsx
   if (courseType === 'WEBINAR') {
     markStepCompleted(2);
     setCurrentStep(3);
   }
   ```
2. Check `courseType` is correctly passed to submit handler

### Issue 3: No Auto-Module Created for Webinar
**Symptom**: Webinar course has no modules after creation

**Check**:
1. Firebase Functions logs: `firebase functions:log --only createCourse`
2. Verify Cloud Function has webinar auto-creation logic (lines 161-196 in `courseManagement.ts`)
3. Check Firestore rules allow module/lesson creation

### Issue 4: Type Not Persisted
**Symptom**: Refreshing page loses selected type

**Check**:
1. Verify Zustand persistence config includes `courseType`:
   ```typescript
   partialize: (state) => ({
     courseType: state.courseType, // Must be here
     ...
   })
   ```
2. Check browser localStorage: `course-wizard-storage`

---

## Testing Report Template

```markdown
## Course Type Testing Report
**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Environment**: Production

### Test Results

#### Akadémia
- [ ] PASS - Type selection displays correctly
- [ ] PASS - Basic info form works
- [ ] PASS - Curriculum builder accessible
- [ ] PASS - Course created successfully
- [ ] PASS - Firestore data correct
- **Course ID**: [courseId]
- **Notes**: [Any observations]

#### Webinár
- [ ] PASS - Type selection displays correctly
- [ ] PASS - Webinar fields visible and functional
- [ ] PASS - Curriculum step skipped
- [ ] PASS - Course created successfully
- [ ] PASS - Auto-module/lesson created
- [ ] PASS - Firestore data correct
- **Course ID**: [courseId]
- **Notes**: [Any observations]

#### Masterclass
- [ ] PASS - Type selection displays correctly
- [ ] PASS - Basic info form works
- [ ] PASS - Curriculum builder accessible
- [ ] PASS - Course created successfully
- [ ] PASS - Firestore data correct
- **Course ID**: [courseId]
- **Notes**: [Any observations]

### Issues Found
[List any bugs or unexpected behavior]

### Recommendations
[Any suggestions for improvements]
```

---

## Next Steps After Testing

Once all 3 course types are verified:

1. **Update Course Display Components**
   - Add type badges to course cards
   - Show type-specific information on detail pages

2. **Implement Course Filtering**
   - Create `CourseTypeFilter` component
   - Update course list pages with type filters
   - Use Firestore composite indexes for efficient queries

3. **Analytics & Reporting**
   - Track course type distribution
   - Type-based enrollment analytics
   - Instructor dashboard with type breakdown

4. **Documentation**
   - User guide for each course type
   - Best practices for webinar vs. academia
   - Migration guide for existing content

---

## Contact

**Issues or Questions?**
- Check Firebase logs: `firebase functions:log`
- Review Cloud Functions code: `/functions/src/courseManagement.ts`
- Check Firestore console: https://console.firebase.google.com/project/dmaapp-477d4/firestore
