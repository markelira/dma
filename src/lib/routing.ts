/**
 * Routing utilities for role-based navigation
 */

/**
 * Get the appropriate dashboard path based on user role
 * - company_admin and COMPANY_EMPLOYEE go to /company/dashboard
 * - All other roles go to /dashboard
 */
export function getDashboardPath(role?: string): string {
  if (role === 'company_admin' || role === 'COMPANY_EMPLOYEE') {
    return '/company/dashboard';
  }
  return '/dashboard';
}
