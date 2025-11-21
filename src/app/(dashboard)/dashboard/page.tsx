'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Loader2, BookOpen, Play, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ContinueCoursePreview } from '@/components/dashboard/ContinueCoursePreview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { CourseTable } from '@/components/dashboard/CourseTable';
import { RecommendedCourses } from '@/components/dashboard/RecommendedCourses';
import { LearningHoursChart } from '@/components/dashboard/LearningHoursChart';
import { GoalProgressWidget } from '@/components/dashboard/GoalProgressWidget';
import { StreakCalendar } from '@/components/dashboard/StreakCalendar';
import { AchievementGrid } from '@/components/achievements/AchievementGrid';
import { AchievementUnlockModal } from '@/components/achievements/AchievementUnlockModal';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { WelcomeHero } from '@/components/dashboard/WelcomeHero';
import { RecentActivitySection } from '@/components/dashboard/RecentActivitySection';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useGamificationData, useSaveUserPreferences } from '@/hooks/useGamification';
import type { UserAchievement, LearningHoursChartData, UserPreferences } from '@/types';

/**
 * Enhanced DMA Dashboard with Gamification
 *
 * Features:
 * - Onboarding wizard for new users
 * - Stats overview with learning hours
 * - Learning hours chart
 * - Goal progress tracking
 * - Streak calendar
 * - Achievement system
 * - Activity timeline
 * - Course management
 */

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { data: dashboardData, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const {
    preferences,
    streak,
    analytics,
    achievements,
    goals,
    isLoading: gamificationLoading,
  } = useGamificationData();

  const savePreferences = useSaveUserPreferences();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<UserAchievement | null>(null);
  const [chartTimeRange, setChartTimeRange] = useState<'week' | 'month' | 'year'>('week');

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
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // Prepare learning hours chart data
  const generateChartData = (): LearningHoursChartData => {
    if (!analytics.data || !streak.data) {
      return {
        timeRange: chartTimeRange,
        data: [],
        totalMinutes: 0,
        averagePerDay: 0,
      };
    }

    const activityCalendar = streak.data.activityCalendar || {};
    const days = chartTimeRange === 'week' ? 7 : chartTimeRange === 'month' ? 30 : 365;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const minutes = activityCalendar[dateStr] || 0;

      data.push({
        date: dateStr,
        minutes,
        hours: minutes / 60,
        label:
          chartTimeRange === 'week'
            ? date.toLocaleDateString('hu-HU', { weekday: 'short' })
            : chartTimeRange === 'month'
            ? date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' })
            : date.toLocaleDateString('hu-HU', { month: 'short' }),
      });
    }

    const totalMinutes = data.reduce((sum, day) => sum + day.minutes, 0);

    return {
      timeRange: chartTimeRange,
      data,
      goal: preferences.data?.weeklyHoursGoal,
      totalMinutes,
      averagePerDay: totalMinutes / days,
    };
  };

  const chartData = generateChartData();

  // Check if user is new (no enrollments) - only after data loads to prevent flash
  const isNewUser = !statsLoading && dashboardData && dashboardData.stats.totalEnrolled === 0;

  // Get active weekly goal
  const activeGoal = goals.data?.find(g => g.goalType === 'weekly_hours' && g.status === 'active') || null;
  const currentWeekProgress = analytics.data?.learningMinutesThisWeek || 0;

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

      {/* Achievement Unlock Modal */}
      <AchievementUnlockModal
        achievement={unlockedAchievement}
        isOpen={!!unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />

      <div className="space-y-8">
        {/* Welcome Hero for New Users */}
        {isNewUser && (
          <WelcomeHero
            userName={user?.firstName || user?.displayName || 'Felhasználó'}
            hasEnrolledCourses={!isNewUser}
            isNewUser={isNewUser}
          />
        )}

        {/* Row 1: Stats Cards (4 cards now) */}
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

        {/* Row 2: Continue Learning + Goal + Quick Actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Continue Course Preview (2/3 width) */}
          <div className="lg:col-span-2">
            <ContinueCoursePreview />
          </div>

          {/* Goal Progress Widget (1/3 width) */}
          <div className="lg:col-span-1">
            <GoalProgressWidget
              goal={activeGoal}
              currentProgress={currentWeekProgress}
              isLoading={gamificationLoading}
            />
          </div>
        </div>

        {/* Row 3: Learning Hours Chart (Full Width) */}
        <LearningHoursChart
          data={chartData}
          onTimeRangeChange={setChartTimeRange}
          isLoading={gamificationLoading}
        />

        {/* Row 4: Streak Calendar + Quick Actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Streak Calendar (2/3 width) */}
          <div className="lg:col-span-2">
            <StreakCalendar
              streak={streak.data || {
                userId: user?.id || '',
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: new Date().toISOString().split('T')[0],
                activityCalendar: {},
                streakStartDate: new Date().toISOString().split('T')[0],
                totalActiveDays: 0,
                milestones: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }}
              isLoading={gamificationLoading}
            />
          </div>

          {/* Quick Actions + Recommendations (1/3 width) */}
          <div className="lg:col-span-1 space-y-4">
            <QuickActions />
            <RecommendedCourses />
          </div>
        </div>

        {/* Row 5: Achievements (Full Width) */}
        {achievements.data && (
          <AchievementGrid
            achievements={achievements.data.achievements}
            isLoading={gamificationLoading}
            onBadgeClick={(achievement) => {
              if (achievement.earnedAt) {
                // Show details or navigate to achievements page
              }
            }}
          />
        )}

        {/* Row 6: Recent Activity (Full Width) */}
        <RecentActivitySection />

        {/* Row 7: Course Table (Full Width) */}
        <CourseTable />
      </div>
    </>
  );
}
