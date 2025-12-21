'use client'

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions, db } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { hu } from 'date-fns/locale'
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Building2,
  Activity,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  BookOpen,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

// API call
const getAdminAnalytics = httpsCallable(functions, 'getAdminAnalytics')

// Types
interface AnalyticsData {
  users: {
    total: number
    byRole: { students: number; instructors: number; admins: number }
    activeToday: number
    newThisMonth: number
    verified: number
    unverified: number
    growth: number
  }
  subscriptions: {
    individual: { count: number; mrr: number }
    team: { count: number; avgSize: number; mrr: number }
    company: { count: number; employees: number; mrr: number }
    trial: { count: number }
    churn: { thisMonth: number; rate: number }
    total: number
  }
  revenue: {
    mrr: number
    arr: number
    thisMonth: number
    lastMonth: number
    growth: number
    byPlan: { monthly: number; sixMonth: number; yearly: number }
  }
  companies: {
    total: number
    active: number
    suspended: number
    totalEmployees: number
    avgEmployees: number
    seats: { purchased: number; used: number }
  }
  trends: {
    userGrowth: Array<{ date: string; count: number }>
    revenueGrowth: Array<{ date: string; amount: number }>
  }
  conversionRate: number
}

// Activity types
interface ActivityItem {
  id: string
  type: 'registration' | 'enrollment' | 'payment'
  description: string
  timestamp: Date
  metadata?: {
    email?: string
    courseName?: string
    amount?: number
  }
}

// Format currency in Hungarian Forints
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' Ft'
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconColor = 'text-gray-600',
  iconBg = 'bg-gray-100',
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  trend?: number
  trendLabel?: string
  iconColor?: string
  iconBg?: string
}) {
  const isPositiveTrend = trend !== undefined && trend >= 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-lg', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              'flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
              isPositiveTrend
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            {isPositiveTrend ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-3xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600 mt-1">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
        {trendLabel && (
          <div className="text-xs text-gray-500 mt-1">{trendLabel}</div>
        )}
      </div>
    </div>
  )
}

// Live Activity Section
function LiveActivitySection() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Users (registrations) listener
    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    // Enrollments listener
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('enrolledAt', '>=', twentyFourHoursAgo),
      orderBy('enrolledAt', 'desc'),
      limit(20)
    )

    // Payments listener
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('status', '==', 'completed'),
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    let userActivities: ActivityItem[] = []
    let enrollmentActivities: ActivityItem[] = []
    let paymentActivities: ActivityItem[] = []

    const updateMergedActivities = () => {
      const merged = [...userActivities, ...enrollmentActivities, ...paymentActivities]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 15)
      setActivities(merged)
      setIsLoading(false)
    }

    // Users listener
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      userActivities = snapshot.docs.map((doc) => {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt)
        return {
          id: `user-${doc.id}`,
          type: 'registration' as const,
          description: `Új regisztráció: ${data.email || data.displayName || 'Ismeretlen'}`,
          timestamp: createdAt,
          metadata: { email: data.email },
        }
      })
      updateMergedActivities()
    }, (error) => {
      console.error('Error fetching user activities:', error)
      setIsLoading(false)
    })

    // Enrollments listener
    const unsubEnrollments = onSnapshot(enrollmentsQuery, (snapshot) => {
      enrollmentActivities = snapshot.docs.map((doc) => {
        const data = doc.data()
        const enrolledAt = data.enrolledAt?.toDate?.() || new Date(data.enrolledAt)
        const userName = data.userName || data.userEmail?.split('@')[0] || 'Felhasználó'
        const courseName = data.courseName || data.courseTitle || 'kurzus'
        return {
          id: `enrollment-${doc.id}`,
          type: 'enrollment' as const,
          description: `${userName} beiratkozott: ${courseName}`,
          timestamp: enrolledAt,
          metadata: {
            courseName: data.courseName || data.courseTitle,
            email: data.userEmail,
          },
        }
      })
      updateMergedActivities()
    }, (error) => {
      console.error('Error fetching enrollment activities:', error)
    })

    // Payments listener
    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      paymentActivities = snapshot.docs.map((doc) => {
        const data = doc.data()
        const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt)
        const amount = data.amount || data.totalAmount || 0
        return {
          id: `payment-${doc.id}`,
          type: 'payment' as const,
          description: `Sikeres fizetés: ${formatCurrency(amount)}`,
          timestamp: createdAt,
          metadata: { amount },
        }
      })
      updateMergedActivities()
    }, (error) => {
      console.error('Error fetching payment activities:', error)
    })

    return () => {
      unsubUsers()
      unsubEnrollments()
      unsubPayments()
    }
  }, [])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'registration':
        return <UserPlus className="w-4 h-4 text-blue-600" />
      case 'enrollment':
        return <BookOpen className="w-4 h-4 text-green-600" />
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />
    }
  }

  const getActivityBg = (type: ActivityItem['type']) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-50'
      case 'enrollment':
        return 'bg-green-50'
      case 'payment':
        return 'bg-emerald-50'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-bold text-gray-900">Legutóbbi aktivitások</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-green-600 uppercase tracking-wide">LIVE</span>
        </div>
      </div>

      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <Activity className="w-8 h-8 mb-2 text-gray-400" />
            <p className="text-sm">Nincs aktivitás az elmúlt 24 órában</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={cn('p-2 rounded-lg', getActivityBg(activity.type))}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: false, locale: hu })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// User Growth Chart
function UserGrowthChart({ data }: { data: Array<{ date: string; count: number }> }) {
  // Format date for display
  const formattedData = data.map((item) => ({
    ...item,
    day: new Date(item.date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Új regisztrációk (30 nap)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: '#6B7280', fontSize: 10 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [value, 'Új felhasználó']}
          />
          <Bar dataKey="count" fill="#112a4b" radius={[4, 4, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// User Breakdown
function UserBreakdown({ users }: { users: AnalyticsData['users'] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Felhasználók bontása</h3>
      <div className="space-y-4">
        {/* By Role */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Szerepkör szerint</div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-3 bg-[#112a4b]/5 rounded-lg">
              <div className="text-xl font-bold text-[#112a4b]">{users.byRole.students}</div>
              <div className="text-xs text-gray-600">Hallgató</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{users.byRole.instructors}</div>
              <div className="text-xs text-gray-600">Oktató</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-xl font-bold text-amber-600">{users.byRole.admins}</div>
              <div className="text-xs text-gray-600">Admin</div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Email státusz</div>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Megerősített</span>
                <span className="text-xs font-medium text-green-600">{users.verified}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    width: `${users.total > 0 ? (users.verified / users.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Nem megerősített</span>
                <span className="text-xs font-medium text-gray-500">{users.unverified}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gray-400 h-1.5 rounded-full"
                  style={{
                    width: `${users.total > 0 ? (users.unverified / users.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// System Status (Collapsible)
function SystemStatus({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <h3 className="text-lg font-bold text-gray-900">Rendszer állapot</h3>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {!isCollapsed && (
        <div className="px-6 pb-6 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <div>
                <div className="text-xs text-gray-500">Adatbázis</div>
                <div className="text-sm font-medium text-gray-900">Működik</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <div>
                <div className="text-xs text-gray-500">Cloud Functions</div>
                <div className="text-sm font-medium text-gray-900">Működik</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <div>
                <div className="text-xs text-gray-500">Hitelesítés</div>
                <div className="text-sm font-medium text-gray-900">Működik</div>
              </div>
            </div>
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
              <div>
                <div className="text-xs text-gray-500">Tárhely</div>
                <div className="text-sm font-medium text-gray-900">Működik</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Main Dashboard Component
export function AnalyticsDashboard() {
  const [systemCollapsed, setSystemCollapsed] = React.useState(true)

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const result = await getAdminAnalytics()
      const response = result.data as { success: boolean; data?: AnalyticsData; error?: string }
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch analytics')
      }
      return response.data as AnalyticsData
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider fresh for 30 seconds
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#112a4b] mx-auto mb-4" />
          <p className="text-gray-500">Analytics betöltése...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-medium">Hiba az analytics betöltésekor</p>
        <p className="text-red-600 text-sm mt-1">
          {error instanceof Error ? error.message : 'Ismeretlen hiba'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Összes felhasználó"
          value={data.users.total}
          subtitle={`+${data.users.newThisMonth} ebben a hónapban`}
          icon={Users}
          trend={data.users.growth}
          iconColor="text-[#112a4b]"
          iconBg="bg-[#112a4b]/10"
        />
        <StatCard
          title="Aktív előfizetők"
          value={data.subscriptions.total}
          subtitle={`${data.subscriptions.trial.count} próba időszakban`}
          icon={CreditCard}
          iconColor="text-[#112a4b]"
          iconBg="bg-[#112a4b]/10"
        />
        <StatCard
          title="Vállalatok"
          value={data.companies.total}
          subtitle={`${data.companies.totalEmployees} alkalmazott`}
          icon={Building2}
          iconColor="text-[#112a4b]"
          iconBg="bg-[#112a4b]/10"
        />
        <StatCard
          title="Aktív ma"
          value={data.users.activeToday}
          subtitle="Bejelentkezett"
          icon={Activity}
          iconColor="text-[#112a4b]"
          iconBg="bg-[#112a4b]/10"
        />
      </div>

      {/* Live Activity Section */}
      <LiveActivitySection />

      {/* User Growth & User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={data.trends.userGrowth} />
        <UserBreakdown users={data.users} />
      </div>

      {/* System Status (Collapsible) */}
      <SystemStatus
        isCollapsed={systemCollapsed}
        onToggle={() => setSystemCollapsed(!systemCollapsed)}
      />
    </div>
  )
}
