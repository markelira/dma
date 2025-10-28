# Team Subscription Model - B2C Architecture

## Overview
DMA.hu transitions from B2B2C (company seats) to B2C (consumer teams) model where:
- Individual users subscribe directly
- Subscribers become team owners
- Unlimited team members per subscription
- Team members inherit full subscription access

---

## Core Concepts

### 1. Subscription Ownership
- **User subscribes** → automatically becomes **Team Owner**
- One active subscription = one team
- Subscription includes unlimited team member seats

### 2. Subscription Inheritance
- **Team Owner** has active subscription
- **Team Members** inherit subscription access automatically
- All members get full platform access (videos, courses, etc.)
- Access revoked when:
  - Subscription cancelled/expires
  - Member removed from team
  - Member leaves team

### 3. Team Management
- Only Team Owner can:
  - Invite members (via email)
  - Remove members
  - Manage subscription
- Team Members can:
  - Accept/decline invites
  - Leave team
  - Access all content

---

## Data Model

### Firestore Collections

```
users/{userId}
  - role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  - teamId?: string (reference to team they belong to)
  - isTeamOwner: boolean
  - subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none'
  - stripeCustomerId?: string
  - stripeSubscriptionId?: string

teams/{teamId}
  - id: string
  - name: string (e.g., "My Team", "Marketing Team")
  - ownerId: string (userId of team owner)
  - ownerEmail: string
  - ownerName: string

  // Subscription details (denormalized for quick access)
  - subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'canceled'
  - subscriptionPlan: 'monthly' | '6-month' | '12-month'
  - subscriptionStartDate: Timestamp
  - subscriptionEndDate: Timestamp
  - trialEndDate?: Timestamp

  // Stripe references
  - stripeSubscriptionId: string
  - stripeCustomerId: string
  - stripePriceId: string

  // Team stats
  - memberCount: number
  - createdAt: Timestamp
  - updatedAt: Timestamp

teams/{teamId}/members/{memberId}
  - id: string
  - teamId: string
  - userId?: string (null until invite accepted)
  - email: string
  - name?: string

  // Invitation workflow
  - status: 'invited' | 'active' | 'removed'
  - inviteToken?: string (unique token for email link)
  - inviteExpiresAt?: Timestamp (7 days from invite)

  // Timestamps
  - invitedAt: Timestamp
  - invitedBy: string (ownerId)
  - joinedAt?: Timestamp
  - removedAt?: Timestamp

  // Access control
  - hasSubscriptionAccess: boolean (computed: team.subscriptionStatus === 'active')
```

---

## User Flows

### Flow 1: User Subscribes (New Team Creation)

```
1. User visits /pricing
2. User clicks "Kezdd el most" (Start Now)
3. User registers/logs in
4. User redirected to Stripe Checkout
   → Stripe creates subscription
   → Stripe returns to success page
5. Stripe webhook fires: checkout.session.completed
6. Cloud Function: handleStripeWebhook
   → Creates Team document
   → Updates User document (isTeamOwner: true, teamId, subscriptionStatus)
7. User redirected to /dashboard
```

### Flow 2: Team Owner Invites Member

```
1. Team Owner goes to /dashboard/team
2. Clicks "Csapattag meghívása" (Invite Team Member)
3. Enters email address
4. Cloud Function: inviteTeamMember
   → Creates teamMembers/{teamId}/members/{memberId} document
   → Generates unique invite token
   → Sends email with invite link: /invite/{token}
   → Returns success
5. Invited user receives email
```

### Flow 3: User Accepts Team Invite

```
1. User clicks link in email: /invite/{token}
2. If not logged in:
   → Redirect to /register?invite={token}
   → User creates account
   → Auto-accept invite after registration
3. If logged in:
   → Show accept/decline page
   → User clicks "Elfogadom" (Accept)
4. Cloud Function: acceptTeamInvite
   → Update teamMember: status = 'active', userId = currentUser.id, joinedAt = now
   → Update user: teamId = team.id
   → Return success
5. User redirected to /dashboard
   → Has full subscription access
```

### Flow 4: Subscription Status Changes

```
Stripe webhook events:
- customer.subscription.created → Create team
- customer.subscription.updated → Update team.subscriptionStatus
- customer.subscription.deleted → Set status to 'canceled'
- invoice.payment_failed → Set status to 'past_due'
- invoice.payment_succeeded → Set status to 'active'

Team member access is computed on-the-fly:
- Query user's team
- Check team.subscriptionStatus === 'active'
- Grant/deny access accordingly
```

---

## TypeScript Types

### /src/types/team.ts

```typescript
import { Timestamp } from 'firebase/firestore';

/**
 * Team Subscription Types for B2C Model
 */

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
export type SubscriptionPlan = 'monthly' | '6-month' | '12-month';
export type TeamMemberStatus = 'invited' | 'active' | 'removed';

export interface Team {
  id: string;
  name: string;

  // Owner details
  ownerId: string;
  ownerEmail: string;
  ownerName: string;

  // Subscription details (denormalized)
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartDate: Timestamp;
  subscriptionEndDate: Timestamp;
  trialEndDate?: Timestamp;

  // Stripe references
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;

  // Team stats
  memberCount: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId?: string; // null until invite accepted
  email: string;
  name?: string;

  // Invitation workflow
  status: TeamMemberStatus;
  inviteToken?: string;
  inviteExpiresAt?: Timestamp;

  // Timestamps
  invitedAt: Timestamp;
  invitedBy: string;
  joinedAt?: Timestamp;
  removedAt?: Timestamp;

  // Access control (computed)
  hasSubscriptionAccess: boolean;
}

export interface InviteTeamMemberInput {
  teamId: string;
  email: string;
  invitedBy: string;
}

export interface AcceptTeamInviteInput {
  inviteToken: string;
  userId: string;
}

export interface TeamDashboardData {
  team: Team;
  members: TeamMember[];
  owner: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
    invitedMembers: number;
  };
}
```

---

## Cloud Functions

### 1. createTeamOnSubscription (Stripe Webhook)
**Trigger**: Stripe `checkout.session.completed` webhook

```typescript
export const handleStripeWebhook = onRequest(async (req, res) => {
  // Verify webhook signature
  // Parse event

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    const userId = session.metadata.userId;

    // Create team
    const teamRef = db.collection('teams').doc();
    await teamRef.set({
      id: teamRef.id,
      name: `${user.name} csapata`, // "{Name}'s Team"
      ownerId: userId,
      ownerEmail: user.email,
      ownerName: user.name,
      subscriptionStatus: 'active',
      subscriptionPlan: session.metadata.plan,
      subscriptionStartDate: Timestamp.now(),
      subscriptionEndDate: calculateEndDate(session.metadata.plan),
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      stripePriceId: session.metadata.priceId,
      memberCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Update user
    await db.collection('users').doc(userId).update({
      isTeamOwner: true,
      teamId: teamRef.id,
      subscriptionStatus: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
    });
  }
});
```

### 2. inviteTeamMember (Callable Function)
**Purpose**: Send team invitation via email

```typescript
export const inviteTeamMember = onCall(async (request) => {
  const { teamId, email } = request.data;
  const userId = request.auth.uid;

  // 1. Verify user is team owner
  const teamDoc = await db.collection('teams').doc(teamId).get();
  const team = teamDoc.data();

  if (team.ownerId !== userId) {
    throw new Error('Only team owner can invite members');
  }

  // 2. Check if email already invited or member
  const existingMember = await db
    .collection('teams').doc(teamId)
    .collection('members')
    .where('email', '==', email)
    .get();

  if (!existingMember.empty) {
    throw new Error('User already invited or is a member');
  }

  // 3. Create team member invitation
  const inviteToken = generateSecureToken();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days

  const memberRef = db.collection('teams').doc(teamId).collection('members').doc();
  await memberRef.set({
    id: memberRef.id,
    teamId,
    email,
    status: 'invited',
    inviteToken,
    inviteExpiresAt: expiresAt,
    invitedAt: Timestamp.now(),
    invitedBy: userId,
    hasSubscriptionAccess: false,
  });

  // 4. Send invitation email
  await sendTeamInviteEmail({
    to: email,
    teamName: team.name,
    inviterName: team.ownerName,
    inviteLink: `https://dma.hu/invite/${inviteToken}`,
  });

  // 5. Update team member count
  await db.collection('teams').doc(teamId).update({
    memberCount: FieldValue.increment(1),
  });

  return { success: true, memberId: memberRef.id };
});
```

### 3. acceptTeamInvite (Callable Function)
**Purpose**: User accepts team invitation

```typescript
export const acceptTeamInvite = onCall(async (request) => {
  const { inviteToken } = request.data;
  const userId = request.auth.uid;

  // 1. Find invitation by token
  const membersSnapshot = await db
    .collectionGroup('members')
    .where('inviteToken', '==', inviteToken)
    .where('status', '==', 'invited')
    .limit(1)
    .get();

  if (membersSnapshot.empty) {
    throw new Error('Invalid or expired invitation');
  }

  const memberDoc = membersSnapshot.docs[0];
  const member = memberDoc.data();
  const teamId = member.teamId;

  // 2. Check expiration
  if (member.inviteExpiresAt.toDate() < new Date()) {
    throw new Error('Invitation expired');
  }

  // 3. Get team to check subscription status
  const teamDoc = await db.collection('teams').doc(teamId).get();
  const team = teamDoc.data();

  // 4. Update team member
  await memberDoc.ref.update({
    userId,
    status: 'active',
    joinedAt: Timestamp.now(),
    hasSubscriptionAccess: team.subscriptionStatus === 'active',
    inviteToken: FieldValue.delete(),
  });

  // 5. Update user document
  await db.collection('users').doc(userId).update({
    teamId,
    subscriptionStatus: team.subscriptionStatus,
  });

  return {
    success: true,
    teamId,
    teamName: team.name,
  };
});
```

### 4. checkSubscriptionAccess (Helper)
**Purpose**: Verify user has active subscription access

```typescript
export async function checkSubscriptionAccess(userId: string): Promise<boolean> {
  const userDoc = await db.collection('users').doc(userId).get();
  const user = userDoc.data();

  // Check if user is team owner with active subscription
  if (user.isTeamOwner && user.subscriptionStatus === 'active') {
    return true;
  }

  // Check if user is team member with inherited access
  if (user.teamId) {
    const teamDoc = await db.collection('teams').doc(user.teamId).get();
    const team = teamDoc.data();
    return team.subscriptionStatus === 'active';
  }

  return false;
}
```

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Teams collection
    match /teams/{teamId} {
      // Only team owner can read/update their team
      allow read: if request.auth != null &&
                     resource.data.ownerId == request.auth.uid;

      allow update: if request.auth != null &&
                       resource.data.ownerId == request.auth.uid;

      // Team members subcollection
      match /members/{memberId} {
        // Team owner can read/write all members
        allow read, write: if request.auth != null &&
                              get(/databases/$(database)/documents/teams/$(teamId)).data.ownerId == request.auth.uid;

        // Members can read their own document
        allow read: if request.auth != null &&
                       resource.data.userId == request.auth.uid;
      }
    }

    // Users can read/update their own document
    match /users/{userId} {
      allow read, update: if request.auth != null &&
                             request.auth.uid == userId;
    }
  }
}
```

---

## Email Templates

### Team Invitation Email

**Subject**: Meghívás: Csatlakozz a(z) {teamName} csapatához DMA.hu-n

**Body** (Hungarian):
```
Szia!

{inviterName} meghívott, hogy csatlakozz a(z) "{teamName}" csapatához a DMA.hu platformon.

A csapattagként korlátlan hozzáférést kapsz az összes videókurzushoz és tartalomhoz.

Kattints az alábbi linkre a meghívás elfogadásához:
{inviteLink}

Ez a meghívó 7 napig érvényes.

Üdvözlettel,
DMA.hu csapata
```

---

## UI Components Needed

1. **TeamDashboard** - `/dashboard/team`
   - Team overview (name, member count, subscription status)
   - Invite member form
   - Member list with remove actions
   - Subscription management link

2. **InviteAcceptPage** - `/invite/{token}`
   - Display team name and inviter
   - Accept/Decline buttons
   - Auto-redirect after acceptance

3. **TeamMemberList** - Component
   - List of active and invited members
   - Status badges
   - Remove button (owner only)

4. **InviteMemberModal** - Component
   - Email input form
   - Validation
   - Success confirmation

---

## Migration Strategy

### Phase 1: Type Definitions
- Create `/src/types/team.ts`
- Update `/src/types/index.ts` to remove company roles

### Phase 2: Cloud Functions
- Implement team management functions
- Update Stripe webhook handler

### Phase 3: Frontend Components
- Create team dashboard UI
- Build invite/accept flow

### Phase 4: Security Rules
- Deploy new Firestore rules

### Phase 5: Testing
- Test subscription flow
- Test invite flow
- Test access control

---

## Success Metrics

- User subscribes → Team created automatically ✅
- Team owner invites member → Email sent ✅
- Member accepts invite → Gets full access ✅
- Subscription cancelled → All members lose access ✅
- Member removed → Loses access immediately ✅
