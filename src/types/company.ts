import { Timestamp } from 'firebase/firestore';

/**
 * Company type definitions for B2B dashboard
 */

export interface Company {
  id: string;
  name: string;
  slug: string;
  billingEmail: string;
  plan: 'trial' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  industry: string;
  companySize: string;
  trialEndsAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompanyAdmin {
  id?: string;
  userId: string;
  companyId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin';
  permissions: {
    canManageEmployees: boolean;
    canViewReports: boolean;
    canManageBilling: boolean;
    canManageMasterclasses: boolean;
  };
  status: 'active' | 'inactive';
  addedBy: string;
  addedAt: Timestamp;
}

export interface CompanyEmployee {
  id: string;
  userId?: string; // Set after user accepts invite
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  status: 'invited' | 'active' | 'left';
  inviteToken?: string;
  inviteExpiresAt?: Timestamp;
  companyId: string;
  enrolledMasterclasses?: { masterclassId: string }[];
  invitedBy: string;
  invitedAt: Timestamp;
  joinedAt?: Timestamp;
}

export interface CompanyMasterclass {
  id: string;
  companyId: string;
  masterclassId: string; // Reference to global masterclass
  title: string;
  description?: string;
  duration: number; // in weeks
  seats: {
    purchased: number;
    used: number;
    available: number;
  };
  pricePerSeat: number;
  totalPaid: number;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  status: 'scheduled' | 'active' | 'completed';
  purchasedAt: Timestamp;
  purchasedBy: string;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  invitedEmployees: number;
  totalMasterclasses: number;
  completedCourses: number;
  averageProgress: number;
  atRiskCount: number;
}

export interface EmployeeProgress {
  employeeId: string;
  employeeName: string;
  email: string;
  jobTitle?: string;
  masterclassId: string;
  masterclassTitle: string;
  currentModule: number;
  completedModules: number[];
  totalModules: number;
  progressPercent: number;
  status: 'active' | 'completed' | 'at-risk' | 'not-started';
  lastActivityAt?: Date;
  enrolledAt: Date;
  daysActive: number;
}

export interface AddEmployeeInput {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
}

export interface EnrollEmployeesResponse {
  success: boolean;
  enrolledCount: number;
  enrolledEmployees: string[];
  skipped: number;
}

export interface CompanyDashboardData {
  companyName: string;
  stats: DashboardStats;
  employees: EmployeeProgress[];
  masterclasses: { id: string; title: string; duration: number }[];
}
