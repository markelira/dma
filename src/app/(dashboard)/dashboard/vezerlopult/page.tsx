'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, BookOpen, Play, CheckCircle, Clock, Building2, Star, TrendingUp, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ContinueCoursePreview } from '@/components/dashboard/ContinueCoursePreview';
import { CourseTable } from '@/components/dashboard/CourseTable';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useGamificationData } from '@/hooks/useGamification';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

/**
 * Vezérlőpult - Stats & Analytics Dashboard
 *
 * Sections:
 * 1. Stats overview (4 cards)
 * 2. Continue learning card
 * 3. Recent activity
 * 4. Course table
 */

export default function VezerlopultPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: dashboardData, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const {
    analytics,
    isLoading: gamificationLoading,
  } = useGamificationData();

  const [companyInfo, setCompanyInfo] = useState<{ name: string; id: string } | null>(null);

  // Check if user is company employee
  const isCompanyEmployee = user?.companyId && user?.companyRole === 'employee';

  // Fetch company info for employees
  useEffect(() => {
    const fetchCompanyInfo = async () => {
      if (!isCompanyEmployee || !user?.companyId) return;

      try {
        const db = getFirestore();
        const companyDoc = await getDoc(doc(db, 'companies', user.companyId));
        if (companyDoc.exists()) {
          setCompanyInfo({
            id: companyDoc.id,
            name: companyDoc.data().name || 'Vállalat'
          });
        }
      } catch (err) {
        console.error('Error fetching company info:', err);
      }
    };

    fetchCompanyInfo();
  }, [user?.companyId, isCompanyEmployee]);

  // Redirect admin users
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  // Don't render for admin users
  if (user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-brand-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-secondary to-cyan-600 flex items-center justify-center shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vezérlőpult</h1>
          <p className="text-sm text-gray-500">Statisztikák és elemzések</p>
        </div>
      </div>

      {/* Company Employee Banner */}
      {isCompanyEmployee && companyInfo && (
        <div className="rounded-xl bg-gradient-to-r from-brand-secondary/5 to-purple-50/80 border border-brand-secondary/20 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-secondary to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                Vállalati fiók
              </p>
              <p className="text-sm font-normal text-gray-600">
                A(z) <span className="font-medium text-brand-secondary">{companyInfo.name}</span> tagjaként hozzáférsz az összes tartalomhoz
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-normal bg-brand-secondary/10 text-brand-secondary">
              <Star className="w-3 h-3 mr-1" />
              Prémium
            </span>
          </div>
        </div>
      )}

      {/* Stats Cards (4 cards) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={BookOpen}
          label="Összes tartalom"
          value={dashboardData?.stats.totalEnrolled ?? 0}
          trend={dashboardData?.trends.totalEnrolledTrend}
          isLoading={statsLoading}
        />
        <StatCard
          icon={Play}
          label="Aktív tartalmak"
          value={dashboardData?.stats.activeInProgress ?? 0}
          trend={dashboardData?.trends.activeInProgressTrend}
          isLoading={statsLoading}
        />
        <StatCard
          icon={CheckCircle}
          label="Befejezett"
          value={dashboardData?.stats.completed ?? 0}
          trend={dashboardData?.trends.completedTrend}
          isLoading={statsLoading}
        />
        <StatCard
          icon={Clock}
          label="Tanulási órák"
          value={analytics.data?.totalLearningHours ?? 0}
          trend={analytics.data?.weeklyLearningTrend}
          isLoading={gamificationLoading}
          suffix="h"
        />
      </div>

      {/* Error states */}
      {statsError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-600">
            Hiba a statisztikák betöltésekor. Kérjük, próbálja újra később.
          </p>
        </div>
      )}

      {/* Continue Learning (Full Width) */}
      <ContinueCoursePreview />

      {/* Recent Activity (Simplified) */}
      <RecentActivitySection />

      {/* Course Table */}
      <CourseTable />
    </div>
  );
}
