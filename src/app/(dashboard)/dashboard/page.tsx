'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, BookOpen, Play, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ContinueCoursePreview } from '@/components/dashboard/ContinueCoursePreview';
import { CourseTable } from '@/components/dashboard/CourseTable';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { WelcomeHero } from '@/components/dashboard/WelcomeHero';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useGamificationData, useSaveUserPreferences } from '@/hooks/useGamification';
import { Building2, Star } from 'lucide-react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { UserPreferences } from '@/types';

/**
 * DMA Dashboard - Minimal & Intuitive
 *
 * Sections:
 * 1. Welcome Hero (new users only) - Featured courses grid
 * 2. Stats overview (4 cards)
 * 3. Continue learning card
 * 4. Recent activity (simplified)
 * 5. Course table
 */

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: dashboardData, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const {
    preferences,
    analytics,
    isLoading: gamificationLoading,
  } = useGamificationData();

  const savePreferences = useSaveUserPreferences();

  const [showOnboarding, setShowOnboarding] = useState(false);
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

  // Check if onboarding is needed
  useEffect(() => {
    if (preferences.data && !preferences.data.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [preferences.data]);

  // Redirect admin users
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      router.replace('/admin/dashboard');
    }
  }, [user, router]);

  // Handle onboarding completion
  const handleOnboardingComplete = async (prefs: Partial<UserPreferences>) => {
    try {
      await savePreferences.mutateAsync({
        ...prefs,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
      setShowOnboarding(false);
    } catch (error) {
      console.error('Onboarding save error:', error);
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  // Don't render for admin users
  if (user?.role === 'ADMIN' || user?.role === 'COMPANY_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
      </div>
    );
  }

  // Check if user is new (no enrollments) - only after data loads to prevent flash
  const isNewUser = !statsLoading && dashboardData && dashboardData.stats.totalEnrolled === 0;

  return (
    <>
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          initialData={preferences.data || undefined}
        />
      )}

      <div className="space-y-8">
        {/* Company Employee Banner */}
        {isCompanyEmployee && companyInfo && (
          <div className="rounded-xl bg-gradient-to-r from-blue-50/80 to-purple-50/80 border border-blue-200/50 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Vállalati fiók
                </p>
                <p className="text-sm text-gray-600">
                  A(z) <span className="font-medium text-blue-600">{companyInfo.name}</span> tagjaként hozzáférsz az összes kurzushoz
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <Star className="w-3 h-3 mr-1" />
                Prémium
              </span>
            </div>
          </div>
        )}

        {/* Welcome Hero for New Users */}
        {isNewUser && (
          <WelcomeHero
            userName={user?.firstName || user?.displayName || 'Felhasználó'}
            hasEnrolledCourses={!isNewUser}
            isNewUser={isNewUser}
          />
        )}

        {/* Stats Cards (4 cards) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={BookOpen}
            label="Összes kurzus"
            value={dashboardData?.stats.totalEnrolled ?? 0}
            trend={dashboardData?.trends.totalEnrolledTrend}
            isLoading={statsLoading}
          />
          <StatCard
            icon={Play}
            label="Aktív kurzusok"
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
    </>
  );
}
