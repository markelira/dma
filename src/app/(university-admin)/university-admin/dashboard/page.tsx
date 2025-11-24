'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  School,
  UserCheck,
  GraduationCap,
  Calendar,
  Activity,
  CreditCard,
  Award,
  BarChart
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  activeEnrollments: number;
  monthlyRevenue: number;
  completionRate: number;
  averageRating: number;
  pendingPayments: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'course' | 'payment' | 'completion';
  title: string;
  description: string;
  timestamp: Date;
  icon: any;
}

export default function UniversityAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    averageRating: 0,
    pendingPayments: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.universityId) return;

    // Load university-specific stats
    const loadStats = async () => {
      try {
        // Load students count
        const studentsQuery = query(
          collection(db, 'users'),
          where('universityId', '==', user.universityId),
          where('role', '==', 'STUDENT')
        );
        
        // Load instructors count  
        const instructorsQuery = query(
          collection(db, 'users'),
          where('universityId', '==', user.universityId),
          where('role', '==', 'INSTRUCTOR')
        );

        // Load courses count
        const coursesQuery = query(
          collection(db, 'courses'),
          where('universityId', '==', user.universityId)
        );

        // Load enrollments
        const enrollmentsQuery = query(
          collection(db, 'enrollments'),
          where('universityId', '==', user.universityId),
          where('status', '==', 'ACTIVE')
        );

        // Set up real-time listeners
        const unsubscribeStudents = onSnapshot(studentsQuery, 
          (snapshot) => {
            setStats(prev => ({ ...prev, totalStudents: snapshot.size }));
          },
          (error) => {
            console.error('Error loading students:', error);
            setStats(prev => ({ ...prev, totalStudents: 0 }));
          }
        );

        const unsubscribeInstructors = onSnapshot(instructorsQuery, 
          (snapshot) => {
            setStats(prev => ({ ...prev, totalInstructors: snapshot.size }));
          },
          (error) => {
            console.error('Error loading instructors:', error);
            setStats(prev => ({ ...prev, totalInstructors: 0 }));
          }
        );

        const unsubscribeCourses = onSnapshot(coursesQuery, 
          (snapshot) => {
            setStats(prev => ({ ...prev, totalCourses: snapshot.size }));
          },
          (error) => {
            console.error('Error loading courses:', error);
            setStats(prev => ({ ...prev, totalCourses: 0 }));
          }
        );

        const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, 
          (snapshot) => {
            setStats(prev => ({ ...prev, activeEnrollments: snapshot.size }));
          },
          (error) => {
            console.error('Error loading enrollments:', error);
            setStats(prev => ({ ...prev, activeEnrollments: 0 }));
          }
        );

        // Load recent activities
        const activitiesQuery = query(
          collection(db, 'auditLogs'),
          where('universityId', '==', user.universityId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );

        const unsubscribeActivities = onSnapshot(activitiesQuery, 
          (snapshot) => {
            const activities: RecentActivity[] = snapshot.docs.map(doc => {
              const data = doc.data();
              let type: 'enrollment' | 'course' | 'payment' | 'completion' = 'enrollment';
              let icon = School;
              
              if (data.action.includes('ENROLL')) {
                type = 'enrollment';
                icon = GraduationCap;
              } else if (data.action.includes('COURSE')) {
                type = 'course';
                icon = BookOpen;
              } else if (data.action.includes('PAYMENT')) {
                type = 'payment';
                icon = CreditCard;
              } else if (data.action.includes('COMPLETE')) {
                type = 'completion';
                icon = Award;
              }

              return {
                id: doc.id,
                type,
                title: data.action,
                description: `${data.userName} - ${data.resource}`,
                timestamp: data.createdAt?.toDate() || new Date(),
                icon
              };
            });
            setRecentActivities(activities);
            setLoading(false);
          },
          (error) => {
            console.error('Error loading activities:', error);
            setRecentActivities([]);
            setLoading(false);
          }
        );

        // Cleanup
        return () => {
          unsubscribeStudents();
          unsubscribeInstructors();
          unsubscribeCourses();
          unsubscribeEnrollments();
          unsubscribeActivities();
        };
      } catch (error) {
        console.error('Error loading stats:', error);
        toast.error('Hiba történt az adatok betöltésekor');
        setLoading(false);
      }
    };

    loadStats();
  }, [user?.universityId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (activity: RecentActivity) => {
    const Icon = activity.icon;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Egyetem Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Üdvözöljük az egyetem adminisztrációs felületén
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hallgatók</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Aktív hallgatók száma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oktatók</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstructors}</div>
            <p className="text-xs text-muted-foreground">
              Aktív oktatók száma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tartalmak</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Összes tartalom
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beiratkozások</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Aktív beiratkozások
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Performance Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Havi bevétel</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <div className="flex items-center pt-1">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-500">+12% az előző hónaphoz képest</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Befejezési arány</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Átlagos tartalom befejezési arány
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlag értékelés</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Tartalmak átlagos értékelése
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Legutóbbi tevékenységek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {getActivityIcon(activity)}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString('hu-HU')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Gyors műveletek</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/university-admin/courses/create">
              <Button className="w-full justify-start gap-2" variant="outline">
                <BookOpen className="h-4 w-4" />
                Új tartalom létrehozása
              </Button>
            </Link>
            <Link href="/university-admin/instructors/invite">
              <Button className="w-full justify-start gap-2" variant="outline">
                <UserCheck className="h-4 w-4" />
                Oktató meghívása
              </Button>
            </Link>
            <Link href="/university-admin/reports">
              <Button className="w-full justify-start gap-2" variant="outline">
                <BarChart className="h-4 w-4" />
                Jelentések megtekintése
              </Button>
            </Link>
            <Link href="/university-admin/finance">
              <Button className="w-full justify-start gap-2" variant="outline">
                <DollarSign className="h-4 w-4" />
                Pénzügyek kezelése
              </Button>
            </Link>
            <Link href="/university-admin/settings">
              <Button className="w-full justify-start gap-2" variant="outline">
                <School className="h-4 w-4" />
                Egyetem beállítások
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}