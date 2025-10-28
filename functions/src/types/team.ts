/**
 * Team Subscription Types for Cloud Functions
 *
 * Backend types for team management, subscription inheritance,
 * and Stripe integration.
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// ============================================
// SUBSCRIPTION TYPES
// ============================================

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'none';

export type SubscriptionPlan =
  | 'monthly'
  | '6-month'
  | '12-month';

// ============================================
// TEAM TYPES
// ============================================

export interface Team {
  id: string;
  name: string;

  // Owner details
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
  memberCount: number;

  // Metadata
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

export interface CreateTeamInput {
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  trialEndDate?: Date;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
}

export interface UpdateTeamSubscriptionInput {
  teamId: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate?: Date;
}

// ============================================
// TEAM MEMBER TYPES
// ============================================

export type TeamMemberStatus =
  | 'invited'
  | 'active'
  | 'removed';

export interface TeamMember {
  id: string;
  teamId: string;
  userId?: string;
  email: string;
  name?: string;

  // Invitation workflow
  status: TeamMemberStatus;
  inviteToken?: string;
  inviteExpiresAt?: Timestamp;

  // Timestamps
  invitedAt: Timestamp | FieldValue;
  invitedBy: string;
  joinedAt?: Timestamp;
  removedAt?: Timestamp;

  // Access control
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
  userName?: string;
}

export interface RemoveTeamMemberInput {
  teamId: string;
  memberId: string;
  removedBy: string;
}

// ============================================
// STRIPE WEBHOOK TYPES
// ============================================

export interface StripeCheckoutSessionMetadata {
  userId: string;
  plan: SubscriptionPlan;
  priceId: string;
}

export interface StripeSubscriptionMetadata {
  teamId: string;
  ownerId: string;
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

export interface TeamWelcomeEmailData {
  to: string;
  userName: string;
  teamName: string;
  dashboardLink: string;
}

export interface TeamMemberRemovedEmailData {
  to: string;
  userName: string;
  teamName: string;
  removedBy: string;
}

export interface SubscriptionStatusChangeEmailData {
  to: string;
  teamOwnerName: string;
  status: SubscriptionStatus;
  teamName: string;
  endDate?: string;
}

// ============================================
// CLOUD FUNCTION RESPONSE TYPES
// ============================================

export interface InviteTeamMemberResponse {
  success: boolean;
  memberId?: string;
  message?: string;
  error?: string;
}

export interface AcceptTeamInviteResponse {
  success: boolean;
  teamId?: string;
  teamName?: string;
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
  data?: {
    team: Team;
    members: TeamMember[];
    stats: {
      totalMembers: number;
      activeMembers: number;
      invitedMembers: number;
    };
  };
  error?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate subscription end date based on plan
 */
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

/**
 * Calculate trial end date (7 days from start)
 */
export function calculateTrialEndDate(startDate: Date): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);
  return endDate;
}

/**
 * Check if subscription is active
 */
export function hasActiveSubscription(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Check if user is team owner
 */
export function isTeamOwner(team: Team, userId: string): boolean {
  return team.ownerId === userId;
}

/**
 * Generate secure invite token
 */
export function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36);
}

/**
 * Check if invite token is expired
 */
export function isInviteExpired(expiresAt: Timestamp): boolean {
  return expiresAt.toDate() < new Date();
}

/**
 * Map Stripe price ID to subscription plan
 */
export function stripePriceIdToPlan(priceId: string): SubscriptionPlan {
  const priceMap: Record<string, SubscriptionPlan> = {
    'price_1QWPDjRvOWrujGVHxdaSOcJZ': 'monthly',
    'price_1QWPFQRvOWrujGVHHd8gxLzx': '6-month',
    'price_1QWPFqRvOWrujGVHcDUG2Y9W': '12-month',
  };

  return priceMap[priceId] || 'monthly';
}

/**
 * Get Stripe price ID from plan
 */
export function planToStripePriceId(plan: SubscriptionPlan): string {
  const planMap: Record<SubscriptionPlan, string> = {
    'monthly': 'price_1QWPDjRvOWrujGVHxdaSOcJZ',
    '6-month': 'price_1QWPFQRvOWrujGVHHd8gxLzx',
    '12-month': 'price_1QWPFqRvOWrujGVHcDUG2Y9W',
  };

  return planMap[plan];
}
