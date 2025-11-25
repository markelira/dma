'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';
import { UnifiedSidebar } from '@/components/navigation/unified-sidebar';
import { DashboardHeader } from '@/components/navigation/dashboard-header';

interface UniversityAdminLayoutProps {
  children: ReactNode;
}

export default function UniversityAdminLayout({ children }: UniversityAdminLayoutProps) {
  const { user, isLoading, authReady } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !isLoading) {
      // Check if user is authenticated and has university_admin or UNIVERSITY_ADMIN role
      if (!user || (user.role !== 'UNIVERSITY_ADMIN' && user.role !== 'university_admin')) {
        console.log('❌ [UniversityAdminLayout] Unauthorized access, redirecting to login');
        router.replace('/login?redirect_to=/university-admin/dashboard');
      }
    }
  }, [user, isLoading, authReady, router]);

  if (!authReady || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-brand-secondary" />
          <p className="text-gray-600">
            {!authReady ? 'Hitelesítés inicializálása...' : 
             isLoading ? 'Betöltés...' : 
             'Bejelentkezés szükséges...'}
          </p>
        </div>
      </div>
    );
  }

  // Check role again for safety
  if (user.role !== 'UNIVERSITY_ADMIN' && user.role !== 'university_admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <UnifiedSidebar userRole={user.role} />
        <main className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}