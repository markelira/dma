# University Management Layer - Complete Architecture Analysis
*Based on current DMA codebase analysis*

---

## 🎯 CURRENT STATE ANALYSIS

### **Existing Role System (authStore.ts)**
```typescript
// CURRENT: Simple 3-role system
role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

// NEEDED: Extended university-aware roles
role: 'STUDENT' | 'INSTRUCTOR' | 'UNIVERSITY_INSTRUCTOR' | 'UNIVERSITY_ADMIN' | 'PLATFORM_ADMIN'
```

### **Current Course Creation Flow (courseActions.ts)**
```typescript
// CURRENT: Admin-only course creation (lines 85-125)
if (userData?.role !== 'ADMIN') {
  throw new Error('Nincs jogosultság kurzus létrehozásához.');
}

// NEEDED: University instructor course creation + approval workflow
```

### **Existing Database Collections**
✅ **Already Implemented:**
- `users` - User profiles with role system
- `courses` - Course data (has university field but not used)
- `enrollments` - User course enrollments 
- `categories` - Course categories
- `universities` - University entities (complete CRUD exists!)

❌ **Missing for University Management:**
- Course approval workflow fields
- University-instructor relationships
- University analytics aggregations

---

## 🏗️ REQUIRED ARCHITECTURE CHANGES

### **1. Database Schema Extensions**

#### **Users Collection (Extend Existing)**
```typescript
// ADD TO: /src/types/index.ts
interface User {
  // ... existing fields
  university?: {
    id: string
    name: string
    role: 'INSTRUCTOR' | 'ADMIN'
    joinedAt: string
  }
}
```

#### **Courses Collection (Extend Existing)**
```typescript
// ADD TO: /src/types/index.ts  
interface Course {
  // ... existing fields
  approvalStatus: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  approvedBy?: string // University Admin user ID
  approvedAt?: Timestamp
  rejectionReason?: string
  submittedForApprovalAt?: Timestamp
}
```

#### **NEW: Course Approvals Collection**
```typescript
interface CourseApproval {
  id: string
  courseId: string
  instructorId: string
  universityId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: Timestamp
  reviewedAt?: Timestamp
  reviewedBy?: string // University Admin ID
  rejectionReason?: string
  courseSnapshot: Course // Snapshot at submission time
}
```

---

### **2. Backend Cloud Functions (New + Modifications)**

#### **MODIFY: courseActions.ts**
```typescript
// UPDATE createCourse function to handle university instructors
export const createCourse = onCall(async (request) => {
  // Allow UNIVERSITY_INSTRUCTOR role
  if (!['ADMIN', 'UNIVERSITY_INSTRUCTOR'].includes(userData?.role)) {
    throw new Error('Nincs jogosultság kurzus létrehozásához.');
  }
  
  // Set initial status based on role
  const initialStatus = userData?.role === 'UNIVERSITY_INSTRUCTOR' 
    ? 'PENDING_APPROVAL' 
    : 'PUBLISHED';
    
  // Course creation logic...
});
```

#### **NEW: universityManagementActions.ts**
```typescript
// IMPLEMENTATION TARGET: /functions/src/universityManagementActions.ts

// 1. Course Approval Functions
export const submitCourseForApproval = onCall(...)
export const approveCourse = onCall(...)  
export const rejectCourse = onCall(...)
export const getCourseApprovalQueue = onCall(...)

// 2. University Analytics Functions
export const getUniversityDashboard = onCall(...)
export const getUniversityAnalytics = onCall(...)
export const getUniversityCourses = onCall(...)
export const getUniversityStudents = onCall(...)

// 3. Instructor Management
export const getUniversityInstructors = onCall(...)
export const assignInstructorToUniversity = onCall(...)
export const removeInstructorFromUniversity = onCall(...)
```

#### **UPDATE: userActions.ts**
```typescript
// ADD role management for university roles
export const updateUserRole = onCall(async (request) => {
  const { userId, role, universityId } = z.object({
    userId: z.string().min(1),
    role: z.enum(['STUDENT', 'INSTRUCTOR', 'UNIVERSITY_INSTRUCTOR', 'UNIVERSITY_ADMIN', 'PLATFORM_ADMIN']),
    universityId: z.string().optional() // Required for university roles
  }).parse(request.data);
  
  // Logic to handle university role assignments
});
```

---

### **3. Frontend Architecture Changes**

#### **EXTEND: authStore.ts**
```typescript
// UPDATE User interface
export interface User {
  // ... existing fields
  role: 'STUDENT' | 'INSTRUCTOR' | 'UNIVERSITY_INSTRUCTOR' | 'UNIVERSITY_ADMIN' | 'PLATFORM_ADMIN'
  university?: {
    id: string
    name: string
    role: 'INSTRUCTOR' | 'ADMIN'
    joinedAt: string
  }
}
```

#### **NEW: Dashboard Routing**
```typescript
// ADD TO: /src/app/(dashboard)/
/dashboard/university/                 // University Admin Dashboard
/dashboard/university/courses          // Course Management
/dashboard/university/approvals        // Course Approval Queue
/dashboard/university/analytics        // University Analytics  
/dashboard/university/instructors      // Instructor Management
/dashboard/university/students         // Student Analytics
```

#### **NEW: Course Approval Components**
```typescript
// CREATE: /src/components/university/
CourseApprovalQueue.tsx               // Pending approvals list
CourseApprovalDetails.tsx             // Individual course review
UniversityDashboard.tsx               // University admin dashboard
UniversityAnalytics.tsx               // University analytics
InstructorManagement.tsx              // Instructor assignment
StudentAnalytics.tsx                  // University student insights
```

---

### **4. Permission System Architecture**

#### **Role-Based Route Protection**
```typescript
// CREATE: /src/middleware/universityAuth.ts
export const withUniversityAuth = (allowedRoles: UserRole[]) => {
  return (handler: NextApiHandler) => async (req, res) => {
    // Check user authentication
    // Verify role is in allowedRoles
    // For university roles, verify university association
    // Call handler if authorized
  }
}

// USAGE:
// University admin only: withUniversityAuth(['UNIVERSITY_ADMIN'])
// University roles: withUniversityAuth(['UNIVERSITY_ADMIN', 'UNIVERSITY_INSTRUCTOR'])
```

#### **Data Access Control**
```typescript
// Universities can only access their own data
const getUserUniversityId = async (userId: string): Promise<string | null> => {
  const userDoc = await firestore.collection('users').doc(userId).get();
  return userDoc.data()?.university?.id || null;
}

// All university-scoped queries must filter by universityId
const getUniversityCourses = async (userId: string) => {
  const universityId = await getUserUniversityId(userId);
  if (!universityId) throw new Error('No university association');
  
  return firestore
    .collection('courses')
    .where('university.id', '==', universityId)
    .get();
}
```

---

### **5. University Dashboard Data Architecture**

#### **Core Metrics Pipeline**
```typescript
// UNIVERSITY-SCOPED AGGREGATIONS
interface UniversityDashboard {
  // Course Statistics
  totalCourses: number
  pendingApprovals: number
  publishedCourses: number
  averageCourseRating: number
  
  // Student Metrics
  totalEnrolledStudents: number
  activeStudents: number // last 30 days
  totalCompletedCourses: number
  averageCompletionRate: number
  
  // Instructor Performance
  totalInstructors: number
  topPerformingInstructors: Array<{
    id: string
    name: string
    courseCount: number
    avgRating: number
    studentCount: number
  }>
  
  // Learning Analytics
  totalLearningHours: number
  quizSuccessRate: number
  certificatesIssued: number
  
  // Trends (last 12 months)
  monthlyEnrollments: Array<{ month: string, count: number }>
  monthlyCompletions: Array<{ month: string, count: number }>
  coursePopularity: Array<{ courseId: string, title: string, enrollments: number }>
}
```

---

### **6. Course Approval Workflow**

#### **State Machine**
```typescript
// COURSE STATUS FLOW
DRAFT (instructor editing)
  ↓ instructor submits
PENDING_APPROVAL (awaiting university admin)
  ↓ admin approves          ↓ admin rejects
APPROVED (public)          REJECTED (back to instructor)
  ↓ admin can unpublish      ↓ instructor fixes & resubmits
PUBLISHED                  PENDING_APPROVAL
```

#### **Approval Process Components**
```typescript
// Course submission (instructor)
const submitForApproval = async (courseId: string) => {
  // Validate course completeness
  // Create approval record
  // Notify university admins
  // Update course status
}

// Course review (university admin)
const reviewCourse = async (approvalId: string, decision: 'APPROVE' | 'REJECT', reason?: string) => {
  // Update approval record
  // Update course status
  // Notify instructor
  // If approved, make course publicly visible
}
```

---

## 🚧 IMPLEMENTATION ROADMAP

### **Phase 1: Backend Foundation (Week 1)**
1. **Extend Database Schemas**
   - Add university fields to User type
   - Add approval fields to Course type  
   - Create CourseApproval collection

2. **Update Existing Functions**
   - Modify createCourse for university instructors
   - Update role validation in userActions
   - Add university filtering to getCourses

3. **New Backend Functions**
   - Course approval workflow functions
   - Basic university analytics queries
   - University-scoped data access functions

### **Phase 2: Frontend Infrastructure (Week 2)**
1. **Authentication Updates**
   - Extend authStore for university roles
   - Update role-based navigation
   - Add university context management

2. **New Dashboard Routes**
   - University admin dashboard structure
   - Course approval interface routes
   - University analytics pages

3. **Basic Components**
   - University dashboard layout
   - Course approval queue component
   - Basic university analytics displays

### **Phase 3: Advanced Features (Week 3)**  
1. **Course Approval Workflow**
   - Complete approval queue interface
   - Course review/approval components
   - Instructor notification system

2. **University Analytics**
   - Advanced dashboard metrics
   - Student performance analytics
   - Instructor performance tracking

3. **Instructor Management**
   - Add/remove university instructors
   - Instructor permission management
   - University-instructor assignments

### **Phase 4: Polish & Integration (Week 4)**
1. **User Experience**
   - Seamless role switching
   - Comprehensive notification system  
   - Mobile-responsive university dashboards

2. **Data Security**
   - University data isolation validation
   - Permission boundary testing
   - Security audit of university access

3. **Documentation & Training**
   - University admin user guides
   - Instructor workflow documentation
   - API documentation for university endpoints

---

## ⚡ CRITICAL IMPLEMENTATION DECISIONS

### **1. Multi-Tenancy Approach**
- **Data Isolation**: University queries filtered by universityId
- **Permission Boundaries**: Strict role-based access control
- **Analytics Separation**: University-scoped aggregations only

### **2. Course Approval Granularity** 
- **Every Course**: Manual approval required for each course
- **Approval History**: Complete audit trail of all approvals/rejections
- **Rollback Capability**: University admins can unpublish approved courses

### **3. Analytics Access Level**
- **Individual Data**: University admins can see individual student performance on their courses
- **Aggregated Views**: Both individual and aggregated analytics available  
- **GDPR Compliance**: Pseudonymized data options, student consent tracking

### **4. University Assignment**
- **Instructor Assignment**: Platform admin assigns instructors to universities
- **One University**: Instructors belong to one university at a time
- **Role Migration**: Support for moving instructors between universities

---

## 🎯 VALIDATION CHECKLIST

**After implementation, verify:**

✅ **Data Isolation**
- University A admin cannot see University B data
- Instructors only see their own university's courses
- Students access courses regardless of university

✅ **Approval Workflow**  
- University instructors can create courses but not publish
- University admins receive approval notifications
- Approved courses appear in public course browsing
- Rejected courses return to instructor with feedback

✅ **Analytics Accuracy**
- University dashboards show only university-scoped data
- Student enrollment counts match university course enrollments  
- Instructor performance metrics calculate correctly

✅ **Permission Security**
- API endpoints enforce university boundaries
- Frontend components respect role permissions
- Unauthorized access attempts are blocked and logged

✅ **User Experience**
- University role transitions are smooth
- Dashboard navigation is intuitive
- Approval workflows are clear and efficient

---

*This architecture analysis provides a complete blueprint for implementing the University Management Layer while preserving all existing functionality and maintaining the B2B + B2C hybrid business model.*