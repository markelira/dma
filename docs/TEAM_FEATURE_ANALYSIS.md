# Team Feature (B2C) - Comprehensive Technical Analysis

**Date**: 2025-11-24
**Status**: Analysis Complete
**Confidence Level**: 95%

---

## Executive Summary

| Aspect | Status | Completion |
|--------|--------|------------|
| **Backend (Cloud Functions)** | Fully Implemented | ~95% |
| **Frontend (UI)** | Almost Non-Existent | ~5% |
| **Data Model** | Complete | 100% |
| **Stripe Integration** | Working | 100% |
| **Email System** | Working | ~85% |
| **Overall Feature** | **NOT FUNCTIONAL** | ~40% |

**Bottom Line:** The backend is production-ready, but users cannot use the feature because there's almost no frontend UI.

### Feature Description
The Team feature is a B2C subscription sharing model where:
- **Team owners** subscribe to a plan and become team owners
- **Team owners** can invite unlimited members via email (should be limited to 10)
- **Team members** automatically inherit the owner's subscription access
- **All members** get access to ALL platform courses (full access)
- Subscription status cascades to all team members automatically

---

## 1. Technical Architecture

### 1.1 Data Model

```
Firestore Collections:
────────────────────────────────────────────────────────────

teams/{teamId}
├── name: string                    // "{Owner Name} csapata"
├── ownerId: string                 // Firebase UID
├── ownerEmail: string              // Denormalized
├── ownerName: string               // Denormalized
├── subscriptionStatus: 'active'|'trialing'|'past_due'|'canceled'|'none'
├── subscriptionPlan: 'monthly'|'6-month'|'12-month'
├── subscriptionStartDate: Timestamp
├── subscriptionEndDate: Timestamp
├── trialEndDate?: Timestamp
├── stripeSubscriptionId: string
├── stripeCustomerId: string
├── stripePriceId: string
├── memberCount: number
├── createdAt: Timestamp
└── updatedAt: Timestamp

teams/{teamId}/members/{memberId}
├── id: string
├── teamId: string
├── email: string (lowercase)
├── userId?: string               // Set on accept
├── name?: string                 // Set on accept
├── status: 'invited'|'active'|'removed'
├── inviteToken?: string          // Deleted on accept
├── inviteExpiresAt?: Timestamp   // Deleted on accept
├── invitedAt: Timestamp
├── invitedBy: string
├── joinedAt?: Timestamp
├── removedAt?: Timestamp
└── hasSubscriptionAccess: boolean

users/{userId}  (team-related fields)
├── teamId?: string
├── isTeamOwner?: boolean
├── subscriptionStatus: 'active'|'trialing'|'past_due'|'canceled'|'none'
├── stripeCustomerId?: string
└── stripeSubscriptionId?: string

────────────────────────────────────────────────────────────
```

### 1.2 Auth Store (Current State)

**File:** `src/stores/authStore.ts`

```typescript
interface User {
  id: string
  uid: string
  firstName: string
  lastName: string
  email: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'COMPANY_ADMIN' | 'COMPANY_EMPLOYEE' | 'UNIVERSITY_ADMIN'
  profilePictureUrl?: string
  subscriptionActive?: boolean
  companyId?: string          // EXISTS for company model
  companyRole?: string        // EXISTS for company model
  // MISSING: teamId
  // MISSING: isTeamOwner
}
```

**GAP:** The auth store does not expose `teamId` or `isTeamOwner` fields, which breaks subscription checks for team members.

---

## 2. Cloud Functions Analysis

### 2.1 Functions Exported (9 total)

**File:** `functions/src/index.ts` (lines 1893-1904)

| Function | File | Type | Status | Issues |
|----------|------|------|--------|--------|
| `inviteTeamMember` | inviteTeamMember.ts | Callable | Working | Weak token generation |
| `acceptTeamInvite` | acceptTeamInvite.ts | Callable | Working | No transaction |
| `declineTeamInvite` | acceptTeamInvite.ts | Callable | Working | None |
| `leaveTeam` | acceptTeamInvite.ts | Callable | Working | No transaction |
| `removeTeamMember` | removeTeamMember.ts | Callable | Working | No removal notification |
| `resendTeamInvite` | removeTeamMember.ts | Callable | **INCOMPLETE** | **Email not sent (TODO)** |
| `getTeamDashboard` | getTeamDashboard.ts | Callable | Working | Info disclosure to non-owners |
| `checkSubscriptionAccess` | getTeamDashboard.ts | Callable | Partial | Doesn't check member record |
| `getTeamMembers` | getTeamDashboard.ts | Callable | Working | None |

### 2.2 Internal Functions (not callable)

| Function | Purpose | Called By |
|----------|---------|-----------|
| `createTeam()` | Create team on subscription | Stripe webhook |
| `updateTeamSubscription()` | Sync status changes | Stripe webhook |
| `updateTeamMembersAccess()` | Cascade access to members | updateTeamSubscription |

### 2.3 Function Details

#### inviteTeamMember
- **Input:** `{ teamId: string, email: string }`
- **Auth:** Required, team owner only
- **Operations:**
  1. Validates email format
  2. Checks team exists and user is owner
  3. Verifies subscription is active
  4. Checks for duplicate invites
  5. Creates member doc with invite token (7-day expiry)
  6. Increments team.memberCount
  7. Sends email via Brevo/Gmail

#### acceptTeamInvite
- **Input:** `{ inviteToken: string }`
- **Auth:** Required
- **Operations:**
  1. Finds invite by token (collectionGroup query)
  2. Validates not expired
  3. Checks team subscription active
  4. Verifies user not in another team
  5. Updates member: status='active', userId, joinedAt
  6. Updates user: teamId, subscriptionStatus
  7. Deletes invite token fields

#### getTeamDashboard
- **Input:** None (uses authenticated user's teamId)
- **Auth:** Required, must be on a team
- **Returns:**
  ```typescript
  {
    team: Team,
    members: TeamMember[],
    owner: { id, name, email },
    stats: { totalMembers, activeMembers, invitedMembers },
    subscription: { status, plan, startDate, endDate, isActive }
  }
  ```

---

## 3. Stripe Integration Flow

### 3.1 Subscription Creation Flow

```
User clicks Subscribe → Stripe Checkout
         ↓
checkout.session.completed webhook
         ↓
handleCheckoutSessionCompleted()
         ↓
handleSubscriptionCheckout()
  ├── metadata.subscriptionType === 'company' (default)
  ├── Maps priceId → plan (monthly/6-month/12-month)
  └── createTeam({
        name: "{owner} csapata",
        ownerId, ownerEmail, ownerName,
        subscriptionPlan, stripeSubscriptionId, ...
      })
         ↓
teams/{teamId} created
users/{ownerId}.teamId = teamId
users/{ownerId}.isTeamOwner = true
users/{ownerId}.subscriptionStatus = 'active'
```

### 3.2 Subscription Status Change Flow

```
Stripe events:
├── customer.subscription.updated
├── customer.subscription.deleted
├── invoice.payment_succeeded
└── invoice.payment_failed
         ↓
updateTeamSubscription(stripeSubId, newStatus)
         ↓
Find team by stripeSubscriptionId
Update team.subscriptionStatus
Update owner user.subscriptionStatus
         ↓
If status = 'canceled' or 'past_due':
  → updateTeamMembersAccess(teamId, false)
    → All members lose access
    → All member user.subscriptionStatus = 'canceled'

If status = 'active':
  → updateTeamMembersAccess(teamId, true)
    → All members regain access
    → All member user.subscriptionStatus = 'active'
```

### 3.3 Stripe Price IDs (Hardcoded)

```typescript
// functions/src/types/team.ts (lines 300-308)
'price_1QWPDjRvOWrujGVHxdaSOcJZ' → 'monthly'
'price_1QWPFQRvOWrujGVHHd8gxLzx' → '6-month'
'price_1QWPFqRvOWrujGVHcDUG2Y9W' → '12-month'
```

---

## 4. UI/UX Design Specifications

### 4.1 Dashboard Layout Pattern

The existing dashboard uses a fixed sidebar layout:

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (w-64)          │  MAIN CONTENT (flex-1)          │
│  ├─ Logo                 │  ┌──────────────────────────┐   │
│  ├─ Navigation           │  │  Page Title              │   │
│  │   ├─ Kezdőlap        │  │  Subtitle                │   │
│  │   ├─ Kurzusaim       │  └──────────────────────────┘   │
│  │   ├─ Böngészés       │                                  │
│  │   ├─ [TIM KEZELÉSE]  │  ┌──────┬──────┬──────┬──────┐  │
│  │   │   ← NEW ITEM     │  │ Stat │ Stat │ Stat │ Stat │  │
│  │   ├─ Fizetések       │  │ Card │ Card │ Card │ Card │  │
│  │   └─ Beállítások     │  └──────┴──────┴──────┴──────┘  │
│  │                       │                                  │
│  └─ User Profile         │  ┌──────────────────────────┐   │
│      ├─ Avatar           │  │  Main Content Section    │   │
│      ├─ Name             │  │  (Member List, etc.)     │   │
│      └─ Logout           │  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Design Tokens

- **Primary:** `blue-600` / `blue-500`
- **Success:** `green-600`
- **Warning:** `amber-600`
- **Background:** `bg-white` or `bg-gray-50`
- **Borders:** `border-gray-200`
- **Spacing:** `p-6`, `space-y-8`, `gap-5`

### 4.3 Team Dashboard UI Mockup

```
┌──────────────────────────────────────────────────────────────┐
│  Tim kezelése                                                │
│  Kezeld a csapatod tagjait és előfizetésedet                │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│  │ 👥 5       │ │ ✓ 3       │ │ 📧 2       │ │ ✓ Aktív    ││
│  │ Összes tag │ │ Aktív tag │ │ Meghívott  │ │ Előfizetés ││
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘│
├──────────────────────────────────────────────────────────────┤
│  Csapattagok                          [+ Tag meghívása]      │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Email              │ Státusz  │ Csatlakozott │ Műveletek ││
│  ├──────────────────────────────────────────────────────────┤│
│  │ john@example.com   │ ✓ Aktív  │ 2024.01.15   │ [Eltáv.]  ││
│  │ jane@example.com   │ ⏳ Meghíva│ -            │ [Újrakü.] ││
│  └──────────────────────────────────────────────────────────┘│
├──────────────────────────────────────────────────────────────┤
│  Előfizetés információ                                       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Csomag: 12 hónapos │ Státusz: Aktív │ Lejár: 2025.01.15 ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Component Patterns

**StatCard usage:**
```typescript
<StatCard
  icon={Users}
  label="Összes tag"
  value={stats.totalMembers}
  trend={null}
  isLoading={isLoading}
/>
```

**Button styles:**
- Primary: `bg-blue-600 hover:bg-blue-700 text-white`
- Secondary: `text-gray-700 hover:bg-gray-100`
- Destructive: `text-red-600 hover:bg-red-50`

---

## 5. Complete Gap Analysis

### 5.1 Frontend Gaps (CRITICAL - BLOCKING)

| Gap | Priority | Effort | Status |
|-----|----------|--------|--------|
| **Team Dashboard page** `/dashboard/team` | P0 | Medium | NOT STARTED |
| **Invite Accept page** `/invite/[token]` | P0 | Medium | NOT STARTED |
| **Sidebar link** for team section | P0 | Low | NOT STARTED |
| **Auth store** missing `teamId`, `isTeamOwner` | P0 | Low | NOT STARTED |
| **useTeamDashboard hook** | P0 | Low | NOT STARTED |
| **useTeamInvite hook** (invite/remove/resend) | P0 | Low | NOT STARTED |
| Member list component | P1 | Medium | NOT STARTED |
| Invite form component | P1 | Low | NOT STARTED |
| Team member indicator (for non-owners) | P2 | Low | NOT STARTED |

### 5.2 Backend Gaps

| Gap | Priority | Effort | Status |
|-----|----------|--------|--------|
| **resendTeamInvite** - add email sending | P1 | Low | TODO in code |
| **Member limit** - enforce max 10 | P1 | Low | NOT STARTED |
| **Invite URL** - make domain configurable | P1 | Low | Hardcoded |
| Secure token generation (crypto.randomBytes) | P2 | Low | NOT STARTED |
| Add transactions for multi-doc operations | P2 | Medium | NOT STARTED |
| Timestamp format consistency | P3 | Low | NOT STARTED |

### 5.3 Integration Gaps

| Gap | Priority | Effort | Status |
|-----|----------|--------|--------|
| Subscription check in useEnrollments broken | P0 | Low | BROKEN |
| No welcome email when member joins | P2 | Low | NOT STARTED |
| No notification when access revoked | P2 | Low | NOT STARTED |

---

## 6. Bug List

### 6.1 Critical Bugs

#### BUG #1: Weak Invite Token Generation (SECURITY)
**File:** `functions/src/team/inviteTeamMember.ts` (line 284)
```typescript
// Current (INSECURE):
Math.random().toString(36).substring(2, 15) +
Math.random().toString(36).substring(2, 15) +
Date.now().toString(36)

// Should be:
crypto.randomBytes(32).toString('hex')
```
**Severity:** HIGH - Tokens are predictable if timestamps known

#### BUG #2: resendTeamInvite doesn't send email
**File:** `functions/src/team/removeTeamMember.ts` (line 189)
```typescript
// 7. TODO: Resend invitation email
// Implementation depends on email service setup
```
**Severity:** HIGH - Function is incomplete, users expect email to be sent

#### BUG #3: Hardcoded invite URL domain
**File:** `functions/src/team/inviteTeamMember.ts` (line 134)
```typescript
// Current:
const inviteUrl = `https://dma.hu/invite/${inviteToken}`

// Should be:
const inviteUrl = `${process.env.APP_URL}/invite/${inviteToken}`
```
**Severity:** MEDIUM - Will break in production (domain is academion.hu)

### 6.2 Medium Bugs

#### BUG #4: No transactions on multi-document updates
**Files:** acceptTeamInvite.ts, removeTeamMember.ts, leaveTeam (in acceptTeamInvite.ts)
- Operations update member + user + team count without transaction
- Partial failures leave inconsistent state
**Severity:** MEDIUM - Data can become inconsistent

#### BUG #5: Inconsistent timestamp formats
**Files:** createTeam.ts, acceptTeamInvite.ts
```typescript
// Team docs use:
serverTimestamp()

// User docs use:
new Date().toISOString()
```
**Severity:** LOW - Causes inconsistency but doesn't break functionality

### 6.3 Minor Issues

#### ISSUE #1: checkSubscriptionAccess doesn't verify member record
- Only checks `users/{userId}.subscriptionStatus`
- Doesn't verify actual member document exists
- Removed members might still show access

#### ISSUE #2: No member limit enforcement
- Unlimited invites allowed
- Should enforce max 10 members per team

#### ISSUE #3: Information disclosure in getTeamDashboard
- Non-owners can see invited members' email addresses
- Should restrict visibility based on role

---

## 7. Success Criteria

### 7.1 Must Have (MVP)

- [ ] User can see Team section in dashboard sidebar (only if they're on a team)
- [ ] Team owner can view team dashboard with stats
- [ ] Team owner can invite members (up to 10)
- [ ] Team owner can view member list (active + invited)
- [ ] Team owner can remove members
- [ ] Team owner can resend expired invitations
- [ ] Invited users receive email with working link
- [ ] Invited users can accept invite via `/invite/[token]` page
- [ ] Accepted members appear as active in dashboard
- [ ] Members automatically get subscription access
- [ ] Members can access all courses
- [ ] Subscription changes cascade to all members
- [ ] Team members see indicator they're in a team (but not owner controls)

### 7.2 Should Have

- [ ] Member limit enforced (max 10)
- [ ] Configurable invite URL domain (environment variable)
- [ ] Proper error messages in Hungarian
- [ ] Loading states on all actions
- [ ] Toast notifications for success/error actions

### 7.3 Nice to Have

- [ ] Secure token generation (crypto.randomBytes)
- [ ] Transaction-protected operations
- [ ] Email notifications for access changes
- [ ] Member activity tracking
- [ ] Welcome email when member joins

---

## 8. Implementation Recommendation

### Phase 1: Unblock Core Functionality (P0)
1. Add `teamId` and `isTeamOwner` to auth store
2. Fix subscription check in useEnrollments
3. Create `/invite/[token]` page (accept invites)

### Phase 2: Team Dashboard (P0-P1)
4. Add Team link to DashboardSidebar (conditional on teamId)
5. Create `/dashboard/team` page
6. Create useTeamDashboard hook
7. Create member list component
8. Create invite form component

### Phase 3: Backend Fixes (P1)
9. Fix resendTeamInvite to actually send email
10. Add member limit (max 10) to inviteTeamMember
11. Make invite URL configurable (APP_URL env var)

### Phase 4: Polish (P2-P3)
12. Add team member indicator for non-owners
13. Add proper Hungarian error messages
14. Add loading/toast states
15. (Optional) Improve token security
16. (Optional) Add transactions

---

## 9. File Reference

### Frontend Files to Create
```
src/app/(dashboard)/dashboard/team/page.tsx      # Team dashboard
src/app/invite/[token]/page.tsx                   # Invite accept page
src/hooks/useTeamDashboard.ts                     # Dashboard data hook
src/hooks/useTeamActions.ts                       # Invite/remove hooks
src/components/team/TeamMemberList.tsx            # Member table
src/components/team/InviteMemberForm.tsx          # Invite form
src/components/team/TeamMemberBadge.tsx           # Member indicator
```

### Frontend Files to Modify
```
src/stores/authStore.ts                           # Add teamId, isTeamOwner
src/components/dashboard/DashboardSidebar.tsx     # Add team nav item
src/hooks/useEnrollments.ts                       # Fix subscription check
```

### Backend Files to Modify
```
functions/src/team/removeTeamMember.ts            # Fix resendTeamInvite
functions/src/team/inviteTeamMember.ts            # Add limit, fix URL
```

---

## 10. Appendix: Type Definitions

### Team Types (src/types/team.ts)

```typescript
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
export type SubscriptionPlan = 'monthly' | '6-month' | '12-month'

export interface Team {
  id: string
  name: string
  ownerId: string
  ownerEmail: string
  ownerName: string
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: SubscriptionPlan
  subscriptionStartDate: Timestamp
  subscriptionEndDate: Timestamp
  trialEndDate?: Timestamp
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  memberCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface TeamMember {
  id: string
  teamId: string
  userId?: string
  email: string
  name?: string
  status: 'invited' | 'active' | 'removed'
  inviteToken?: string
  inviteExpiresAt?: Timestamp
  invitedAt: Timestamp
  invitedBy: string
  joinedAt?: Timestamp
  removedAt?: Timestamp
  hasSubscriptionAccess: boolean
}

export interface TeamDashboardData {
  team: Team
  members: TeamMember[]
  owner: { id: string; name: string; email: string }
  stats: {
    totalMembers: number
    activeMembers: number
    invitedMembers: number
  }
  subscription: {
    status: SubscriptionStatus
    plan: SubscriptionPlan
    startDate: string
    endDate: string
    isActive: boolean
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2025-11-24
**Author:** Claude Code Analysis
