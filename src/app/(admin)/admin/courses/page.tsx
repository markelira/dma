"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye, Trash2, Plus, Edit } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from "sonner";
import { useDeleteCourse } from "@/hooks/useCourseQueries";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


interface Course {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | "PENDING_REVIEW";
  instructorId: string;
  categoryId: string;
  language: string;
  slug?: string;
  certificateEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  category: {
    id: string;
    name: string;
  };
}

interface CoursesResponse {
  courses: Course[];
  total: number;
}

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const deleteCourseMutation = useDeleteCourse();

  const { data: coursesData, isLoading, refetch } = useQuery<CoursesResponse>({
    queryKey: ["courses", "admin"],
    queryFn: async () => {
      console.log('🔍 Fetching courses for admin...');
      const getCoursesCallableFn = httpsCallable(functions, 'getCoursesCallable');
      const result: any = await getCoursesCallableFn({});

      if (!result.data.success) {
        throw new Error(result.data.error || 'Hiba a tartalmak betöltésekor');
      }

      // Filter out soft-deleted courses (those with deletedAt field)
      const allCourses = result.data.courses || [];
      const activeCourses = allCourses.filter((course: any) => !course.deletedAt);

      console.log(`✅ Fetched ${allCourses.length} total courses, ${activeCourses.length} active courses`);

      return {
        courses: activeCourses,
        total: activeCourses.length
      };
    },
  });

  const courses = coursesData?.courses || [];

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "PENDING_REVIEW":
        return <Badge className="bg-amber-100 text-amber-800">Pending Review</Badge>;
      case "DRAFT":
        return <Badge>Draft</Badge>;
      case "ARCHIVED":
        return <Badge>Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#112a4b] mx-auto"></div>
          <p className="mt-2 text-gray-500">Tartalmak betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tartalom kezelés</h1>
          <p className="text-gray-500">
            Platform tartalmak kezelése
          </p>
        </div>
        <Link href="/admin/courses/new/edit">
          <Button className="bg-[#112a4b] text-white hover:bg-[#1a3d6e]">
            <Plus className="mr-2 h-4 w-4" />
            Új tartalom
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Keresés cím, leírás vagy oktató alapján..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <div key={course.id} className="rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {course.instructor?.firstName || 'Unknown'} {course.instructor?.lastName || 'Instructor'}
                  </p>
                </div>
                {getStatusBadge(course.status)}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                {course.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>Category: {course.category?.name || 'Uncategorized'}</span>
                <span>Language: {course.language ? course.language.toUpperCase() : 'HU'}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {course.certificateEnabled && (
                    <Badge className="text-xs">
                      Certificate
                    </Badge>
                  )}
                  {course.status === "PENDING_REVIEW" && (
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const publishCallableFn = httpsCallable(functions, 'publishCourseCallable');
                        const result: any = await publishCallableFn({ courseId: course.id });
                        if (result.data.success) {
                          toast.success("Course published");
                        } else {
                          toast.error(result.data.error || "Publish failed");
                        }
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || "Publish failed");
                      }
                    }}>
                      Approve
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/admin/courses/${course.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/courses/${course.id}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Tartalom törlése</AlertDialogTitle>
                        <AlertDialogDescription>
                          Biztosan törölni szeretnéd a "{course.title}" tartalmat?
                          Ez a művelet törli a tartalmat és minden kapcsolódó adatot (feliratkozások, értékelések, modulok, leckék).
                          Ez a művelet nem vonható vissza.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Mégse</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              console.log('🗑️ Deleting course:', course.id, course.title);
                              await deleteCourseMutation.mutateAsync(course.id);
                              console.log('✅ Course deleted successfully');
                              toast.success("Tartalom sikeresen törölve");
                              // Refetch courses to update the list
                              refetch();
                            } catch (error: any) {
                              console.error('❌ Delete error:', error);
                              toast.error(error?.message || "Hiba történt a törlés során");
                            }
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Törlés
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="rounded-xl bg-white border border-gray-200 shadow-sm p-6">
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm ? "Nincs a keresésnek megfelelő tartalom." : "Nincs elérhető tartalom."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 