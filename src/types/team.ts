/**
 * Team Subscription Types for B2C Model
 *
 * DMA.hu team subscription system where:
 * - Individual users subscribe and become team owners
 * - Team owners can invite unlimited members via email
 * - Team members inherit subscription access automatically
 */

import { Timestamp } from 'firebase/firestore';

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionStatus =
  | 'active'      // Subscription is active and paid
  | 'trialing'    // In free trial period
  | 'past_due'    // Payment failed, grace period
  | 'canceled'    // Subscription cancelled
  | 'none';       // No subscription

export type SubscriptionPlan =
  | 'monthly'     // 15,000 HUF/month
  | '6-month'     // 81,000 HUF/6 months
  | '12-month';   // 158,400 HUF/12 months

// ============================================
// TEAM TYPES
// ============================================

export interface Team {
  id: string;
  name: string;

  // Owner details (denormalized for quick access)
  ownerId: string;
  ownerEmail: string;
  ownerName: string;

  // Subscription details (denormalized from Stripe)
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
  memberCount: number; // Updated via Cloud Functions

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Input for creating a team (used in Cloud Functions)
export interface CreateTeamInput {
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  subscriptionPlan: SubscriptionPlan;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
}

// ============================================
// TEAM MEMBER TYPES
// ============================================

export type TeamMemberStatus =
  | 'invited'   // Invitation sent, not yet accepted
  | 'active'    // Member active in team
  | 'removed';  // Removed from team

export interface TeamMember {
  id: string;
  teamId: string;
  userId?: string; // null until invite accepted
  email: string;
  name?: string;

  // Invitation workflow
  status: TeamMemberStatus;
  inviteToken?: string; // Unique token for invite link
  inviteExpiresAt?: Timestamp; // 7 days from invitation

  // Timestamps
  invitedAt: Timestamp;
  invitedBy: string; // userId of inviter (team owner)
  joinedAt?: Timestamp;
  removedAt?: Timestamp;

  // Access control (computed based on team subscription)
  hasSubscriptionAccess: boolean;
}

// Input for inviting a team member
export interface InviteTeamMemberInput {
  teamId: string;
  email: string;
  invitedBy: string;
}

// Input for accepting a team invite
export interface AcceptTeamInviteInput {
  inviteToken: string;
  userId: string;
}

// Input for removing a team member
export interface RemoveTeamMemberInput {
  teamId: string;
  memberId: string;
  removedBy: string;
}

// ============================================
// DASHBOARD & UI TYPES
// ============================================

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
  subscription: {
    status: SubscriptionStatus;
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
}

// Team member with enhanced display data
export interface TeamMemberWithUser extends TeamMember {
  userProfile?: {
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface InviteTeamMemberResponse {
  success: boolean;
  memberId: string;
  message?: string;
  error?: string;
}

export interface AcceptTeamInviteResponse {
  success: boolean;
  teamId: string;
  teamName: string;
  message?: string;
  error?: string;
}

export interface RemoveTeamMemberResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GetTeamDashboardResponse {
  success: boolean;
  data: TeamDashboardData;
  error?: string;
}

// ============================================
// EMAIL TYPES
// ============================================

export interface TeamInviteEmailData {
  to: string;
  teamName: string;
  inviterName: string;
  inviteLink: string;
  expiryDays: number;
}

export interface TeamMemberRemovedEmailData {
  to: string;
  teamName: string;
  removedBy: string;
}

// ============================================
// UTILITY TYPES
// ============================================

// Type guard for checking if user is team owner
export function isTeamOwner(team: Team, userId: string): boolean {
  return team.ownerId === userId;
}

// Type guard for checking if subscription is active
export function hasActiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

// Calculate subscription end date based on plan
export function calculateSubscriptionEndDate(
  startDate: Date,
  plan: SubscriptionPlan
): Date {
  const endDate = new Date(startDate);

  switch (plan) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case '6-month':
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case '12-month':
      endDate.setMonth(endDate.getMonth() + 12);
      break;
  }

  return endDate;
}

// Format subscription plan for display
export function formatSubscriptionPlan(plan: SubscriptionPlan): string {
  const planNames: Record<SubscriptionPlan, string> = {
    'monthly': 'Havi előfizetés',
    '6-month': '6 hónapos csomag',
    '12-month': '12 hónapos csomag',
  };

  return planNames[plan];
}

// Format subscription status for display
export function formatSubscriptionStatus(status: SubscriptionStatus): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  const statusMap: Record<SubscriptionStatus, { label: string; color: 'green' | 'yellow' | 'red' | 'gray' }> = {
    active: { label: 'Aktív', color: 'green' },
    trialing: { label: 'Próba időszak', color: 'yellow' },
    past_due: { label: 'Lejárt fizetés', color: 'red' },
    canceled: { label: 'Megszakítva', color: 'gray' },
    none: { label: 'Nincs előfizetés', color: 'gray' },
  };

  return statusMap[status];
}
