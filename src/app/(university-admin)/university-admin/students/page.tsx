'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Search,
  Mail,
  Phone,
  MoreVertical,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, getDocs, addDoc } from 'firebase/firestore';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  studentId?: string;
  profilePictureUrl?: string;
  enrollmentCount: number;
  completedCourses: number;
  averageGrade?: number;
  totalSpentTime?: number;
  status: 'active' | 'inactive' | 'suspended';
  universityId: string;
  department?: string;
  registeredAt?: Date;
  lastActive?: Date;
}

export default function UniversityAdminStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.universityId) return;

    // Load students for this university
    const studentsQuery = query(
      collection(db, 'users'),
      where('universityId', '==', user.universityId),
      where('role', '==', 'STUDENT'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(studentsQuery, 
      async (snapshot) => {
        const studentsData: Student[] = [];
        const uniqueDepartments = new Set<string>();

        for (const docSnapshot of snapshot.docs) {
          const data = docSnapshot.data();
          
          // Get enrollment count for each student
          const enrollmentsQuery = query(
            collection(db, 'enrollments'),
            where('userId', '==', docSnapshot.id),
            where('universityId', '==', user.universityId)
          );
          
          try {
            const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
            const enrollmentCount = enrollmentsSnapshot.size;
            const completedCourses = enrollmentsSnapshot.docs.filter(
              doc => doc.data().status === 'COMPLETED'
            ).length;

            if (data.department) {
              uniqueDepartments.add(data.department);
            }
            
            studentsData.push({
              id: docSnapshot.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone,
              studentId: data.studentId,
              profilePictureUrl: data.profilePictureUrl,
              enrollmentCount,
              completedCourses,
              averageGrade: data.averageGrade || 0,
              totalSpentTime: data.totalSpentTime || 0,
              status: data.status || 'active',
              universityId: data.universityId,
              department: data.department,
              registeredAt: data.createdAt?.toDate() || new Date(),
              lastActive: data.lastActive?.toDate()
            });
          } catch (enrollmentError) {
            console.error('Error getting enrollment data:', enrollmentError);
            // Ha hiba van az enrollment lekérdezéskor, akkor 0-val dolgozunk
            studentsData.push({
              id: docSnapshot.id,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              phone: data.phone,
              studentId: data.studentId,
              profilePictureUrl: data.profilePictureUrl,
              enrollmentCount: 0,
              completedCourses: 0,
              averageGrade: data.averageGrade || 0,
              totalSpentTime: data.totalSpentTime || 0,
              status: data.status || 'active',
              universityId: data.universityId,
              department: data.department,
              registeredAt: data.createdAt?.toDate() || new Date(),
              lastActive: data.lastActive?.toDate()
            });
          }
        }

        setStudents(studentsData);
        setFilteredStudents(studentsData);
        setDepartments(Array.from(uniqueDepartments));
        setLoading(false);
      }, 
      (error) => {
        console.error('Error loading students:', error);
        // Ha nincs még index, akkor üres listával dolgozunk
        if (error.code === 'failed-precondition') {
          console.log('Firestore index required for this query');
        }
        setStudents([]);
        setFilteredStudents([]);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user?.universityId]);

  // Filter students
  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(student => student.department === departmentFilter);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, statusFilter, departmentFilter, students]);

  const handleSuspendStudent = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), {
        status: 'suspended',
        suspendedAt: new Date()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'SUSPEND_STUDENT',
        resource: 'User',
        resourceId: studentId,
        universityId: user?.universityId,
        severity: 'HIGH',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Hallgató felfüggesztve');
    } catch (error) {
      console.error('Error suspending student:', error);
      toast.error('Hiba történt a hallgató felfüggesztésekor');
    }
  };

  const handleReactivateStudent = async (studentId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), {
        status: 'active',
        reactivatedAt: new Date()
      });

      toast.success('Hallgató újraaktiválva');
    } catch (error) {
      console.error('Error reactivating student:', error);
      toast.error('Hiba történt a hallgató újraaktiválásakor');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktív</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inaktív</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Felfüggesztve</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ó ${mins}p`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hallgatók kezelése</h1>
          <p className="text-muted-foreground">
            Az egyetem hallgatóinak áttekintése és kezelése
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes hallgató</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aktív</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes beiratkozás</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-secondary">
              {students.reduce((sum, s) => sum + s.enrollmentCount, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Befejezett tartalmak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {students.reduce((sum, s) => sum + s.completedCourses, 0)}
            </div>
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
                placeholder="Keresés név, email vagy neptun kód alapján..."
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
                <SelectItem value="active">Aktív</SelectItem>
                <SelectItem value="inactive">Inaktív</SelectItem>
                <SelectItem value="suspended">Felfüggesztett</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tanszék" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden tanszék</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hallgató</TableHead>
                <TableHead>Neptun kód</TableHead>
                <TableHead>Tanszék</TableHead>
                <TableHead>Beiratkozások</TableHead>
                <TableHead>Befejezett</TableHead>
                <TableHead>Átlag</TableHead>
                <TableHead>Idő</TableHead>
                <TableHead>Regisztráció</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.profilePictureUrl} />
                        <AvatarFallback>
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.studentId || 'N/A'}</TableCell>
                  <TableCell>{student.department || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      {student.enrollmentCount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4 text-green-500" />
                      {student.completedCourses}
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.averageGrade > 0 ? (
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-white0" />
                        {student.averageGrade.toFixed(1)}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {student.totalSpentTime > 0 ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatTime(student.totalSpentTime)}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {student.registeredAt ? 
                      new Date(student.registeredAt).toLocaleDateString('hu-HU') :
                      'N/A'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
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
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Profil megtekintése
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Tartalmak megtekintése
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Email küldése
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {student.status === 'suspended' ? (
                          <DropdownMenuItem onClick={() => handleReactivateStudent(student.id)}>
                            <GraduationCap className="mr-2 h-4 w-4" />
                            Újraaktiválás
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleSuspendStudent(student.id)}
                          >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Felfüggesztés
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