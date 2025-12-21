'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import {
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Building2,
  Activity,
  Percent,
  UserCheck,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
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

// Format currency in Hungarian Forints
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' Ft'
}

// Format large numbers
function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  return value.toString()
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

// MRR Trend Chart
function MRRTrendChart({ data }: { data: Array<{ date: string; amount: number }> }) {
  // Format date for display (YYYY-MM to Month name)
  const formattedData = data.map((item) => ({
    ...item,
    month: new Date(item.date + '-01').toLocaleDateString('hu-HU', { month: 'short' }),
  }))

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Bevétel alakulása (12 hónap)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#112a4b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#112a4b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Bevétel']}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#112a4b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Revenue by Plan Chart
function RevenueByPlanChart({ data }: { data: { monthly: number; sixMonth: number; yearly: number } }) {
  const chartData = [
    { name: 'Havi', value: data.monthly, color: '#112a4b' },
    { name: '6 hónapos', value: data.sixMonth, color: '#1a3d6e' },
    { name: 'Éves', value: data.yearly, color: '#10B981' },
  ].filter((item) => item.value > 0)

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">MRR csomagonként</h3>
      <div className="flex items-center">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [formatCurrency(value), 'MRR']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.value)}
                </div>
                <div className="text-xs text-gray-500">
                  {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
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

// Subscription Breakdown Table
function SubscriptionBreakdown({
  subscriptions,
}: {
  subscriptions: AnalyticsData['subscriptions']
}) {
  const rows = [
    {
      type: 'Egyéni',
      count: subscriptions.individual.count,
      mrr: subscriptions.individual.mrr,
      details: 'Direkt előfizetések',
    },
    {
      type: 'Csapat',
      count: subscriptions.team.count,
      mrr: subscriptions.team.mrr,
      details: `Átl. ${subscriptions.team.avgSize} fő/csapat`,
    },
    {
      type: 'Vállalat (B2B)',
      count: subscriptions.company.count,
      mrr: subscriptions.company.mrr,
      details: `${subscriptions.company.employees} alkalmazott`,
    },
    {
      type: 'Próba időszak',
      count: subscriptions.trial.count,
      mrr: 0,
      details: 'Konvertálás alatt',
    },
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Előfizetés bontás</h3>
        <div className="text-sm text-gray-500">
          Össz: <span className="font-medium text-gray-900">{subscriptions.total}</span> előfizető
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Típus
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Darab
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                MRR
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Részletek
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.type} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-4 text-sm font-medium text-gray-900">{row.type}</td>
                <td className="py-3 px-4 text-sm text-gray-700 text-right">{row.count}</td>
                <td className="py-3 px-4 text-sm text-gray-700 text-right">
                  {row.mrr > 0 ? formatCurrency(row.mrr) : '-'}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500">{row.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {subscriptions.churn.thisMonth > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center text-amber-600">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {subscriptions.churn.thisMonth} lemondás ebben a hónapban
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Churn rate: <span className="font-medium">{subscriptions.churn.rate}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Company Metrics
function CompanyMetrics({ companies }: { companies: AnalyticsData['companies'] }) {
  const seatUtilization =
    companies.seats.purchased > 0
      ? Math.round((companies.seats.used / companies.seats.purchased) * 100)
      : 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">B2B Metrikák</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center text-gray-600 mb-2">
            <Building2 className="w-4 h-4 mr-2" />
            <span className="text-xs font-medium uppercase">Cégek</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{companies.total}</div>
          <div className="text-xs text-gray-500 mt-1">
            {companies.active} aktív, {companies.suspended} felfüggesztett
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center text-gray-600 mb-2">
            <Users className="w-4 h-4 mr-2" />
            <span className="text-xs font-medium uppercase">Alkalmazottak</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{companies.totalEmployees}</div>
          <div className="text-xs text-gray-500 mt-1">
            Átl. {companies.avgEmployees} fő/cég
          </div>
        </div>
        <div className="col-span-2 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-gray-600">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium uppercase">Masterclass helyek</span>
            </div>
            <span className="text-xs font-medium text-gray-700">{seatUtilization}% kihasználtság</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#112a4b] h-2 rounded-full transition-all"
              style={{ width: `${seatUtilization}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{companies.seats.used} foglalt</span>
            <span>{companies.seats.purchased} összes</span>
          </div>
        </div>
      </div>
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
      {/* Key Metrics - 6 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
          title="MRR"
          value={formatCurrency(data.revenue.mrr)}
          subtitle={`ARR: ${formatCurrency(data.revenue.arr)}`}
          icon={TrendingUp}
          trend={data.revenue.growth}
          iconColor="text-green-600"
          iconBg="bg-green-100"
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
        <StatCard
          title="Konverzió"
          value={`${data.conversionRate}%`}
          subtitle="Előfizető / felhasználó"
          icon={Percent}
          iconColor="text-[#112a4b]"
          iconBg="bg-[#112a4b]/10"
        />
      </div>

      {/* Revenue Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MRRTrendChart data={data.trends.revenueGrowth} />
        <RevenueByPlanChart data={data.revenue.byPlan} />
      </div>

      {/* User Growth & User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart data={data.trends.userGrowth} />
        <UserBreakdown users={data.users} />
      </div>

      {/* Subscription & Company Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubscriptionBreakdown subscriptions={data.subscriptions} />
        <CompanyMetrics companies={data.companies} />
      </div>

      {/* System Status (Collapsible) */}
      <SystemStatus
        isCollapsed={systemCollapsed}
        onToggle={() => setSystemCollapsed(!systemCollapsed)}
      />
    </div>
  )
}
