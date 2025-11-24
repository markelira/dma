'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  Star,
  MoreVertical,
  BookOpen,
  DollarSign
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName?: string;
  category: string;
  difficulty: string;
  duration: string;
  price: number;
  enrollmentCount?: number;
  rating?: number;
  status: 'draft' | 'published' | 'archived';
  universityId: string;
  createdAt: Date;
}

export default function UniversityAdminCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.universityId) return;

    // Load courses for this university
    const coursesQuery = query(
      collection(db, 'courses'),
      where('universityId', '==', user.universityId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(coursesQuery, 
      (snapshot) => {
        const coursesData: Course[] = [];
        const uniqueCategories = new Set<string>();

        snapshot.forEach((doc) => {
          const data = doc.data();
          coursesData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as Course);
          
          if (data.category) {
            uniqueCategories.add(data.category);
          }
        });

        setCourses(coursesData);
        setFilteredCourses(coursesData);
        setCategories(Array.from(uniqueCategories));
        setLoading(false);
      }, 
      (error) => {
        console.error('Error loading courses:', error);
        // Ha nincs még index, akkor üres listával dolgozunk
        if (error.code === 'failed-precondition') {
          console.log('Firestore index required for this query');
        }
        setCourses([]);
        setFilteredCourses([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.universityId]);

  // Filter courses
  useEffect(() => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructorName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    setFilteredCourses(filtered);
  }, [searchQuery, statusFilter, categoryFilter, courses]);

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a kurzust?')) return;

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      
      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'DELETE_COURSE',
        resource: 'Course',
        resourceId: courseId,
        universityId: user?.universityId,
        severity: 'HIGH',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Tartalom sikeresen törölve');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Hiba történt a tartalom törlésekor');
    }
  };

  const handlePublishCourse = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        status: 'published',
        publishedAt: new Date()
      });

      // Create audit log
      await addDoc(collection(db, 'auditLogs'), {
        userId: user?.uid || '',
        userEmail: user?.email || '',
        userName: user?.displayName || user?.email || 'University Admin',
        action: 'PUBLISH_COURSE',
        resource: 'Course',
        resourceId: courseId,
        universityId: user?.universityId,
        severity: 'MEDIUM',
        ipAddress: 'N/A',
        userAgent: navigator.userAgent,
        createdAt: new Date()
      });

      toast.success('Tartalom sikeresen publikálva');
    } catch (error) {
      console.error('Error publishing course:', error);
      toast.error('Hiba történt a tartalom publikálásakor');
    }
  };

  const handleArchiveCourse = async (courseId: string) => {
    try {
      await updateDoc(doc(db, 'courses', courseId), {
        status: 'archived',
        archivedAt: new Date()
      });

      toast.success('Tartalom archiválva');
    } catch (error) {
      console.error('Error archiving course:', error);
      toast.error('Hiba történt a tartalom archiválásakor');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Publikált</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-800">Piszkozat</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Archivált</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'kezdő':
        return <Badge className="bg-green-100 text-green-700">Kezdő</Badge>;
      case 'intermediate':
      case 'középhaladó':
        return <Badge className="bg-yellow-100 text-yellow-700">Középhaladó</Badge>;
      case 'advanced':
      case 'haladó':
        return <Badge className="bg-red-100 text-red-700">Haladó</Badge>;
      default:
        return <Badge>{difficulty}</Badge>;
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Tartalmak kezelése</h1>
          <p className="text-muted-foreground">
            Az egyetem összes tartalmának kezelése
          </p>
        </div>
        <Link href="/university-admin/courses/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Új tartalom
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes tartalom</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Publikált</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Piszkozat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {courses.filter(c => c.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Összes beiratkozás</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0)}
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
                placeholder="Keresés tartalom neve vagy oktató alapján..."
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
                <SelectItem value="published">Publikált</SelectItem>
                <SelectItem value="draft">Piszkozat</SelectItem>
                <SelectItem value="archived">Archivált</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Kategória" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Minden kategória</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tartalom neve</TableHead>
                <TableHead>Oktató</TableHead>
                <TableHead>Kategória</TableHead>
                <TableHead>Szint</TableHead>
                <TableHead>Ár</TableHead>
                <TableHead>Beiratkozások</TableHead>
                <TableHead>Státusz</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {course.duration}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{course.instructorName || 'N/A'}</TableCell>
                  <TableCell>{typeof course.category === 'string' ? course.category : (course.category as any)?.name || 'N/A'}</TableCell>
                  <TableCell>{getDifficultyBadge(course.difficulty)}</TableCell>
                  <TableCell>
                    {course.price === 0 ? (
                      <Badge className="bg-green-100 text-green-800">Ingyenes</Badge>
                    ) : (
                      `${course.price.toLocaleString()} Ft`
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {course.enrollmentCount || 0}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(course.status)}</TableCell>
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
                        <Link href={`/university-admin/courses/${course.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Megtekintés
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/university-admin/courses/${course.id}/edit`}>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Szerkesztés
                          </DropdownMenuItem>
                        </Link>
                        {course.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handlePublishCourse(course.id)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Publikálás
                          </DropdownMenuItem>
                        )}
                        {course.status === 'published' && (
                          <DropdownMenuItem onClick={() => handleArchiveCourse(course.id)}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Archiválás
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Törlés
                        </DropdownMenuItem>
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