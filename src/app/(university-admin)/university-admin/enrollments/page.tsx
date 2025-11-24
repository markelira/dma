'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  MoreVertical,
  Download,
  Filter
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Enrollment {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  instructorName?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  progress: number;
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessedAt?: Date;
  paymentAmount?: number;
  paymentMethod?: string;
  certificateIssued?: boolean;
}

export default function UniversityAdminEnrollmentsPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [stats, setStats] = useState({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completedEnrollments: 0,
    totalRevenue: 0,
    averageProgress: 0,
    completionRate: 0
  });

  useEffect(() => {
    if (!user?.universityId) return;

    // Load enrollments for this university
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      where('universityId', '==', user.universityId),
      orderBy('enrolledAt', 'desc')
    );

    const unsubscribe = onSnapshot(enrollmentsQuery, 
      async (snapshot) => {
        const enrollmentsData: Enrollment[] = [];
        const uniqueCourses = new Map<string, string>();
        let totalRevenue = 0;
        let totalProgress = 0;

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          // Get student details
          let studentName = 'Unknown Student';
          let studentEmail = '';
          if (data.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', data.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                studentName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email;
                studentEmail = userData.email || '';
              }
            } catch (err) {
              console.error('Error fetching user data:', err);
            }
          }

          // Get course details
          let courseTitle = 'Unknown Course';
          let instructorName = '';
          if (data.courseId) {
            try {
              const courseDoc = await getDoc(doc(db, 'courses', data.courseId));
              if (courseDoc.exists()) {
                const courseData = courseDoc.data();
                courseTitle = courseData.title || 'Unknown Course';
                uniqueCourses.set(data.courseId, courseTitle);
                
                // Get instructor name
                if (courseData.instructorId) {
                  try {
                    const instructorDoc = await getDoc(doc(db, 'users', courseData.instructorId));
                    if (instructorDoc.exists()) {
                      const instructorData = instructorDoc.data();
                      instructorName = `${instructorData.firstName || ''} ${instructorData.lastName || ''}`.trim();
                    }
                  } catch (err) {
                    console.error('Error fetching instructor data:', err);
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching course data:', err);
            }
          }

          totalRevenue += data.paymentAmount || 0;
          totalProgress += data.progress || 0;

          enrollmentsData.push({
            id: docSnapshot.id,
            userId: data.userId,
            studentName,
            studentEmail,
            courseId: data.courseId,
            courseTitle,
            instructorName,
            status: data.status || 'PENDING',
            progress: data.progress || 0,
            enrolledAt: data.enrolledAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate(),
            lastAccessedAt: data.lastAccessedAt?.toDate(),
            paymentAmount: data.paymentAmount || 0,
            paymentMethod: data.paymentMethod,
            certificateIssued: data.certificateIssued || false
          });
        }

        // Calculate stats
        const totalEnrollments = enrollmentsData.length;
        const activeEnrollments = enrollmentsData.filter(e => e.status === 'ACTIVE').length;
        const completedEnrollments = enrollmentsData.filter(e => e.status === 'COMPLETED').length;
        const averageProgress = totalEnrollments > 0 ? totalProgress / totalEnrollments : 0;
        const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

        setStats({
          totalEnrollments,
          activeEnrollments,
          completedEnrollments,
          totalRevenue,
          averageProgress,
          completionRate
        });

        setEnrollments(enrollmentsData);
        setFilteredEnrollments(enrollmentsData);
        setCourses(Array.from(uniqueCourses, ([id, title]) => ({ id, title })));
        setLoading(false);
      }, 
      (error) => {
        console.error('Error loading enrollments:', error);
        // Ha nincs még index, akkor üres listával dolgozunk
        if (error.code === 'failed-precondition') {
          console.log('Firestore index required for this query');
        }
        setEnrollments([]);
        setFilteredEnrollments([]);
        setStats({
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          totalRevenue: 0,
          averageProgress: 0,
          completionRate: 0
        });
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user?.universityId]);

  // Filter enrollments
  useEffect(() => {
    let filtered = enrollments;

    if (searchQuery) {
      filtered = filtered.filter(enrollment =>
        enrollment.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        enrollment.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }

    if (courseFilter !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.courseId === courseFilter);
    }

    setFilteredEnrollments(filtered);
  }, [searchQuery, statusFilter, courseFilter, enrollments]);

  const handleCancelEnrollment = async (enrollmentId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a beiratkozást?')) return;

    try {
      await updateDoc(doc(db, 'enrollments', enrollmentId), {
        status: 'CANCELLED',
        cancelledAt: new Date()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'CANCEL_ENROLLMENT',
        resource: 'Enrollment',
        resourceId: enrollmentId,
        universityId: user?.universityId,
        severity: 'MEDIUM',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Beiratkozás törölve');
    } catch (error) {
      console.error('Error cancelling enrollment:', error);
      toast.error('Hiba történt a beiratkozás törlésekor');
    }
  };

  const handleIssueCertificate = async (enrollmentId: string) => {
    try {
      await updateDoc(doc(db, 'enrollments', enrollmentId), {
        certificateIssued: true,
        certificateIssuedAt: new Date()
      });

      toast.success('Tanúsítvány kiállítva');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Hiba történt a tanúsítvány kiállításakor');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-800">Aktív</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Befejezett</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Törölt</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Függőben</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 50) return 'text-blue-600';
    if (progress >= 20) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const exportToCSV = () => {
    const headers = ['Hallgató', 'Email', 'Kurzus', 'Oktató', 'Státusz', 'Haladás', 'Beiratkozás dátuma', 'Fizetett összeg'];
    const rows = filteredEnrollments.map(e => [
      e.studentName,
      e.studentEmail,
      e.courseTitle,
      e.instructorName || 'N/A',
      e.status,
      `${e.progress}%`,
      new Date(e.enrolledAt).toLocaleDateString('hu-HU'),
      e.paymentAmount ? `${e.paymentAmount.toLocaleString()} Ft` : '0 Ft'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `beiratkozasok_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Beiratkozások kezelése</h1>
          <p className="text-muted-foreground">
            Az egyetem összes beiratkozásának áttekintése
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktív</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Befejezett</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedEnrollments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bevétel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} Ft</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Átlag haladás</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress.toFixed(0)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Befejezési arány</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completionRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Keresés hallgató vagy tartalom alapján..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Státusz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden státusz</SelectItem>
                <SelectItem value="ACTIVE">Aktív</SelectItem>
                <SelectItem value="COMPLETED">Befejezett</SelectItem>
                <SelectItem value="CANCELLED">Törölt</SelectItem>
                <SelectItem value="PENDING">Függőben</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tartalom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden tartalom</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hallgató</TableHead>
                <TableHead>Tartalom</TableHead>
                <TableHead>Oktató</TableHead>
                <TableHead>Haladás</TableHead>
                <TableHead>Beiratkozás</TableHead>
                <TableHead>Utolsó aktivitás</TableHead>
                <TableHead>Fizetés</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{enrollment.studentName}</div>
                      <div className="text-sm text-muted-foreground">{enrollment.studentEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{enrollment.courseTitle}</TableCell>
                  <TableCell>{enrollment.instructorName || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <span className={`text-sm font-medium ${getProgressColor(enrollment.progress)}`}>
                        {enrollment.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(enrollment.enrolledAt).toLocaleDateString('hu-HU')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {enrollment.lastAccessedAt ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {new Date(enrollment.lastAccessedAt).toLocaleDateString('hu-HU')}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {enrollment.paymentAmount ? (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        {enrollment.paymentAmount.toLocaleString()} Ft
                      </div>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Ingyenes</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Műveletek</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Users className="mr-2 h-4 w-4" />
                          Hallgató megtekintése
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Tartalom megtekintése
                        </DropdownMenuItem>
                        {enrollment.status === 'COMPLETED' && !enrollment.certificateIssued && (
                          <DropdownMenuItem onClick={() => handleIssueCertificate(enrollment.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Tanúsítvány kiállítása
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {enrollment.status === 'ACTIVE' && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleCancelEnrollment(enrollment.id)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Beiratkozás törlése
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}