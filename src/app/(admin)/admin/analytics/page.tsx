'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import { VideoAnalyticsDashboard } from '@/components/analytics/VideoAnalyticsDashboard'
import { useUserGrowthData, useCourseEnrollmentData } from '@/hooks/useAdminDashboardCharts'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video, Users, BookOpen, TrendingUp, Activity, Clock } from 'lucide-react'

export default function AdminAnalyticsPage() {
  // Simple client-side admin guard
  const { user } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  
  if (user?.role !== 'ADMIN') {
    router.push('/admin')
    return null
  }

  const {
    data: userGrowth,
    isLoading: userGrowthLoading,
    error: userGrowthError,
  } = useUserGrowthData()

  const {
    data: courseEnrollment,
    isLoading: courseEnrollLoading,
    error: courseEnrollError,
  } = useCourseEnrollmentData()

  const colors = ['#4f46e5', '#16a34a', '#dc2626', '#ca8a04', '#0ea5e9', '#7c3aed']

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Részletes Analitika</h1>
              <p className="text-purple-100 text-lg">
                Platform teljesítmény, felhasználói aktivitás és oktatási metrikák
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/50 backdrop-blur-sm p-1">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4" />
            Áttekintés
          </TabsTrigger>
          <TabsTrigger 
            value="video" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Video className="w-4 h-4" />
            Videó
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            <Users className="w-4 h-4" />
            Felhasználók
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Platform Növekedés</h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-100 text-indigo-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                Növekedés
              </Badge>
            </div>
          </div>

          {/* User Growth Chart */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Havi új felhasználók</span>
                <Badge variant="outline" className="text-xs">
                  Utolsó 12 hónap
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWrapper
                isLoading={userGrowthLoading}
                error={userGrowthError as Error | null}
              >
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowth} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-600" />
                      <YAxis allowDecimals={false} className="text-gray-600" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="newUsers" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        dot={{ fill: '#6366f1', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </CardContent>
          </Card>

          {/* Course Enrollment Chart */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Top tartalom beiratkozások</span>
                <Badge className="bg-green-100 text-green-700">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Tartalmak
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartWrapper
                isLoading={courseEnrollLoading}
                error={courseEnrollError as Error | null}
              >
                <div className="h-[400px] w-full overflow-x-auto">
                  {courseEnrollment.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
                        <p className="text-muted-foreground">Még nincsenek beiratkozási adatok</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={courseEnrollment} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis 
                          dataKey="courseName" 
                          tick={{ fontSize: 11 }} 
                          interval={0} 
                          angle={-15} 
                          textAnchor="end" 
                          height={60}
                          className="text-gray-600" 
                        />
                        <YAxis allowDecimals={false} className="text-gray-600" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                          }} 
                        />
                        <Legend />
                        <Bar 
                          dataKey="enrollments" 
                          fill="#10b981"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-8">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Videó Analitika</h2>
            <Badge className="bg-purple-100 text-purple-700">
              <Video className="w-3 h-3 mr-1" />
              30 napos időszak
            </Badge>
          </div>
          
          <VideoAnalyticsDashboard timeRange="30d" />
        </TabsContent>

        <TabsContent value="users" className="space-y-8">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Felhasználói Metrikák</h2>
            <Badge className="bg-brand-secondary/10 text-brand-secondary-hover">
              <Users className="w-3 h-3 mr-1" />
              Részletes elemzés
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Felhasználói növekedés</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartWrapper
                  isLoading={userGrowthLoading}
                  error={userGrowthError as Error | null}
                >
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={userGrowth} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-600" />
                        <YAxis allowDecimals={false} className="text-gray-600" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="newUsers" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartWrapper>
              </CardContent>
            </Card>
            
            {/* User Activity Stats */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Felhasználói aktivitás</span>
                  <Badge variant="outline" className="text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    Élő
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-brand-secondary/5 to-indigo-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Aktív felhasználók</p>
                        <p className="text-2xl font-bold text-gray-900">1,234</p>
                      </div>
                      <div className="w-10 h-10 bg-brand-secondary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-brand-secondary" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Elmúlt 7 napban</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Átlagos munkamenet</p>
                        <p className="text-2xl font-bold text-gray-900">18 perc</p>
                      </div>
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">+3 perc az előző hónaphoz képest</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Visszatérő felhasználók</p>
                        <p className="text-2xl font-bold text-gray-900">68.5%</p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Magas elköteleződési ráta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 