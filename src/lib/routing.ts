/**
 * Routing utilities for role-based navigation
 */

/**
 * Get the appropriate dashboard path based on user role
 * - company_admin → /company/dashboard (company owners who registered without invite)
 * - INSTRUCTOR → /instructor/dashboard
 * - ADMIN → /admin/dashboard
 * - COMPANY_EMPLOYEE and all other roles → /dashboard
 */
export function getDashboardPath(role?: string): string {
  if (role === 'company_admin') {
    return '/company/dashboard';
  }
  if (role === 'INSTRUCTOR') {
    return '/instructor/dashboard';
  }
  if (role === 'ADMIN') {
    return '/admin/dashboard';
  }
  return '/dashboard';
}
