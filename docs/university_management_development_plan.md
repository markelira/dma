# University Management System - Complete AI-Ready Development Plan
---

## 🎯 CONTEXT

You are implementing a **University Management Layer** for DMA e-learning platform. This is a **B2B component** that allows universities to manage their own instructors, courses, and students within the existing B2C platform.

**Critical Requirements:**
- **Multi-tenant architecture**: Complete data isolation between universities
- **Approval workflow**: University instructors create courses → University admins approve → Public visibility
- **Role-based dashboards**: Different interfaces for university admins vs instructors
- **Analytics system**: University-scoped metrics and insights
- **Permission boundaries**: Strict access control with no data leakage

**Tech Stack:** Next.js 15, TypeScript, Firebase Firestore, Cloud Functions, Tailwind CSS
**Rule:** NO PLACEHOLDERS - only complete, working implementations

---

## 📋 IMPLEMENTATION PHASES

### **PHASE 1: DATABASE FOUNDATION (Days 1-2)**

#### Task 1.1: Extend Type Definitions
```typescript
// TARGET FILE: /src/types/index.ts
// REQUIREMENT: Add university management types to existing type system
```

**PROMPT FOR AI:**
```
Update /src/types/index.ts to add university management types:

1. Extend existing User interface:
   - Add optional university field: { id: string, name: string, role: 'INSTRUCTOR' | 'ADMIN', joinedAt: string }
   - Update role enum to include: 'UNIVERSITY_INSTRUCTOR' | 'UNIVERSITY_ADMIN' | 'PLATFORM_ADMIN'
   - Keep all existing fields unchanged

2. Extend existing Course interface:
   - Add approvalStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
   - Add optional approvedBy?: string
   - Add optional approvedAt?: string  
   - Add optional rejectionReason?: string
   - Add optional submittedForApprovalAt?: string
   - Keep all existing fields unchanged

3. Create new CourseApproval interface:
   ```typescript
   interface CourseApproval {
     id: string
     courseId: string
     instructorId: string
     universityId: string
     status: 'PENDING' | 'APPROVED' | 'REJECTED'
     submittedAt: string
     reviewedAt?: string
     reviewedBy?: string
     rejectionReason?: string
     courseSnapshot: Partial<Course>
   }
   ```

4. Create UniversityDashboard interface:
   ```typescript
   interface UniversityDashboard {
     totalCourses: number
     pendingApprovals: number
     publishedCourses: number
     averageCourseRating: number
     totalEnrolledStudents: number
     activeStudents: number
     totalCompletedCourses: number
     averageCompletionRate: number
     totalInstructors: number
     totalLearningHours: number
     quizSuccessRate: number
     certificatesIssued: number
     monthlyEnrollments: Array<{ month: string, count: number }>
     topPerformingInstructors: Array<{
       id: string
       name: string
       courseCount: number
       avgRating: number
       studentCount: number
     }>
   }
   ```

Complete implementation with proper TypeScript, no placeholders.
```

#### Task 1.2: Update Auth Store for University Roles
```typescript
// TARGET FILE: /src/stores/authStore.ts
// REQUIREMENT: Extend auth system to handle university roles and context
```

**PROMPT FOR AI:**
```
Update /src/stores/authStore.ts to support university roles:

1. Update User interface import to use the new extended User type from /src/types/index.ts

2. Add university context to the auth state:
   - Add currentUniversity: University | null to state
   - Add setUniversity: (university: University | null) => void action
   - Add clearUniversity: () => void action

3. Update role checking helpers:
   - Add isUniversityRole: () => boolean method that returns true if user has UNIVERSITY_INSTRUCTOR or UNIVERSITY_ADMIN role
   - Add isUniversityAdmin: () => boolean method
   - Add isUniversityInstructor: () => boolean method
   - Add isPlatformAdmin: () => boolean method (checks for PLATFORM_ADMIN role)

4. Update persistence configuration:
   - Include currentUniversity in partialize
   - Handle university data in onRehydrateStorage

5. Maintain backward compatibility:
   - All existing auth functions must continue working
   - No breaking changes to current auth flow

Complete implementation with proper Zustand patterns and TypeScript.
```

#### Task 1.3: Create Database Indexes
```typescript
// TARGET FILE: /firestore.indexes.json (NEW FILE)
// PURPOSE: Define composite indexes for university-scoped queries
```

**PROMPT FOR AI:**
```
Create /firestore.indexes.json with required composite indexes for university management:

1. Course approvals indexes:
   - universityId + status + submittedAt (desc)
   - instructorId + status + submittedAt (desc)
   - courseId + status

2. University analytics indexes:
   - enrollments: universityId + enrolledAt (desc)
   - courses: universityId + status + createdAt (desc)
   - lessonProgress: universityId + completedAt (desc)

3. Performance indexes:
   - users: university.id + role + createdAt (desc)
   - courses: approvalStatus + universityId + publishedAt (desc)

4. Multi-field sorting indexes:
   - courses: universityId + averageRating (desc) + enrollmentCount (desc)
   - instructors: universityId + role + lastActiveAt (desc)

Format as proper Firebase composite index configuration.
Include field arrays with proper ascending/descending directions.
Add collectionGroup indexes where needed for cross-collection queries.
```

---

### **PHASE 2: BACKEND CORE FUNCTIONS (Days 3-5)**

#### Task 2.1: University Management Actions
```typescript
// TARGET FILE: /functions/src/universityManagementActions.ts (NEW FILE)
// PURPOSE: Core university management Cloud Functions
```

**PROMPT FOR AI:**
```
Create complete /functions/src/universityManagementActions.ts with these functions:

1. assignUserToUniversity function:
   - Accept: { userId: string, universityId: string, role: 'INSTRUCTOR' | 'ADMIN' }
   - Verify caller has PLATFORM_ADMIN role
   - Update user document with university information
   - Validate university exists
   - Handle role transitions properly
   - Return updated user object

2. removeUserFromUniversity function:
   - Accept: { userId: string }
   - Verify caller has PLATFORM_ADMIN role
   - Clear university field from user document
   - Handle active courses/approvals cleanup
   - Return success status

3. getUniversityUsers function:
   - Accept: { universityId: string, role?: 'INSTRUCTOR' | 'ADMIN' }
   - Verify caller is university admin or platform admin
   - Return paginated list of university users
   - Include user statistics (courses created, students taught, etc.)

4. updateUniversityUserRole function:
   - Accept: { userId: string, newRole: 'INSTRUCTOR' | 'ADMIN' }
   - Verify caller is university admin for same university
   - Update user role within university context
   - Validate permission boundaries

All functions require proper:
- Authentication and authorization checks
- Input validation with Zod schemas
- Error handling with descriptive Hungarian messages
- Firestore transaction usage where needed
- TypeScript interfaces
- Logging for audit trail

Export all functions and add to /functions/src/index.ts.
```

#### Task 2.2: Course Approval Workflow
```typescript
// TARGET FILE: /functions/src/courseApprovalActions.ts (NEW FILE)
// PURPOSE: Complete course approval workflow system
```

**PROMPT FOR AI:**
```
Create complete /functions/src/courseApprovalActions.ts with approval workflow:

1. submitCourseForApproval function:
   - Accept: { courseId: string }
   - Verify caller is UNIVERSITY_INSTRUCTOR and course owner
   - Validate course completeness (has title, description, at least one module with lessons)
   - Create CourseApproval document in 'courseApprovals' collection
   - Update course status to 'PENDING_APPROVAL'
   - Set submittedForApprovalAt timestamp
   - Create snapshot of course data
   - Return approval document ID

2. approveCourse function:
   - Accept: { approvalId: string, adminNotes?: string }
   - Verify caller is UNIVERSITY_ADMIN for same university
   - Update approval document status to 'APPROVED'
   - Update course status to 'PUBLISHED'  
   - Set approvedBy and approvedAt fields
   - Make course publicly visible
   - Send notification to instructor
   - Return updated approval data

3. rejectCourse function:
   - Accept: { approvalId: string, rejectionReason: string }
   - Verify caller is UNIVERSITY_ADMIN for same university
   - Update approval document status to 'REJECTED'
   - Update course status back to 'DRAFT'
   - Set rejection reason and reviewedAt timestamp
   - Send notification to instructor with feedback
   - Return updated approval data

4. getCourseApprovalQueue function:
   - Accept: { universityId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED' }
   - Verify caller is UNIVERSITY_ADMIN for specified university
   - Return paginated list of course approvals
   - Include course data and instructor information
   - Sort by submission date (newest first)

5. getCourseApprovalHistory function:
   - Accept: { courseId: string }
   - Verify caller has access to course
   - Return complete approval history for course
   - Include all approval attempts and outcomes

Use Firestore transactions for status updates.
Add proper error handling and validation.
Include comprehensive logging.
Export functions to index.ts.
```

#### Task 2.3: Update Existing Course Actions
```typescript
// TARGET FILE: /functions/src/courseActions.ts (MODIFY EXISTING)
// PURPOSE: Update course creation to support university approval workflow
```

**PROMPT FOR AI:**
```
Update existing /functions/src/courseActions.ts to support university instructors:

1. Modify createCourse function (currently disabled for seeding):
   - Re-enable the function by removing the temporary disable
   - Update role check to allow 'UNIVERSITY_INSTRUCTOR' role
   - For UNIVERSITY_INSTRUCTOR: set initial status to 'DRAFT' (not published)
   - For PLATFORM_ADMIN: allow immediate publishing as before
   - Add university context validation for university instructors
   - Ensure course is associated with instructor's university

2. Update getCourses function:
   - Add universityId filtering support
   - For public browsing: only show 'PUBLISHED' status courses
   - For university admins: show their university's courses in all statuses
   - Add approvalStatus filtering parameter

3. Add getCoursesForUniversity function:
   - Accept: { universityId: string, status?: string, instructorId?: string }
   - Verify caller is university admin or platform admin
   - Return university-scoped course list
   - Include approval status and instructor information
   - Support pagination and filtering

4. Add getCourseApprovalStatus function:
   - Accept: { courseId: string }
   - Return current approval status and history
   - Include rejection reasons if applicable

Maintain all existing functionality.
Keep backward compatibility with current course system.
Add proper TypeScript for new parameters.
Handle both university and non-university courses seamlessly.
```

#### Task 2.4: University Analytics Engine
```typescript
// TARGET FILE: /functions/src/universityAnalyticsActions.ts (NEW FILE)
// PURPOSE: Comprehensive university analytics and reporting
```

**PROMPT FOR AI:**
```
Create complete /functions/src/universityAnalyticsActions.ts for university analytics:

1. getUniversityDashboard function:
   - Accept: { universityId: string, dateRange?: { start: string, end: string } }
   - Verify caller is university admin for specified university
   - Calculate all UniversityDashboard metrics:
     * Course statistics (total, pending, published, average rating)
     * Student metrics (enrolled, active, completed courses, completion rates)
     * Instructor performance (total count, top performers by rating/students)
     * Learning analytics (total hours, quiz success, certificates)
   - Use Firestore aggregation queries for performance
   - Return complete UniversityDashboard object

2. getUniversityStudentAnalytics function:
   - Accept: { universityId: string, timeframe: 'week' | 'month' | 'year' }
   - Return detailed student engagement metrics
   - Include individual student progress (anonymized for GDPR)
   - Course completion trends over time
   - Most popular courses and drop-off points

3. getUniversityInstructorPerformance function:
   - Accept: { universityId: string, instructorId?: string }
   - Return instructor performance metrics
   - Include course ratings, student feedback, engagement
   - Compare instructor performance within university
   - Identify training opportunities

4. getUniversityCourseTrends function:
   - Accept: { universityId: string, period: 'monthly' | 'quarterly' }
   - Return course enrollment and completion trends
   - Identify seasonal patterns
   - Course popularity rankings over time

5. exportUniversityReport function:
   - Accept: { universityId: string, reportType: 'summary' | 'detailed', format: 'json' | 'csv' }
   - Generate comprehensive university performance report
   - Include all key metrics and trends
   - Support different export formats

All functions must:
- Use efficient Firestore queries with proper indexes
- Implement data caching for expensive calculations
- Respect GDPR by anonymizing individual data where required
- Include proper error handling and logging
- Return typed data matching UniversityDashboard interface
- Support date range filtering for trend analysis

Export all functions to index.ts.
```

---

### **PHASE 3: FRONTEND INFRASTRUCTURE (Days 6-8)**

#### Task 3.1: University Context Provider
```typescript
// TARGET FILE: /src/contexts/UniversityContext.tsx (NEW FILE)
// PURPOSE: React context for university-scoped data and operations
```

**PROMPT FOR AI:**
```
Create /src/contexts/UniversityContext.tsx for university state management:

1. Create UniversityContextType interface:
   - currentUniversity: University | null
   - universityDashboard: UniversityDashboard | null
   - approvalQueue: CourseApproval[]
   - isLoading: boolean
   - error: string | null
   - actions for data operations

2. Implement UniversityProvider component:
   - Manage university-scoped state
   - Fetch university dashboard data
   - Handle course approval operations
   - Provide real-time updates via Firestore listeners
   - Cache data with React Query integration

3. Create custom hooks:
   - useUniversity() - access current university context
   - useUniversityDashboard() - dashboard data with loading states
   - useCourseApprovals() - approval queue management
   - useUniversityPermissions() - role-based permission checks

4. Integration with existing auth:
   - Connect to authStore for user university data
   - Handle university switching for platform admins
   - Provide seamless role-based data access

5. Real-time subscriptions:
   - Listen to course approval changes
   - Update dashboard metrics in real-time
   - Handle university data updates

Complete implementation with TypeScript, proper error handling, and React best practices.
```

#### Task 3.2: University Dashboard Layout
```typescript
// TARGET FILE: /src/app/(dashboard)/university/layout.tsx (NEW FILE)
// PURPOSE: Layout wrapper for all university management pages
```

**PROMPT FOR AI:**
```
Create /src/app/(dashboard)/university/layout.tsx for university dashboard layout:

1. University navigation sidebar:
   - Dashboard overview
   - Course management (with approval badge count)
   - Instructor management
   - Student analytics
   - University settings
   - Role-based menu items (different for admin vs instructor)

2. University header:
   - Current university name and logo
   - University switching dropdown (for platform admins)
   - Quick stats summary (pending approvals, active courses)
   - User profile with university role display

3. Role-based access control:
   - Check user has university role
   - Redirect unauthorized users
   - Show different navigation based on UNIVERSITY_ADMIN vs UNIVERSITY_INSTRUCTOR

4. University context integration:
   - Wrap pages with UniversityProvider
   - Handle loading states
   - Show error boundaries for university data

5. Responsive design:
   - Mobile-friendly navigation
   - Collapsible sidebar
   - Touch-friendly controls

Use existing dashboard layout patterns from /src/app/(dashboard)/dashboard/layout.tsx.
Maintain consistent styling with Tailwind CSS.
Include proper TypeScript and accessibility features.
```

#### Task 3.3: University Dashboard Main Page
```typescript
// TARGET FILE: /src/app/(dashboard)/university/page.tsx (NEW FILE)
// PURPOSE: Main university admin dashboard with metrics and quick actions
```

**PROMPT FOR AI:**
```
Create /src/app/(dashboard)/university/page.tsx as the main university dashboard:

1. Dashboard header:
   - Welcome message with university name
   - Quick action buttons (Add Instructor, Review Approvals, View Reports)
   - Last updated timestamp

2. Key metrics cards:
   - Total Courses (with published/pending breakdown)
   - Active Students (with growth indicator)
   - Course Completion Rate (with trend)
   - Average Course Rating (with recent changes)
   - Pending Approvals (with urgent badge)

3. Quick insights section:
   - Top performing courses (enrollment/ratings)
   - Instructor performance summary
   - Recent student activity
   - Weekly enrollment trends chart

4. Action items:
   - Pending course approvals (quick review links)
   - Instructor requests awaiting response
   - System notifications
   - Recommended actions based on metrics

5. Recent activity feed:
   - Course submissions
   - Student enrollments  
   - Instructor activities
   - Course completions

Use React Query for data fetching with proper loading states.
Implement real-time updates with Firestore listeners.
Add interactive charts using recharts library.
Include proper error handling and empty states.
Follow existing dashboard component patterns.

Complete responsive implementation with TypeScript.
```

#### Task 3.4: Course Approval Queue Interface
```typescript
// TARGET FILE: /src/app/(dashboard)/university/approvals/page.tsx (NEW FILE)
// PURPOSE: Course approval queue management interface
```

**PROMPT FOR AI:**
```
Create /src/app/(dashboard)/university/approvals/page.tsx for course approvals:

1. Approval queue header:
   - Filter options (All, Pending, Approved, Rejected)
   - Sort options (Newest first, Course title, Instructor)
   - Search by course title or instructor name
   - Bulk actions (if multiple selections)

2. Approval cards layout:
   - Course thumbnail, title, instructor name
   - Submission date and current status
   - Course statistics (modules, lessons, estimated duration)
   - Quick preview of course content
   - Approval action buttons (Approve, Reject, Review)

3. Detailed review modal:
   - Complete course information
   - Module and lesson breakdown
   - Instructor profile information
   - Course learning objectives
   - Approval form with notes field
   - Side-by-side comparison if resubmission

4. Approval actions:
   - Approve course with optional admin notes
   - Reject with required rejection reason
   - Request changes with specific feedback
   - View approval history

5. Status tracking:
   - Visual status indicators
   - Timeline of approval process
   - Notification system integration
   - Audit trail display

Include real-time updates when approvals change.
Add keyboard shortcuts for quick approvals.
Implement bulk approval functionality.
Use proper loading states and error handling.

Complete implementation with responsive design and accessibility.
```

---

### **PHASE 4: UNIVERSITY ANALYTICS DASHBOARD (Days 9-11)**

#### Task 4.1: University Analytics Components
```typescript
// TARGET FILE: /src/components/university/analytics/ (NEW DIRECTORY)
// PURPOSE: Reusable analytics components for university dashboards
```

**PROMPT FOR AI:**
```
Create university analytics components in /src/components/university/analytics/:

1. /StudentEngagementChart.tsx:
   - Line chart showing student activity over time
   - Props: { universityId: string, timeRange: string }
   - Display active students, course starts, completions
   - Interactive tooltips with detailed metrics
   - Export data functionality

2. /CoursePerformanceTable.tsx:
   - Sortable table of course performance metrics
   - Columns: Course, Instructor, Enrollments, Completion Rate, Rating
   - Filtering by instructor, date range, course status
   - Click-through to individual course analytics
   - Pagination for large datasets

3. /InstructorPerformanceRanking.tsx:
   - Ranking table of instructor performance
   - Metrics: Course count, student count, average rating, completion rate
   - Visual indicators for top performers
   - Comparison against university averages
   - Drill-down to instructor details

4. /UniversityMetricsGrid.tsx:
   - Grid layout of key university KPIs
   - Cards for each metric with trend indicators
   - Color-coded performance indicators
   - Click-through for detailed views
   - Real-time data updates

5. /TrendAnalysisChart.tsx:
   - Multi-line chart for trend analysis
   - Configurable metrics (enrollments, completions, revenue)
   - Date range selector
   - Comparison between different time periods
   - Export chart as image functionality

All components must:
- Use recharts for chart visualizations
- Include proper loading and error states
- Support responsive design for mobile
- Handle empty data states gracefully
- Use TypeScript for all props and data
- Follow existing component patterns
- Include accessibility features

Export all components from index.ts in the directory.
```

#### Task 4.2: University Analytics Main Page
```typescript
// TARGET FILE: /src/app/(dashboard)/university/analytics/page.tsx (NEW FILE)
// PURPOSE: Comprehensive university analytics dashboard
```

**PROMPT FOR AI:**
```
Create /src/app/(dashboard)/university/analytics/page.tsx:

1. Analytics dashboard header:
   - Time range selector (Last 7 days, 30 days, 3 months, Year, Custom)
   - Export options (PDF report, CSV data, Excel)
   - Refresh data button with last updated timestamp
   - University comparison toggle (if platform admin)

2. Key metrics overview:
   - Student engagement summary
   - Course performance overview
   - Instructor effectiveness metrics
   - Learning outcome statistics
   - Financial performance indicators (if applicable)

3. Interactive charts section:
   - Student enrollment trends over time
   - Course completion rates by category
   - Instructor performance comparison
   - Seasonal learning patterns
   - Device usage analytics (mobile vs desktop)

4. Detailed analytics tables:
   - Top performing courses with detailed metrics
   - Student progress tracking (anonymized for GDPR)
   - Instructor activity and effectiveness
   - Course dropout analysis

5. Actionable insights:
   - Automated recommendations based on data
   - Areas for improvement identification
   - Success pattern recognition
   - Benchmarking against other universities (anonymized)

6. Export and reporting:
   - Generate comprehensive reports
   - Schedule automated reports
   - Share insights with stakeholders
   - Data visualization customization

Use the analytics components from previous task.
Implement data caching for performance.
Add real-time updates where appropriate.
Include proper loading states and error handling.
Support mobile-responsive design.

Complete implementation with TypeScript and accessibility.
```

#### Task 4.3: Individual Course Analytics
```typescript
// TARGET FILE: /src/app/(dashboard)/university/analytics/course/[courseId]/page.tsx (NEW FILE)
// PURPOSE: Detailed analytics for individual courses
```

**PROMPT FOR AI:**
```
Create detailed course analytics at /src/app/(dashboard)/university/analytics/course/[courseId]/page.tsx:

1. Course analytics header:
   - Course title, instructor, and basic information
   - Enrollment and completion statistics
   - Time range selector for data analysis
   - Export course report functionality

2. Student engagement metrics:
   - Enrollment timeline and trends
   - Lesson completion rates by module
   - Student drop-off points analysis
   - Time spent on each lesson
   - Quiz performance statistics

3. Content performance analysis:
   - Most engaging lessons (high completion rates)
   - Lessons with high drop-off rates
   - Quiz question analysis (easy vs difficult)
   - Video engagement patterns (rewind points, skip points)
   - Student feedback and ratings

4. Learning outcome tracking:
   - Learning objective achievement rates
   - Skill progression through course modules
   - Pre/post assessment comparisons (if available)
   - Certificate completion rates

5. Instructor insights:
   - Student questions and support requests
   - Common learning challenges identified
   - Course improvement recommendations
   - Peer comparison with similar courses

6. Actionable recommendations:
   - Content improvement suggestions
   - Student support opportunities
   - Course structure optimization
   - Marketing and enrollment strategies

Include interactive visualizations for all metrics.
Add drill-down capabilities for detailed analysis.
Support comparison with other courses.
Implement real-time data updates.
Add export functionality for reports.

Use existing analytics components where possible.
Complete responsive implementation with TypeScript.
```

---

### **PHASE 5: INSTRUCTOR MANAGEMENT SYSTEM (Days 12-14)**

#### Task 5.1: Instructor Management Interface
```typescript
// TARGET FILE: /src/app/(dashboard)/university/instructors/page.tsx (NEW FILE)
// PURPOSE: University instructor management and assignment interface
```

**PROMPT FOR AI:**
```
Create /src/app/(dashboard)/university/instructors/page.tsx for instructor management:

1. Instructor management header:
   - Add new instructor button (search existing users or invite new)
   - Filter options (Active, Inactive, Pending invitation)
   - Search by name, email, or specialization
   - Bulk actions (Enable/Disable, Send notifications)

2. Instructor list/grid view:
   - Instructor profile cards with photo, name, specialization
   - Course count and student statistics
   - Performance metrics (rating, completion rates)
   - Status indicators (Active, Inactive, Pending)
   - Quick action buttons (View profile, Edit permissions, Remove)

3. Add instructor functionality:
   - Search existing platform users by email
   - Send invitation to new instructors via email
   - Set instructor permissions and access levels
   - Assign to specific course categories or subjects
   - Set role (UNIVERSITY_INSTRUCTOR vs course-specific permissions)

4. Instructor profile management:
   - Edit instructor information and bio
   - Manage course assignments
   - Set teaching permissions and restrictions
   - View instructor performance history
   - Send direct messages or notifications

5. Performance tracking:
   - Instructor effectiveness metrics
   - Student feedback compilation
   - Course creation and maintenance activity
   - Professional development tracking

6. Bulk operations:
   - Mass invitation system
   - Permission updates across multiple instructors
   - Notification broadcasting
   - Export instructor data

Include proper permission checks (only university admins can manage instructors).
Add confirmation modals for destructive actions.
Implement real-time updates for instructor status changes.
Support pagination for large instructor lists.
Add sorting and filtering capabilities.

Complete implementation with responsive design and TypeScript.
```

#### Task 5.2: Instructor Assignment Workflow
```typescript
// TARGET FILE: /src/components/university/InstructorAssignment.tsx (NEW FILE)
// PURPOSE: Component for assigning instructors to university with role management
```

**PROMPT FOR AI:**
```
Create /src/components/university/InstructorAssignment.tsx for instructor assignments:

1. Instructor search interface:
   - Search existing platform users by email or name
   - Filter by current role (independent instructors, unassigned users)
   - Display search results with user profiles
   - Show current university affiliations (if any)

2. Assignment form:
   - Select instructor from search results
   - Choose university role (UNIVERSITY_INSTRUCTOR or UNIVERSITY_ADMIN)
   - Set specific permissions and access levels
   - Add course category restrictions (if applicable)
   - Set effective date and optional expiration

3. Role management:
   - Clear explanation of role differences
   - Permission matrix display
   - Course creation capabilities
   - Student data access levels
   - Analytics and reporting permissions

4. Confirmation workflow:
   - Review assignment details
   - Send invitation email to instructor
   - Set up instructor onboarding process
   - Create audit log entry

5. Existing instructor management:
   - Update instructor roles within university
   - Transfer instructors between universities (platform admin only)
   - Suspend or remove instructor access
   - Handle course ownership transfers

6. Integration points:
   - Connect with university user management
   - Sync with course ownership systems
   - Update permission boundaries in real-time
   - Trigger notification systems

Props interface:
- universityId: string
- onAssignmentComplete: (instructor: User) => void
- allowedRoles: ('UNIVERSITY_INSTRUCTOR' | 'UNIVERSITY_ADMIN')[]
- existingInstructors: User[]

Use proper form validation with react-hook-form.
Include loading states and error handling.
Add confirmation dialogs for important actions.
Support bulk assignment operations.

Complete component with TypeScript and accessibility.
```

#### Task 5.3: Instructor Onboarding System
```typescript
// TARGET FILE: /src/app/(dashboard)/university/instructors/onboarding/page.tsx (NEW FILE)
// PURPOSE: Onboarding flow for new university instructors
```

**PROMPT FOR AI:**
```
Create instructor onboarding system at /src/app/(dashboard)/university/instructors/onboarding/page.tsx:

1. Onboarding progress tracker:
   - Multi-step progress indicator
   - Current step highlighting
   - Completion status for each step
   - Ability to jump between completed steps

2. University introduction:
   - University welcome message and branding
   - University-specific policies and guidelines
   - Course creation standards and requirements
   - Student interaction expectations

3. Platform orientation:
   - Course management system overview
   - Student analytics and tracking tools
   - Communication and support systems
   - Technical requirements and best practices

4. Profile setup:
   - Complete instructor profile information
   - Upload professional photo and credentials
   - Set teaching specializations and interests
   - Configure notification preferences

5. Course creation walkthrough:
   - Step-by-step course creation guide
   - Template and best practice examples
   - Approval workflow explanation
   - Content quality guidelines

6. Practice environment:
   - Sandbox course creation
   - Test student interactions
   - Practice using analytics tools
   - Explore all available features

7. Final setup:
   - Review and confirm university policies
   - Set up first course (optional)
   - Schedule follow-up check-in
   - Access to support resources

Include interactive tutorials and tooltips.
Provide downloadable resources and guides.
Add progress saving functionality.
Support multiple language options if needed.
Include feedback collection system.

Complete implementation with engaging UX and TypeScript.
```

---

### **PHASE 6: UNIVERSITY SETTINGS & ADMINISTRATION (Days 15-16)**

#### Task 6.1: University Settings Dashboard
```typescript
// TARGET FILE: /src/app/(dashboard)/university/settings/page.tsx (NEW FILE)
// PURPOSE: University configuration and administrative settings
```

**PROMPT FOR AI:**
```
Create /src/app/(dashboard)/university/settings/page.tsx for university administration:

1. University profile settings:
   - University name, logo, and branding
   - Contact information and website
   - Description and academic focus areas
   - Time zone and language preferences
   - Public profile visibility settings

2. Course management policies:
   - Course approval requirements and workflow
   - Content quality standards
   - Instructor permission levels
   - Student enrollment policies
   - Certificate issuance settings

3. User access management:
   - Default roles for new instructors
   - Student access permissions
   - Data privacy and GDPR settings
   - Communication preferences
   - Account verification requirements

4. Integration settings:
   - LMS integration configurations
   - SSO setup (if available)
   - External authentication providers
   - API access keys and webhooks
   - Third-party service connections

5. Notification management:
   - Email notification templates
   - Automated notification triggers
   - Escalation procedures
   - Communication frequency settings
   - Emergency notification system

6. Analytics and reporting:
   - Data retention policies
   - Report generation schedules
   - Performance metric configurations
   - Benchmarking participation
   - Data export permissions

7. Security settings:
   - Password policy enforcement
   - Two-factor authentication requirements
   - Session timeout configurations
   - IP access restrictions
   - Audit log retention

Only university administrators should access this page.
Include form validation and confirmation dialogs.
Add preview functionality for branding changes.
Support bulk settings updates.
Include settings export/import capability.

Complete implementation with proper security and TypeScript.
```

#### Task 6.2: University Permission Matrix
```typescript
// TARGET FILE: /src/components/university/PermissionMatrix.tsx (NEW FILE)
// PURPOSE: Visual permission management and role definition interface
```

**PROMPT FOR AI:**
```
Create /src/components/university/PermissionMatrix.tsx for role-based permission management:

1. Permission matrix display:
   - Grid layout with roles as columns and permissions as rows
   - Visual indicators (checkmarks, X, partial access)
   - Color coding for permission levels
   - Expandable permission groups
   - Hover tooltips for permission descriptions

2. Role definitions:
   - UNIVERSITY_ADMIN: Full university management access
   - UNIVERSITY_INSTRUCTOR: Course creation and student management
   - STUDENT: Course consumption and progress tracking
   - Custom roles (if supported)

3. Permission categories:
   - Course management (Create, Edit, Delete, Publish)
   - Student data access (View, Export, Analytics)
   - Instructor management (Invite, Remove, Edit permissions)
   - University settings (Branding, Policies, Integrations)
   - Analytics and reporting (Dashboard, Export, Share)

4. Interactive editing:
   - Toggle permissions for roles
   - Create custom permission sets
   - Copy permissions between roles
   - Bulk permission updates
   - Permission conflict detection

5. Advanced features:
   - Time-based permissions (temporary access)
   - IP-based restrictions
   - Course-specific permissions
   - Conditional access rules
   - Permission inheritance hierarchy

6. Validation and safety:
   - Prevent admin lockout scenarios
   - Require confirmation for major changes
   - Show impact analysis for permission changes
   - Provide permission templates
   - Include rollback functionality

Props interface:
- universityId: string
- currentUser: User
- onPermissionChange: (role: string, permission: string, granted: boolean) => void
- readOnly?: boolean

Include comprehensive permission descriptions.
Add search and filter capabilities.
Support permission comparison between roles.
Include audit trail for permission changes.

Complete implementation with accessibility and TypeScript.
```

---

### **PHASE 7: INTEGRATION & WORKFLOW OPTIMIZATION (Days 17-18)**

#### Task 7.1: University Navigation Enhancement
```typescript
// TARGET FILE: /src/components/navigation/UniversityNavigation.tsx (NEW FILE)
// PURPOSE: Enhanced navigation system for university management features
```

**PROMPT FOR AI:**
```
Create /src/components/navigation/UniversityNavigation.tsx for university-specific navigation:

1. Role-based navigation menu:
   - Different menu items for UNIVERSITY_ADMIN vs UNIVERSITY_INSTRUCTOR
   - Contextual menu based on current university
   - Badge indicators for pending actions (approvals, notifications)
   - Breadcrumb navigation for deep pages

2. University context switcher:
   - Dropdown for platform admins to switch between universities
   - Current university indicator with logo
   - Quick university statistics in switcher
   - Recent university access history

3. Quick action shortcuts:
   - Floating action button for common tasks
   - Keyboard shortcuts for power users
   - Quick course creation for instructors
   - Fast approval actions for admins

4. Notification integration:
   - Real-time notification badges
   - Notification dropdown with university-specific items
   - Mark as read functionality
   - Notification history and preferences

5. Search functionality:
   - University-scoped search (courses, instructors, students)
   - Global search with university filtering
   - Recent searches and suggestions
   - Advanced search filters

6. Mobile optimization:
   - Collapsible mobile menu
   - Touch-friendly navigation
   - Swipe gestures for common actions
   - Mobile-specific shortcuts

Integration requirements:
- Connect with existing navigation system
- Maintain backward compatibility
- Support role-based visibility
- Include proper TypeScript definitions
- Follow existing design patterns

Complete implementation with responsive design and accessibility.
```

#### Task 7.2: Real-time University Updates
```typescript
// TARGET FILE: /src/hooks/useUniversityRealtime.tsx (NEW FILE)
// PURPOSE: Real-time data synchronization for university management
```

**PROMPT FOR AI:**
```
Create /src/hooks/useUniversityRealtime.tsx for real-time university data:

1. Real-time approval queue updates:
   - Listen to courseApprovals collection changes
   - Update approval queue in real-time
   - Notify users of new submissions
   - Handle approval status changes

2. University dashboard metrics:
   - Real-time enrollment updates
   - Course completion notifications
   - Student activity indicators
   - Performance metric changes

3. Instructor activity tracking:
   - Course creation notifications
   - Instructor status changes
   - Student interaction updates
   - Content modification alerts

4. Multi-tab synchronization:
   - Sync data across multiple browser tabs
   - Prevent data conflicts
   - Show warnings for concurrent editing
   - Handle connection state changes

5. Notification system integration:
   - Real-time notification delivery
   - Badge count updates
   - Priority notification handling
   - Notification acknowledgment sync

6. Connection management:
   - Handle network disconnections
   - Retry failed updates
   - Queue offline changes
   - Sync when connection restored

Hook interface:
```typescript
interface UseUniversityRealtimeOptions {
  universityId: string
  enableApprovals?: boolean
  enableMetrics?: boolean
  enableNotifications?: boolean
}

interface UniversityRealtimeData {
  approvals: CourseApproval[]
  metrics: UniversityDashboard
  notifications: Notification[]
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  lastUpdated: Date
}
```

Use Firebase real-time listeners efficiently.
Implement proper cleanup on unmount.
Handle permission changes dynamically.
Add error handling and retry logic.
Include debugging capabilities.

Complete implementation with TypeScript and performance optimization.
```

#### Task 7.3: University Data Export System
```typescript
// TARGET FILE: /src/components/university/DataExportSystem.tsx (NEW FILE)
// PURPOSE: Comprehensive data export and reporting system for universities
```

**PROMPT FOR AI:**
```
Create /src/components/university/DataExportSystem.tsx for data export functionality:

1. Export configuration interface:
   - Select data types (Courses, Students, Instructors, Analytics)
   - Choose date ranges and filters
   - Select export formats (CSV, Excel, PDF, JSON)
   - Privacy options (anonymized vs detailed)
   - Custom field selection

2. Report templates:
   - Predefined report templates for common needs
   - Custom report builder with drag-drop fields
   - Template sharing between universities
   - Template versioning and history
   - Template permission management

3. Scheduled exports:
   - Set up recurring exports (daily, weekly, monthly)
   - Email delivery configuration
   - Cloud storage integration
   - Export retention policies
   - Automated report generation

4. Data processing pipeline:
   - Large dataset handling with pagination
   - Background processing for big exports
   - Progress tracking with cancellation
   - Export queue management
   - Failed export retry mechanism

5. Privacy and compliance:
   - GDPR compliance features
   - Data anonymization options
   - Consent tracking for student data
   - Audit trail for all exports
   - Access control and permissions

6. Export history and management:
   - List of previous exports with status
   - Download links for completed exports
   - Export sharing capabilities
   - Export analytics and usage tracking
   - Storage usage monitoring

Props interface:
```typescript
interface DataExportSystemProps {
  universityId: string
  allowedDataTypes: ('courses' | 'students' | 'instructors' | 'analytics')[]
  maxExportSize?: number
  onExportComplete?: (exportId: string) => void
}
```

Include progress indicators and status updates.
Add export preview functionality.
Support bulk operations and filtering.
Implement proper error handling.
Add export validation and verification.

Complete implementation with TypeScript and security considerations.
```

---

## 🔧 TECHNICAL IMPLEMENTATION STANDARDS

### **Code Quality Requirements:**
```typescript
// ALWAYS follow these patterns for university management:

// 1. University-scoped queries MUST include universityId filter
const getUniversityCourses = async (universityId: string) => {
  return firestore
    .collection('courses')
    .where('university.id', '==', universityId)
    .get();
}

// 2. Permission checks MUST verify university association  
const checkUniversityAccess = async (userId: string, universityId: string) => {
  const user = await getUser(userId);
  return user.university?.id === universityId;
}

// 3. Role validation for university management
const isUniversityAdmin = (user: User): boolean => {
  return user.role === 'UNIVERSITY_ADMIN';
}

// 4. Error handling with university context
try {
  // University operation
} catch (error) {
  console.error(`University ${universityId} operation failed:`, error);
  throw new Error(`University operation failed: ${error.message}`);
}

// 5. All university functions must include audit logging
const logUniversityAction = async (action: string, universityId: string, userId: string) => {
  await firestore.collection('auditLogs').add({
    action,
    universityId, 
    userId,
    timestamp: new Date(),
    type: 'UNIVERSITY_MANAGEMENT'
  });
}
```

### **Database Security Rules:**
```javascript
// Firestore security rules for university management
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // University-scoped course access
    match /courses/{courseId} {
      allow read: if resource.data.approvalStatus == 'PUBLISHED' 
                  || (request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.university.id == resource.data.university.id);
    }
    
    // Course approval access
    match /courseApprovals/{approvalId} {
      allow read, write: if request.auth != null && 
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.university.id == resource.data.universityId &&
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'UNIVERSITY_ADMIN';
    }
  }
}
```

### **Testing Requirements:**
```typescript
// Each university management feature must include tests for:
describe('University Management', () => {
  test('data isolation between universities', () => {
    // Test that University A cannot access University B data
  });
  
  test('role-based permission enforcement', () => {
    // Test that university instructors cannot access admin functions
  });
  
  test('course approval workflow', () => {
    // Test complete approval workflow from submission to publication
  });
  
  test('university analytics accuracy', () => {
    // Test that analytics calculations are correct and university-scoped
  });
});
```

---

## 🎯 VALIDATION CHECKLIST

### **Phase Completion Criteria:**

**Phase 1 (Database Foundation):**
- [ ] Type definitions include all university management types
- [ ] Auth store supports university roles and context
- [ ] Database indexes created for university queries
- [ ] No breaking changes to existing user system

**Phase 2 (Backend Core):**
- [ ] University management functions work correctly
- [ ] Course approval workflow functions as specified
- [ ] Existing course actions support university instructors
- [ ] University analytics return accurate data

**Phase 3 (Frontend Infrastructure):**
- [ ] University context provider manages state correctly
- [ ] University dashboard layout is responsive and accessible
- [ ] Main dashboard displays accurate university metrics
- [ ] Course approval queue interface is functional

**Phase 4 (Analytics Dashboard):**
- [ ] Analytics components render data correctly
- [ ] University analytics page shows comprehensive insights
- [ ] Individual course analytics provide actionable data
- [ ] All charts and tables handle empty states properly

**Phase 5 (Instructor Management):**
- [ ] Instructor management interface supports all required operations
- [ ] Instructor assignment workflow works end-to-end
- [ ] Onboarding system provides comprehensive orientation
- [ ] All instructor operations maintain data integrity

**Phase 6 (Settings & Administration):**
- [ ] University settings page allows full configuration
- [ ] Permission matrix correctly manages role permissions
- [ ] Settings changes apply immediately across system
- [ ] Security settings are properly enforced

**Phase 7 (Integration & Optimization):**
- [ ] Navigation system integrates seamlessly
- [ ] Real-time updates work across all university features
- [ ] Data export system handles large datasets
- [ ] All integrations maintain performance standards

### **Security Validation:**
- [ ] University data isolation is complete (no cross-university access)
- [ ] Role-based permissions are properly enforced
- [ ] API endpoints validate university association
- [ ] Firestore security rules prevent unauthorized access
- [ ] Audit logging captures all administrative actions

### **Performance Validation:**
- [ ] University queries use proper indexes
- [ ] Large datasets are paginated correctly
- [ ] Real-time updates don't impact performance
- [ ] Analytics calculations complete in reasonable time
- [ ] Export operations handle large datasets without timeouts

---

## 📦 REQUIRED DEPENDENCIES

```bash
# Add these to package.json:
npm install @react-hook/window-size        # For responsive layouts
npm install react-intersection-observer    # For infinite scrolling
npm install react-window                   # For large list virtualization  
npm install date-fns                       # For date manipulation in analytics
npm install papaparse                      # For CSV export functionality
npm install @types/papaparse               # TypeScript types for papaparse
npm install xlsx                           # For Excel export functionality
npm install jspdf                          # For PDF export functionality
npm install html2canvas                    # For chart to image conversion

# Firebase Functions dependencies (add to functions/package.json):
npm install --prefix functions node-cron  # For scheduled reports
npm install --prefix functions csv-writer # For server-side CSV generation
```

---

## 🚀 DEPLOYMENT SEQUENCE

### **Development Environment Setup:**
```bash
# 1. Update Firestore indexes
firebase deploy --only firestore:indexes

# 2. Deploy Cloud Functions
firebase deploy --only functions

# 3. Deploy frontend with university features
npm run build && firebase deploy --only hosting
```

### **Production Deployment:**
1. **Database Migration**: Deploy indexes and security rules first
2. **Backend Functions**: Deploy all university management functions
3. **Frontend Features**: Deploy university management UI
4. **Integration Testing**: Verify all university workflows
5. **User Training**: Provide documentation and training materials

---

*This comprehensive development plan provides complete implementation specifications for the University Management Layer. Each task includes specific prompts that any AI developer can execute without additional clarification, resulting in a production-ready university management system.*