# Testing Course Player Functions

This guide covers how to test the new course player Cloud Functions and features.

## Prerequisites

1. **Deployed Functions** ✅
   - `markLessonComplete`
   - `getResourceDownloadUrls`
   - `reportLessonIssue`

2. **Updated Security Rules** ✅
   - Support tickets rules
   - Lesson progress rules

3. **Composite Indexes** ✅
   - Support tickets indexes
   - Lesson progress indexes

4. **Migration Script** ✅
   - `/functions/migrate-lessons.js`

## Running the Migration

### Option 1: Using Node.js Directly (Development)

```bash
cd functions

# Set your Firebase project
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"

# Or use gcloud auth
gcloud auth application-default login

# Run the migration
node migrate-lessons.js
```

### Option 2: Using Firebase Emulators (Safe Testing)

```bash
# Start emulators
firebase emulators:start

# In another terminal, run migration against emulators
cd functions
FIRESTORE_EMULATOR_HOST="localhost:8088" node migrate-lessons.js
```

### Option 3: Deploy as Cloud Function (Production)

Add to `/functions/src/index.ts`:

```typescript
import { onRequest } from 'firebase-functions/v2/https';
const { migrateLessons } = require('./migrate-lessons');

export const runLessonMigration = onRequest(
  { cors: true, region: 'us-central1' },
  async (request, response) => {
    // Add admin authentication check here
    try {
      const result = await migrateLessons();
      response.json(result);
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  }
);
```

Then deploy and trigger once:
```bash
firebase deploy --only functions:runLessonMigration
curl -X POST https://us-central1-dmaapp-477d4.cloudfunctions.net/runLessonMigration
```

## Testing Functions

### Test 1: Report Lesson Issue

**Setup:**
1. Navigate to any course player page: `/courses/{courseId}/player/{lessonId}`
2. Ensure you're logged in

**Test Steps:**
1. Click "Probléma jelentése" button in the Learning Companion Panel (right sidebar)
2. Fill out the form:
   - **Issue Type**: Select "Videó probléma"
   - **Subject**: "Test issue - video not loading"
   - **Description**: "The video player shows a black screen at 5:30 timestamp"
3. Click "Jelentés küldése"

**Expected Results:**
- Success message: "Köszönjük a jelentést! Hamarosan válaszolunk."
- Green checkmark icon displayed
- Dialog closes after 2 seconds
- Check Firestore Console:
  - New document in `supportTickets` collection
  - Fields: `userId`, `userEmail`, `userName`, `lessonId`, `courseId`, `issueType`, `subject`, `description`, `priority`, `status`, `browser`, `platform`, `url`, `createdAt`
  - Priority should be "high" for video issues
- Check Firestore Console:
  - New document in `auditLog` collection with action "REPORT_LESSON_ISSUE"

### Test 2: Mark Lesson Complete

**Setup:**
1. Navigate to a lesson you haven't completed
2. Ensure you're logged in

**Test Steps:**
1. Click "Megjelölés befejezettként" button in Learning Companion Panel
2. Wait for completion

**Expected Results:**
- Loading state shown on button during processing
- Toast notification appears:
  - If lesson complete: "Lecke befejezve!"
  - If course complete: "Gratulálunk! Teljesítetted a kurzust!"
- Check Firestore Console:
  - New/updated document in `lessonProgress/{userId}_{lessonId}`
  - Fields: `userId`, `lessonId`, `courseId`, `watchPercentage: 100`, `completed: true`, `completedAt`, `timeSpent`
- If course completed:
  - Enrollment document updated with `completedAt` timestamp and `progress: 100`
  - Redirects to course page after 3 seconds
- UI updates:
  - Progress ring shows 100%
  - Status changes to "Befejezve"
  - Learning outcomes checkmarks turn green

### Test 3: Download Resources

**Setup:**
1. Navigate to a lesson that has resources
2. Or manually add resources to a lesson in Firestore:

```javascript
// In Firestore Console, add to lesson document:
{
  resources: [
    {
      title: "Course Slides.pdf",
      type: "PDF",
      url: "gs://dmaapp-477d4.firebasestorage.app/resources/slides.pdf",
      size: 1024000,
      downloadable: true
    }
  ]
}
```

**Test Steps:**
1. Click "Források letöltése" button in Learning Companion Panel
2. Wait for processing

**Expected Results:**
- Toast notification: "X forrás letöltése elindult..."
- Browser download prompts appear (staggered by 500ms each)
- If no resources: Toast shows "Nincs elérhető forrás"
- Check browser downloads folder for downloaded files
- Check Cloud Functions logs for signed URL generation

### Test 4: Lesson Progress Sync (Already exists)

**Setup:**
1. Complete part of a lesson on one device/browser
2. Open same lesson on different device/browser

**Test Steps:**
1. Navigate to the same lesson
2. Watch for progress to load

**Expected Results:**
- Progress matches across devices
- Resume position restored
- Time spent accurate

## Verifying Firestore Data

### Check Support Tickets
```bash
# Firebase Console
firebase firestore:get supportTickets --limit 10 --order-by createdAt desc
```

Or in Firestore Console:
1. Go to Firestore Database
2. Navigate to `supportTickets` collection
3. Verify ticket structure and data

### Check Lesson Progress
```bash
# Query for specific user's progress
firebase firestore:get lessonProgress \
  --where "userId=={userId}" \
  --order-by updatedAt desc \
  --limit 10
```

Or in Firestore Console:
1. Go to `lessonProgress` collection
2. Filter by your userId
3. Verify progress data

### Check Audit Logs
```bash
# View recent audit logs
firebase firestore:get auditLog \
  --order-by timestamp desc \
  --limit 20
```

## Testing with Emulators (Recommended for Development)

### Start Emulators
```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start Next.js with emulator config
NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true npm run dev
```

### Test Functions Locally
```bash
# Call function directly
curl -X POST http://localhost:5003/dmaapp-477d4/us-central1/markLessonComplete \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "lessonId": "lesson123",
      "courseId": "course456",
      "timeSpent": 300
    }
  }'
```

## Monitoring in Production

### View Function Logs
```bash
# Real-time logs
firebase functions:log --only markLessonComplete,getResourceDownloadUrls,reportLessonIssue

# View in Cloud Console
# https://console.cloud.google.com/functions/list?project=dmaapp-477d4
```

### Check Function Performance
```bash
# Firebase Console > Functions > Performance tab
# Monitor:
# - Invocation count
# - Execution time
# - Error rate
# - Memory usage
```

## Common Issues and Troubleshooting

### Issue: "Permission denied" when creating support ticket
**Solution:** Check Firestore security rules for `supportTickets` collection

### Issue: "Function not found" error
**Solution:** Ensure functions are deployed: `firebase deploy --only functions`

### Issue: Resources download fails
**Solution:**
- Check Firebase Storage permissions
- Verify resource URLs in Firestore
- Check signed URL expiration (1 hour)

### Issue: Progress not syncing
**Solution:**
- Check `lessonProgress` collection structure
- Verify user is authenticated
- Check composite indexes are built

### Issue: Migration script fails
**Solution:**
- Verify Firebase Admin SDK credentials
- Check Firestore permissions
- Run with emulators first

## Next Steps After Testing

1. ✅ Test all three functions
2. ✅ Verify Firestore data structure
3. ✅ Run migration on production data
4. ✅ Monitor function performance
5. ⏳ Create admin dashboard for support tickets
6. ⏳ Implement email notifications for ticket responses
7. ⏳ Add analytics tracking for completion rates
8. ⏳ Implement certificate generation

## Resources

- [Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Course Player Schema](/docs/FIRESTORE_SCHEMA_COURSE_PLAYER.md)
