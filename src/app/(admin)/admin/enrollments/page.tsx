'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Download, 
  Upload,
  Search,
  Filter,
  GraduationCap,
  Building2
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/stores/authStore'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface EnrollmentData {
  id: string
  studentName: string
  studentEmail: string
  courseName: string
  courseId: string
  enrolledAt: string
  progress: number
  status: 'active' | 'completed' | 'dropped'
  universityName?: string
  department?: string
}

interface EnrollmentStats {
  totalEnrollments: number
  activeEnrollments: number
  completedCourses: number
  droppedCourses: number
  averageProgress: number
  monthlyGrowth: number
}

// Mock data for demo
const mockEnrollments: EnrollmentData[] = [
  {
    id: '1',
    studentName: 'Nagy Anna',
    studentEmail: 'nagy.anna@university.hu',
    courseName: 'Adatbázis-kezelés alapjai',
    courseId: 'db-101',
    enrolledAt: '2024-01-15',
    progress: 75,
    status: 'active',
    universityName: 'Budapesti Műszaki Egyetem',
    department: 'Informatikai Kar'
  },
  {
    id: '2',
    studentName: 'Kovács Péter',
    studentEmail: 'kovacs.peter@university.hu',
    courseName: 'Web programozás haladóknak',
    courseId: 'web-201',
    enrolledAt: '2024-01-10',
    progress: 100,
    status: 'completed',
    universityName: 'ELTE',
    department: 'Informatikai Kar'
  },
  {
    id: '3',
    studentName: 'Szabó Márta',
    studentEmail: 'szabo.marta@university.hu',
    courseName: 'Python programozás',
    courseId: 'py-101',
    enrolledAt: '2024-02-01',
    progress: 45,
    status: 'active',
    universityName: 'Szegedi Tudományegyetem',
    department: 'TTK'
  }
]

const mockStats: EnrollmentStats = {
  totalEnrollments: 3567,
  activeEnrollments: 2843,
  completedCourses: 524,
  droppedCourses: 200,
  averageProgress: 68.5,
  monthlyGrowth: 12.5
}

export default function AdminEnrollmentsPage() {
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  // For demo, use mock data
  const enrollments = mockEnrollments
  const stats = mockStats
  const isLoading = false

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         enrollment.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || enrollment.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Aktív', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Befejezett', className: 'bg-brand-secondary/10 text-brand-secondary-hover' },
      dropped: { label: 'Lemorzsolódott', className: 'bg-red-100 text-red-800' }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (user?.role !== 'ADMIN') {
    return <div>Nincs jogosultsága az oldal megtekintéséhez</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beiratkozások Kezelése</h1>
          <p className="text-muted-foreground mt-1">Hallgatói beiratkozások nyomon követése és kezelése</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Tömeges Import
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportálás
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes Beiratkozás</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats.monthlyGrowth}%</span> ebben a hónapban
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktív Hallgatók</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEnrollments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Jelenleg tanuló</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Befejezett</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}</div>
            <p className="text-xs text-muted-foreground">Sikeres elvégzés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lemorzsolódás</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.droppedCourses}</div>
            <p className="text-xs text-muted-foreground text-red-600">5.6% arány</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlag Haladás</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">Tartalmanként</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egyetemek</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Partner intézmény</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Beiratkozások Szűrése</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Keresés név, email vagy tartalom alapján..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Minden státusz</option>
              <option value="active">Aktív</option>
              <option value="completed">Befejezett</option>
              <option value="dropped">Lemorzsolódott</option>
            </select>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              További szűrők
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Beiratkozások Listája</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Hallgató</th>
                    <th className="text-left p-2">Tartalom</th>
                    <th className="text-left p-2">Egyetem</th>
                    <th className="text-left p-2">Beiratkozás</th>
                    <th className="text-left p-2">Haladás</th>
                    <th className="text-left p-2">Státusz</th>
                    <th className="text-left p-2">Műveletek</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{enrollment.studentName}</div>
                          <div className="text-sm text-muted-foreground">{enrollment.studentEmail}</div>
                        </div>
                      </td>
                      <td className="p-2">{enrollment.courseName}</td>
                      <td className="p-2">
                        <div>
                          <div className="text-sm">{enrollment.universityName}</div>
                          <div className="text-xs text-muted-foreground">{enrollment.department}</div>
                        </div>
                      </td>
                      <td className="p-2 text-sm">
                        {new Date(enrollment.enrolledAt).toLocaleDateString('hu-HU')}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full"
                              style={{ width: `${enrollment.progress}%` }}
                            />
                          </div>
                          <span className="text-sm">{enrollment.progress}%</span>
                        </div>
                      </td>
                      <td className="p-2">{getStatusBadge(enrollment.status)}</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">Részletek</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}