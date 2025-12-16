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
  const upperRole = role?.toUpperCase();
  if (upperRole === 'COMPANY_ADMIN') {
    return '/company/dashboard';
  }
  if (upperRole === 'INSTRUCTOR') {
    return '/instructor/dashboard';
  }
  if (upperRole === 'ADMIN') {
    return '/admin/dashboard';
  }
  return '/dashboard';
}
