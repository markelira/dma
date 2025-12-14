/**
 * Routing utilities for role-based navigation
 */

/**
 * Get the appropriate dashboard path based on user role
 * - company_admin (company owners who registered without invite) → /company/dashboard
 * - COMPANY_EMPLOYEE (invited employees) and all other roles → /dashboard
 */
export function getDashboardPath(role?: string): string {
  if (role === 'company_admin') {
    return '/company/dashboard';
  }
  return '/dashboard';
}
