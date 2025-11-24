"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, Loader2, Video, FileText, Headphones, Download, Import } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions as fbFunctions } from "@/lib/firebase";
import { useCourseWizardStore } from "@/stores/courseWizardStore";
import { toast } from "sonner";
import { Course, Lesson, LessonType, COURSE_TYPE_LABELS } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  excludeCourseId: string;
}

interface CourseWithLessons extends Course {
  lessons: Lesson[];
}

export default function LessonImportModal({ open, onClose, excludeCourseId }: Props) {
  const { importLessons } = useCourseWizardStore();

  const [courses, setCourses] = useState<CourseWithLessons[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLessons, setSelectedLessons] = useState<Map<string, Lesson & { sourceCourseId: string; sourceCourseTitle: string }>>(new Map());

  // Fetch published courses with lessons
  useEffect(() => {
    if (!open) return;

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const getCoursesFn = httpsCallable<{ forImport?: boolean }, { success: boolean; courses: CourseWithLessons[] }>(
          fbFunctions,
          "getCoursesCallable"
        );
        const result = await getCoursesFn({ forImport: true });

        // DIAGNOSTIC: Log API response
        console.log("[LessonImportModal] API Response:", {
          success: result.data.success,
          totalCourses: result.data.courses?.length || 0,
          courses: result.data.courses?.map(c => ({
            id: c.id,
            title: c.title,
            status: c.status,
            lessonsCount: c.lessons?.length || 0,
          }))
        });

        if (result.data.success) {
          // Filter out current course and only show published courses with lessons
          const filteredCourses = result.data.courses.filter(
            (course) =>
              course.id !== excludeCourseId &&
              course.status === "PUBLISHED" &&
              course.lessons &&
              course.lessons.length > 0
          );

          console.log("[LessonImportModal] After filtering:", {
            excludeCourseId,
            filteredCount: filteredCourses.length,
            filtered: filteredCourses.map(c => ({ id: c.id, title: c.title }))
          });

          setCourses(filteredCourses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast.error("Nem sikerült betölteni a tartalmakat");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [open, excludeCourseId]);

  // Filter courses by search query
  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.lessons.some((lesson) =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Toggle lesson selection
  const toggleLesson = (courseId: string, courseTitle: string, lesson: Lesson) => {
    const key = `${courseId}_${lesson.id}`;
    const newSelected = new Map(selectedLessons);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.set(key, {
        ...lesson,
        sourceCourseId: courseId,
        sourceCourseTitle: courseTitle,
      });
    }

    setSelectedLessons(newSelected);
  };

  // Check if lesson is selected
  const isLessonSelected = (courseId: string, lessonId: string) => {
    return selectedLessons.has(`${courseId}_${lessonId}`);
  };

  // Handle import
  const handleImport = () => {
    if (selectedLessons.size === 0) {
      toast.error("Válassz legalább egy leckét az importáláshoz");
      return;
    }

    const lessonsToImport = Array.from(selectedLessons.values()).map((lesson) => ({
      ...lesson,
      id: undefined, // Will get new ID
      tempId: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceLessonId: lesson.id,
      sourceCourseId: lesson.sourceCourseId,
      isImported: true,
    }));

    importLessons(lessonsToImport);
    toast.success(`${lessonsToImport.length} lecke importálva`);
    setSelectedLessons(new Map());
    onClose();
  };

  // Get lesson type icon
  const getLessonTypeIcon = (type: LessonType) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-4 w-4" />;
      case "READING":
        return <FileText className="h-4 w-4" />;
      case "AUDIO":
        return <Headphones className="h-4 w-4" />;
      case "DOWNLOAD":
        return <Download className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Import className="h-5 w-5" />
            Leckék importálása
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keresés tartalmak és leckék között..."
              className="pl-9"
            />
          </div>

          {/* Selected count */}
          {selectedLessons.size > 0 && (
            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm">
              {selectedLessons.size} lecke kiválasztva
            </div>
          )}

          {/* Course list with lessons */}
          <ScrollArea className="h-[400px] border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Nincs elérhető tartalom importáláshoz</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {filteredCourses.map((course) => (
                  <AccordionItem key={course.id} value={course.id}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex-1">
                          <p className="font-medium">{course.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {COURSE_TYPE_LABELS[course.courseType]} • {course.lessons.length} lecke
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 pl-2 border-l-2 border-muted">
                        {course.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                              isLessonSelected(course.id, lesson.id)
                                ? "bg-blue-50"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => toggleLesson(course.id, course.title, lesson)}
                          >
                            <Checkbox
                              checked={isLessonSelected(course.id, lesson.id)}
                              onCheckedChange={() => toggleLesson(course.id, course.title, lesson)}
                            />
                            <div className="text-muted-foreground">
                              {getLessonTypeIcon(lesson.type as LessonType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              {lesson.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {lesson.description}
                                </p>
                              )}
                            </div>
                            {lesson.duration && lesson.duration > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Mégse
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedLessons.size === 0}
            className="flex items-center gap-2"
          >
            <Import className="h-4 w-4" />
            Importálás ({selectedLessons.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
