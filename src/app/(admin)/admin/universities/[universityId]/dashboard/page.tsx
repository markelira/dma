'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, BarChart, Users, Wallet } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { useParams } from 'next/navigation'

interface UniversityStats {
  courseCount: number
  totalEnrollments: number
  studentCount: number
  totalRevenue: number
}

export default function UniversityDashboardPage() {
  const params = useParams<{ universityId: string }>()
  const universityId = params.universityId

  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<UniversityStats, Error>({
    queryKey: ['universityDashboardStats', universityId],
    queryFn: async () => {
      if (!universityId) throw new Error('Missing university ID')
      
      // For now, return default stats since we don't have university dashboard endpoint yet
      // TODO: Implement getUniversityDashboardStats Cloud Function
      return {
        courseCount: 5,
        totalEnrollments: 150,
        studentCount: 120,
        totalRevenue: 150000
      }
    },
    enabled: !!universityId,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <div className="text-destructive">Hiba: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Egyetem Vezérlőpult</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tartalmak</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.courseCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beiratkozások</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEnrollments ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hallgatók</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.studentCount ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bevétel</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats?.totalRevenue ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Jelenleg szimulált adat</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 