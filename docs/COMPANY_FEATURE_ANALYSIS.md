# Company (B2B) Feature - Comprehensive Technical Analysis

**Date**: 2025-11-24
**Status**: Analysis Complete
**Overall Completion**: ~70%

---

## Executive Summary

| Aspect | Status | Completion |
|--------|--------|------------|
| **Backend (Cloud Functions)** | Fully Implemented | ~95% |
| **Frontend (UI)** | Partially Complete | ~25% |
| **Data Model** | Complete | 100% |
| **Email System** | Mostly Working | ~75% |
| **Stripe Integration** | Not Implemented | 0% |
| **Overall Feature** | **Functional MVP** | ~70% |

### Feature Description
The Company (B2B) feature allows businesses to:
- Create company accounts with a 14-day trial
- Invite and manage employees
- Enroll all employees in courses/masterclasses
- Track employee learning progress
- Generate progress reports (CSV)

---

## 1. Data Model

### Firestore Collections Structure

```
companies/{companyId}
├── name: string
├── slug: string (URL-friendly)
├── billingEmail: string
├── industry: string (optional)
├── companySize: string (optional)
├── plan: 'trial' (only trial in MVP)
├── status: 'active' | 'suspended'
├── trialEndsAt: Timestamp (14 days from creation)
├── stripeCustomerId: string (post-MVP)
├── createdAt: Timestamp
├── createdBy: userId
├── updatedAt: Timestamp
├── purchasedMasterclasses: string[]
│
├── /admins/{userId}
│   ├── userId, companyId, email, name
│   ├── role: 'owner' | 'admin'
│   ├── permissions: CompanyAdminPermissions
│   ├── status: 'active' | 'invited'
│   └── inviteToken, inviteExpiresAt (for pending)
│
├── /employees/{employeeId}
│   ├── companyId, userId, firstName, lastName, email
│   ├── status: 'invited' | 'active' | 'left'
│   ├── inviteToken (32-byte hex), inviteExpiresAt (7 days)
│   ├── enrolledMasterclasses: EnrollmentRecord[]
│   └── invitedBy, invitedAt, inviteAcceptedAt
│
├── /masterclasses/{companyMasterclassId}
│   ├── companyId, masterclassId, title, duration
│   ├── seats: { purchased, used, available }
│   ├── pricePerSeat, totalPaid, paymentStatus
│   └── startDate, endDate, status
│
├── /enrolledCourses/{courseId}
│   ├── courseId, courseTitle, enrolledAt
│   ├── enrolledBy, employeeCount
│
└── /purchases/{purchaseId}
    ├── masterclassId, masterclassTitle
    ├── purchasedBy, purchasedAt, price
    └── employeesEnrolled

userProgress/{userId}_{masterclassId}
├── userId, masterclassId, companyId
├── currentModule, completedModules/completedLessons
├── overallProgress (0-100), status
├── lastAccessedAt, totalTimeSpent
└── enrolledAt, completedAt, certificateIssued
```

---

## 2. Cloud Functions

### Location: `/functions/src/company/`

| Function | Status | Purpose |
|----------|--------|---------|
| `createCompany` | ✅ Complete | Create company + owner admin |
| `addEmployee` | ✅ Complete | Send employee invitation |
| `verifyEmployeeInvite` | ✅ Complete | Verify invite token |
| `acceptEmployeeInvite` | ✅ Complete | Employee accepts (transaction) |
| `enrollCompanyInCourse` | ✅ Complete | Bulk enroll employees in course |
| `getCompanyEnrolledCourses` | ✅ Complete | Get enrolled courses list |
| `enrollEmployeesInMasterclass` | ✅ Complete | Bulk enroll in masterclass (transaction) |
| `createCompanyMasterclass` | ⚠️ MVP | Manual masterclass add (no Stripe) |
| `assignEmployeeToMasterclass` | ✅ Complete | Single employee assignment |
| `unassignEmployeeFromMasterclass` | ✅ Complete | Remove from masterclass |
| `getCompanyMasterclasses` | ✅ Complete | List purchased masterclasses |
| `purchaseCompanyMasterclass` | ✅ Complete | Purchase + auto-enroll |
| `getCompanyPurchases` | ✅ Complete | Purchase history |
| `getCompanyDashboard` | ✅ Complete | Analytics dashboard data |
| `getEmployeeProgressDetail` | ✅ Complete | Individual progress |
| `generateCSVReport` | ✅ Complete | Export progress CSV |
| `sendEmployeeReminder` | ✅ Complete | Manual reminder email |
| `completeCompanyOnboarding` | ✅ Complete | Full setup flow |

### Key Function Details

**acceptEmployeeInvite** (Uses Transaction)
- Prevents double-use of invite token
- Sets custom claims: `role: 'COMPANY_EMPLOYEE'`, `companyId`
- Auto-enrolls in company's purchased masterclasses

**enrollCompanyInCourse**
- Enrolls ALL active employees in a course
- Creates enrollment records for each
- Tracks in `enrolledCourses` subcollection

**getCompanyDashboard**
- Aggregates employee progress
- Calculates at-risk status (no activity > 7 days)
- Returns sorted list + stats

---

## 3. Frontend Implementation

### Routes & Status

| Route | Status | Description |
|-------|--------|-------------|
| `/company/dashboard` | ✅ 90% | Main dashboard with stats, courses |
| `/company/dashboard/employees` | ❌ Empty | Employee list/management |
| `/company/dashboard/masterclasses` | ❌ Empty | Masterclass management |
| `/company/dashboard/progress` | ❌ Empty | Progress tracking UI |
| `/company/invite/[token]` | ✅ Complete | Invite acceptance page |

### Implemented Hooks

```typescript
// /src/hooks/useCompanyActions.ts
useEnrollCompanyInCourse()     // ✅ Enroll employees in course
useCompanyEnrolledCourses()    // ✅ Get enrolled courses
```

### Missing Hooks (Need Implementation)

- `useGetCompanyDashboard()`
- `useAddEmployee()`
- `useGetCompanyEmployees()`
- `useAssignMasterclass()`
- `usePurchaseMasterclass()`
- `useGenerateCSVReport()`
- `useSendReminder()`
- `useGetCompanyMasterclasses()`

---

## 4. Integration Status

### Email Integration

| Function | Email Type | Status |
|----------|-----------|--------|
| createCompany | Welcome email | ✅ Sent |
| addEmployee | Invitation | ✅ Sent |
| sendEmployeeReminder | Learning reminder | ✅ Sent |
| completeOnboarding | Employee invites | ❌ TODO |

### Stripe Integration

**Status: ❌ Not Implemented**

Missing:
- Stripe customer creation on company signup
- Checkout session for seat purchases
- Payment webhook handling
- Seat count updates on payment

---

## 5. Critical Gaps & Bugs

### P0 - Blocking

| Issue | Location | Impact |
|-------|----------|--------|
| Employee page empty | `/company/dashboard/employees` | Can't manage employees |
| Progress page empty | `/company/dashboard/progress` | Can't view reports |
| Masterclass page empty | `/company/dashboard/masterclasses` | Can't manage masterclasses |
| Missing invite email in onboarding | `completeOnboarding.ts:243` | Employees not notified |

### P1 - Important

| Issue | Location | Impact |
|-------|----------|--------|
| No Stripe integration | All payment flows | Can't sell subscriptions |
| Trial expiry not handled | No suspension logic | Free forever after trial |
| No billing portal | Missing entirely | No payment management |
| Missing hooks | `useCompanyActions.ts` | Frontend can't call functions |

### P2 - Nice to Have

| Issue | Location | Impact |
|-------|----------|--------|
| No rate limiting | Email functions | Potential abuse |
| Non-blocking emails | Multiple functions | Silent failures |
| No audit logging | All functions | No activity trail |

---

## 6. Permission Model

```typescript
const OWNER_PERMISSIONS = {
  canManageEmployees: true,
  canViewReports: true,
  canManageBilling: true,
  canManageMasterclasses: true,
};

const ADMIN_PERMISSIONS = {
  canManageEmployees: true,
  canViewReports: true,
  canManageBilling: false,
  canManageMasterclasses: true,
};
```

---

## 7. User Flows

### Company Creation
```
User → createCompany() → Generate Slug → Create Company Doc
                           ↓
                      Create Owner Admin (with OWNER_PERMISSIONS)
                           ↓
                      Send Welcome Email
                           ↓
                      Return companyId
```

### Employee Invitation
```
Admin → addEmployee() → Generate 32-byte Token → Create Employee Doc
              ↓
        Send Invite Email (7-day expiry)
              ↓
        Employee clicks link → /company/invite/[token]
              ↓
        verifyEmployeeInvite() → Show company/role info
              ↓
        User logs in (or registers)
              ↓
        acceptEmployeeInvite() [TRANSACTION]
        ├── Update employee status → 'active'
        ├── Set custom claims (role, companyId)
        ├── Auto-enroll in purchased masterclasses
        └── Create progress records
```

### Course Enrollment
```
Admin → /company/dashboard → Click "Kurzus hozzáadása"
              ↓
        Select course from modal
              ↓
        enrollCompanyInCourse() [Cloud Function]
        ├── Get all active employees
        ├── Create enrollments/{userId}_{courseId} for each
        ├── Track in companies/{id}/enrolledCourses/{courseId}
        └── Return enrolled count
```

---

## 8. Implementation Roadmap

### Phase 1: Complete UI (Priority)

1. **Employee Management Page** (`/company/dashboard/employees`)
   - List all employees (invited, active, left)
   - Add employee form
   - Resend invite / remove employee buttons
   - Status badges

2. **Progress Tracking Page** (`/company/dashboard/progress`)
   - Employee progress table
   - Filter by status (at-risk, active, completed)
   - CSV export button
   - Send reminder button

3. **Masterclass Management Page** (`/company/dashboard/masterclasses`)
   - List purchased masterclasses
   - Seat usage display
   - Assign/unassign employees

### Phase 2: Complete Hooks

Add to `/src/hooks/useCompanyActions.ts`:
```typescript
useAddEmployee()
useGetCompanyEmployees()
useRemoveEmployee()
useResendInvite()
useSendReminder()
useGenerateCSVReport()
usePurchaseMasterclass()
useAssignMasterclass()
useUnassignMasterclass()
```

### Phase 3: Fix Email Sending

- Add email sending to `completeOnboarding`
- Add enrollment confirmation emails
- Consider retry logic for failed sends

### Phase 4: Stripe Integration (Post-MVP)

1. Create Stripe customer on company creation
2. Implement checkout session endpoint
3. Handle payment webhooks
4. Update seat counts on successful payment

---

## 9. File Reference

### Cloud Functions
```
/functions/src/company/
├── createCompany.ts          (360 lines)
├── employeeInvite.ts         (580 lines)
├── enrollCompanyInCourse.ts  (295 lines)
├── masterclassEnrollment.ts  (325 lines)
├── purchaseMasterclass.ts    (253 lines)
├── progressTracking.ts       (386 lines)
├── createMasterclass.ts      (131 lines)
├── generateCSVReport.ts      (294 lines)
├── completeOnboarding.ts     (270 lines)
├── enrollEmployees.ts        (218 lines)
└── sendReminder.ts           (287 lines)
```

### Frontend
```
/src/app/(company)/
├── layout.tsx                         (54 lines)
└── company/
    ├── dashboard/
    │   ├── page.tsx                   (703 lines) ✅
    │   ├── employees/page.tsx         (empty) ❌
    │   ├── masterclasses/page.tsx     (empty) ❌
    │   └── progress/page.tsx          (empty) ❌
    └── invite/[token]/page.tsx        (294 lines) ✅

/src/hooks/useCompanyActions.ts        (93 lines)
/src/types/company.ts                  (126 lines)
```

---

## 10. Success Criteria for MVP Completion

- [ ] Company admin can see list of employees
- [ ] Company admin can add new employees (with email sent)
- [ ] Company admin can remove/resend invite for employees
- [ ] Company admin can view employee progress
- [ ] Company admin can export progress as CSV
- [ ] Company admin can send reminder to at-risk employees
- [ ] Company admin can enroll team in courses
- [ ] Employees receive invite emails and can accept
- [ ] Employees see enrolled courses on their dashboard

---

**Document Version:** 1.0
**Last Updated:** 2025-11-24
**Author:** Claude Code Analysis
