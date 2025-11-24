/**
 * Company Admin Dashboard - Type Definitions
 * MVP Version - Simplified schema
 */

import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// ============================================
// COMPANY
// ============================================

export interface Company {
  id: string;
  name: string;
  slug: string; // URL-friendly
  billingEmail: string;

  // Company details
  industry?: string;
  companySize?: string;

  // Subscription managed by Stripe (7-day trial handled by Stripe)
  plan: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended';
  subscriptionStatus: 'none' | 'active' | 'trialing' | 'past_due' | 'canceled';

  // Stripe fields
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  trialEndDate?: Timestamp; // From Stripe, not our app

  createdAt: Timestamp | FieldValue;
  createdBy?: string;
  updatedAt: Timestamp | FieldValue;
}

export interface CreateCompanyInput {
  name: string;
  billingEmail: string;
}

// ============================================
// COMPANY ADMIN
// ============================================

export interface CompanyAdmin {
  userId: string;
  companyId: string;
  email: string;
  name: string;

  role: 'owner' | 'admin'; // MVP: Only 2 roles
  permissions: CompanyAdminPermissions;

  status: 'active' | 'invited';
  inviteToken?: string;
  inviteExpiresAt?: Timestamp;

  addedBy: string;
  addedAt: Timestamp | FieldValue;
}

export interface CompanyAdminPermissions {
  canManageEmployees: boolean;
  canViewReports: boolean;
  canManageBilling?: boolean;
  canManageMasterclasses?: boolean;
}

// Permission constants
export const OWNER_PERMISSIONS: CompanyAdminPermissions = {
  canManageEmployees: true,
  canViewReports: true,
  canManageBilling: true,
  canManageMasterclasses: true,
};

export const ADMIN_PERMISSIONS: CompanyAdminPermissions = {
  canManageEmployees: true,
  canViewReports: true,
  canManageBilling: false,
  canManageMasterclasses: true,
};

// ============================================
// COMPANY EMPLOYEE
// ============================================

export interface CompanyEmployee {
  id?: string;
  userId?: string; // null until they accept
  companyId: string;

  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;

  jobTitle?: string;

  status: 'invited' | 'active' | 'left';
  inviteToken?: string;
  inviteExpiresAt?: Timestamp;

  // MVP: Simple enrollment tracking
  enrolledMasterclasses?: EnrollmentRecord[];

  invitedBy?: string;
  invitedAt?: Timestamp | FieldValue;
  inviteAcceptedAt?: Timestamp;
}

export interface EnrollmentRecord {
  masterclassId: string;
  enrolledAt: Timestamp | FieldValue;
}

export interface AddEmployeeInput {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
}

// ============================================
// COMPANY MASTERCLASS
// ============================================

export interface CompanyMasterclass {
  id: string;
  companyId: string;
  masterclassId: string; // Reference to global masterclass

  title: string; // Denormalized
  duration: number; // weeks

  seats: {
    purchased: number;
    used: number;
    available: number; // purchased - used
  };

  // MVP: Manual pricing (no Stripe)
  pricePerSeat: number;
  totalPaid: number;
  paymentStatus: 'pending' | 'paid' | 'manual'; // MVP defaults to 'manual'

  startDate: Timestamp;
  endDate: Timestamp;

  status: 'scheduled' | 'active' | 'completed';

  createdAt: Timestamp | FieldValue;
  createdBy: string;
  updatedAt: Timestamp | FieldValue;
}

export interface CreateCompanyMasterclassInput {
  masterclassId: string;
  seatCount: number;
  startDate: Date;
}

// ============================================
// USER PROGRESS (Extended for Company Context)
// ============================================

export interface UserMasterclassProgress {
  id: string; // userId_masterclassId
  userId: string;
  masterclassId: string;

  // Company context
  isCompanySponsored: boolean;
  companyId?: string;
  companyMasterclassId?: string;

  // Progress
  currentModule: number; // 1-8
  overallProgress: number; // 0-100

  // MVP: Simple tracking
  lastActivityDate: Timestamp | FieldValue;
  totalTimeSpent: number; // minutes

  // Status (computed on-demand in MVP)
  computedStatus: 'on_track' | 'at_risk' | 'completed';

  enrolledAt: Timestamp | FieldValue;
  completedAt?: Timestamp;
  certificateIssued: boolean;
}

// ============================================
// DASHBOARD DATA
// ============================================

export interface DashboardMetrics {
  totalEmployees: number;
  onTrackCount: number;
  atRiskCount: number;
  completedCount: number;
  averageProgress: number;
}

export interface DashboardEmployee {
  userId: string;
  name: string;
  email: string;
  jobTitle?: string;
  progress: number;
  status: 'on_track' | 'at_risk' | 'completed';
  lastActive: Date;
  weekNumber: number;
}

export interface DashboardData {
  company: Company;
  masterclass: CompanyMasterclass;
  employees: DashboardEmployee[];
  metrics: DashboardMetrics;
}

// ============================================
// HELPER TYPES
// ============================================

export type CompanyRole = 'owner' | 'admin';

export interface InviteTokenData {
  token: string;
  expiresAt: Date;
}
