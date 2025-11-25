"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Video,
  FileText,
  Headphones,
  Download,
  Loader2,
  Import,
  Upload,
} from "lucide-react";
import { useCourseWizardStore } from "@/stores/courseWizardStore";
import { LessonType, CourseType } from "@/types";
import { getCourseTypeTerminology } from "@/lib/terminology";
import { toast } from "sonner";
import LessonImportModal from "./LessonImportModal";
import InlineMuxUploader from "./InlineMuxUploader";

interface LessonFormData {
  title: string;
  description: string;
  type: LessonType;
  content: string;
  videoUrl?: string;
  duration?: number;
}

const LESSON_TYPE_OPTIONS: { value: LessonType; label: string; icon: React.ReactNode }[] = [
  { value: "VIDEO", label: "Videó", icon: <Video className="h-4 w-4" /> },
  { value: "READING", label: "Olvasmány", icon: <FileText className="h-4 w-4" /> },
  { value: "AUDIO", label: "Hanganyag", icon: <Headphones className="h-4 w-4" /> },
  { value: "PDF", label: "Letölthető PDF", icon: <Download className="h-4 w-4" /> },
];

const emptyLessonForm: LessonFormData = {
  title: "",
  description: "",
  type: "VIDEO",
  content: "",
  videoUrl: "",
  duration: 0,
};

interface Props {
  courseId: string;
}

export default function CourseLessonsStep({ courseId }: Props) {
  const {
    lessons,
    courseType,
    addLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    setPendingVideoFile,
  } = useCourseWizardStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [form, setForm] = useState<LessonFormData>(emptyLessonForm);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newLessonPendingFile, setNewLessonPendingFile] = useState<File | null>(null);
  const [newLessonTempId] = useState(`temp_${Date.now()}`);

  const terminology = courseType ? getCourseTypeTerminology(courseType) : null;
  const lessonLabel = terminology?.lessonLabel || "Lecke";
  const lessonsLabel = terminology?.lessonsLabel || "Leckék";

  // Open dialog for creating new lesson
  const openForCreate = () => {
    setEditingLessonId(null);
    setForm(emptyLessonForm);
    setNewLessonPendingFile(null);
    setDialogOpen(true);
  };

  // Open dialog for editing existing lesson
  const openForEdit = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId || l.tempId === lessonId);
    if (lesson) {
      setEditingLessonId(lessonId);
      setForm({
        title: lesson.title,
        description: lesson.description || "",
        type: lesson.type as LessonType,
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        duration: lesson.duration || 0,
      });
      setDialogOpen(true);
    }
  };

  // Handle form submission
  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("A cím megadása kötelező");
      return;
    }

    const lessonData = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      content: form.content.trim(),
      videoUrl: form.videoUrl?.trim() || undefined,
      duration: form.duration || 0,
      status: "DRAFT" as const,
      courseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingLessonId) {
      updateLesson(editingLessonId, lessonData);
      toast.success(`${lessonLabel} frissítve`);
    } else {
      // Create new lesson with tempId
      const newLessonTempId = `temp_${Date.now()}`;
      addLesson({ ...lessonData, tempId: newLessonTempId });

      // If there's a pending file for the new lesson, set it
      if (newLessonPendingFile) {
        // Small delay to ensure lesson is added to store
        setTimeout(() => {
          setPendingVideoFile(newLessonTempId, newLessonPendingFile);
        }, 100);
      }
      toast.success(`${lessonLabel} hozzáadva`);
    }

    setDialogOpen(false);
    setForm(emptyLessonForm);
    setEditingLessonId(null);
    setNewLessonPendingFile(null);
  };

  // Handle lesson delete
  const handleDelete = (lessonId: string) => {
    deleteLesson(lessonId);
    toast.success(`${lessonLabel} törölve`);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    reorderLessons(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Get lesson type icon
  const getLessonTypeIcon = (type: LessonType) => {
    const option = LESSON_TYPE_OPTIONS.find(o => o.value === type);
    return option?.icon || <FileText className="h-4 w-4" />;
  };

  // Check if import is available (MASTERCLASS only)
  const canImport = courseType === "MASTERCLASS";

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">{lessonsLabel}</h3>
          <p className="text-sm text-muted-foreground">
            {lessons.length} {lessons.length === 1 ? lessonLabel.toLowerCase() : lessonsLabel.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canImport && (
            <Button
              variant="outline"
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Import className="h-4 w-4" />
              Importálás
            </Button>
          )}
          <Button onClick={openForCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Új {lessonLabel.toLowerCase()}
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {lessons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Még nincs {lessonLabel.toLowerCase()} hozzáadva
            </p>
            <Button onClick={openForCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Első {lessonLabel.toLowerCase()} hozzáadása
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Lesson list */
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <Card
              key={lesson.id || lesson.tempId}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-all ${
                draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
              } ${lesson.isImported ? "border-brand-secondary/20 bg-brand-secondary/5/50" : ""}`}
            >
              <CardContent className="flex items-center gap-4 py-3 px-4">
                {/* Drag handle */}
                <div className="text-muted-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Order number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {index + 1}
                  </span>
                </div>

                {/* Lesson type icon */}
                <div className="text-muted-foreground">
                  {getLessonTypeIcon(lesson.type as LessonType)}
                </div>

                {/* Lesson info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{lesson.title}</p>
                    {lesson.isImported && (
                      <span className="text-xs bg-brand-secondary/10 text-brand-secondary-hover px-2 py-0.5 rounded">
                        Importált
                      </span>
                    )}
                    {lesson.pendingVideoFile && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        Videó várakozik
                      </span>
                    )}
                  </div>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {lesson.description}
                    </p>
                  )}
                </div>

                {/* Duration */}
                {lesson.duration && lesson.duration > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {Math.floor(lesson.duration / 60)}:{String(lesson.duration % 60).padStart(2, "0")}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openForEdit(lesson.id || lesson.tempId || "")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {lessonLabel} törlése
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Biztosan törölni szeretnéd a(z) &quot;{lesson.title}&quot; {lessonLabel.toLowerCase()}t?
                          Ez a művelet nem vonható vissza.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Mégse</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(lesson.id || lesson.tempId || "")}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Törlés
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Lesson Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLessonId ? `${lessonLabel} szerkesztése` : `Új ${lessonLabel.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="lesson-title">
                Cím <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lesson-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={`${lessonLabel} címe`}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Típus</Label>
              <Select
                value={form.type}
                onValueChange={(value: LessonType) => setForm({ ...form, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="lesson-description">Leírás</Label>
              <Textarea
                id="lesson-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={`${lessonLabel} rövid leírása`}
                rows={3}
              />
            </div>

            {/* Video Upload (for VIDEO type) */}
            {form.type === "VIDEO" && (
              <div className="space-y-2">
                <Label>Videó feltöltése</Label>
                {(() => {
                  const isEditing = !!editingLessonId;
                  const editingLesson = isEditing
                    ? lessons.find(l => l.id === editingLessonId || l.tempId === editingLessonId)
                    : null;

                  // For new lessons, show pending file info from local state
                  const pendingFileInfo = isEditing
                    ? editingLesson?.pendingVideoFile
                    : newLessonPendingFile
                      ? { name: newLessonPendingFile.name, size: newLessonPendingFile.size, type: newLessonPendingFile.type }
                      : undefined;

                  return (
                    <InlineMuxUploader
                      lessonId={editingLessonId || newLessonTempId}
                      pendingFile={pendingFileInfo}
                      existingVideoUrl={form.videoUrl}
                      existingPlaybackId={editingLesson?.muxPlaybackId}
                      onFileSelected={(file) => {
                        if (isEditing) {
                          // Editing existing lesson - update store directly
                          setPendingVideoFile(editingLessonId!, file);
                        } else {
                          // New lesson - store in local state until save
                          setNewLessonPendingFile(file);
                        }
                        // Clear videoUrl when selecting a file (will be set after upload)
                        if (file) {
                          setForm({ ...form, videoUrl: "" });
                        }
                      }}
                    />
                  );
                })()}
              </div>
            )}

            {/* Content (for READING type) */}
            {form.type === "READING" && (
              <div className="space-y-2">
                <Label htmlFor="lesson-content">Tartalom</Label>
                <Textarea
                  id="lesson-content"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="A lecke szöveges tartalma..."
                  rows={6}
                />
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="lesson-duration">Időtartam (másodperc)</Label>
              <Input
                id="lesson-duration"
                type="number"
                value={form.duration || ""}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                placeholder="pl. 600 (10 perc)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Mégse
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim()}>
              {editingLessonId ? "Mentés" : "Hozzáadás"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Modal (MASTERCLASS only) */}
      {canImport && (
        <LessonImportModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          excludeCourseId={courseId}
        />
      )}
    </div>
  );
}
