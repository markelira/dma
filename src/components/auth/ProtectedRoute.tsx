'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermission,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Check if user is authenticated
      if (!user) {
        router.push(`${redirectTo}?redirect=${window.location.pathname}`);
        return;
      }

      // Check role requirements
      if (requiredRoles && !hasRole(requiredRoles)) {
        router.push('/unauthorized');
        return;
      }

      // Check permission requirements
      if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, requiredRoles, requiredPermission]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Check authorization
  if (!user) {
    return null;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return null;
  }

  if (requiredPermission && !hasPermission(requiredPermission.resource, requiredPermission.action)) {
    return null;
  }

  return <>{children}</>;
}