"use client";

import React, { useMemo, useState } from "react";
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Check, X, Loader2, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import LessonContentEditorModal from "./LessonContentEditorModal";
import type { LessonQuiz } from "./QuizEditorModal";

interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "READING" | "QUIZ" | "PDF" | "AUDIO";
  order: number;
  moduleId: string;
  courseId: string;
  content?: string | null;
  videoUrl?: string | null;
  description?: string | null;
  durationSec?: number | null;
  isFreePreview?: boolean;
  resources?: { name: string; url: string }[];
  /** Új struktúrált kvíz objektum */
  quiz?: LessonQuiz | null;
  /** Legacy mező – migrációhoz */
  quizJson?: string | null;
}

interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

interface Props {
  module: Module;
  onModuleUpdate: (module: Module) => void;
}

interface LessonCardProps {
  lesson: Lesson;
  onLocalUpdate: (lessons: Lesson[]) => void;
  lessons: Lesson[];
  updateLesson: (id: string, payload: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  lessonEditHandler: (lesson: Lesson) => void;
}

function SortableLessonCard({ lesson, lessons, onLocalUpdate, updateLesson, deleteLesson, lessonEditHandler }: LessonCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2 border rounded p-2 bg-muted/50">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" {...listeners} />
        <Input
          className="flex-1"
          defaultValue={lesson.title}
          onBlur={(e) => {
            const newTitle = e.target.value.trim();
            if (newTitle && newTitle !== lesson.title) {
              const updatedLessons = lessons.map((l) => (l.id === lesson.id ? { ...l, title: newTitle } : l));
              onLocalUpdate(updatedLessons);
              updateLesson(lesson.id, { title: newTitle });
            }
          }}
        />
        <Select
          defaultValue={lesson.type}
          onValueChange={(v: any) => {
            const updatedLessons = lessons.map((l) => (l.id === lesson.id ? { ...l, type: v } : l));
            onLocalUpdate(updatedLessons);
            updateLesson(lesson.id, { type: v as Lesson["type"] });
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="VIDEO">Videó</SelectItem>
            <SelectItem value="TEXT">Szöveg</SelectItem>
            <SelectItem value="READING">Olvasmány</SelectItem>
            <SelectItem value="QUIZ">Kvíz</SelectItem>
            <SelectItem value="PDF">PDF dokumentum</SelectItem>
            <SelectItem value="AUDIO">Hanganyag</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => lessonEditHandler(lesson)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Biztosan törlöd a leckét?</AlertDialogTitle>
              <AlertDialogDescription>
                A művelet nem visszavonható.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Mégse</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteLesson(lesson.id)}>Törlés</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function LessonList({ module, onModuleUpdate }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(module.lessons || []);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Realtime Firestore listener a modul leckéire
  React.useEffect(() => {
    const lessonsQ = query(
      collection(db, "courses", module.courseId, "modules", module.id, "lessons"),
      orderBy("order")
    );
    const unsub = onSnapshot(lessonsQ, (snap) => {
      const ls: Lesson[] = snap.docs.map((d) => ({ id: d.id, moduleId: module.id, courseId: module.courseId, ...(d.data() as any) }));
      setLessons(ls);
      // Sync parent module
      onModuleUpdate({ ...module, lessons: ls });
    });
    return () => unsub();
  }, [module.courseId, module.id]);

  const createLesson = async () => {
    if (!newTitle.trim()) {
      toast.error("Adj címet a leckének");
      return;
    }
    setSavingNew(true);
    try {
      await addDoc(
        collection(db, "courses", module.courseId, "modules", module.id, "lessons"),
        {
          title: newTitle.trim(),
          moduleId: module.id,
          courseId: module.courseId,
          order: lessons.length,
          type: "TEXT",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isFreePreview: false,
          durationSec: null,
          resources: [],
          quiz: null,
        }
      );
      setNewTitle("");
      setAdding(false);
      toast.success("Lecke létrehozva");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lecke létrehozása sikertelen");
    } finally {
      setSavingNew(false);
    }
  };

  const updateLesson = async (id: string, payload: Partial<Lesson>) => {
    try {
      const lessonRef = doc(db, "courses", module.courseId, "modules", module.id, "lessons", id);
      await updateDoc(lessonRef, { ...payload, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lecke frissítése sikertelen");
    }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd a leckét?")) return;
    try {
      const lessonRef = doc(db, "courses", module.courseId, "modules", module.id, "lessons", id);
      await deleteDoc(lessonRef);
      toast.success("Lecke törölve");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lecke törlése sikertelen");
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    const newOrder = arrayMove(lessons, oldIndex, newIndex).map((l, idx) => ({ ...l, order: idx }));
    setLessons(newOrder);
    newOrder.forEach((l) => updateLesson(l.id, { order: l.order }));
  };

  const lessonIds = useMemo(() => lessons.map((l) => l.id), [lessons]);

  const handleLessonSaved = (payload: Partial<Lesson>) => {
    if (!editingLesson) return;
    const updatedLessons = lessons.map((l) => (l.id === editingLesson.id ? { ...l, ...payload } : l));
    setLessons(updatedLessons);
  };

  return (
    <div className="space-y-2">
      {!adding && (
      <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
        <Plus className="h-4 w-4 mr-1" /> Új lecke
      </Button>)}
      {adding && (
        <div className="flex items-center gap-2 py-1">
          <Input
            placeholder="Lecke címe"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button size="icon" onClick={createLesson} disabled={savingNew}>
            {savingNew ? <Loader2 className="animate-spin" /> : <Check />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {setAdding(false); setNewTitle("")}}>
            <X />
          </Button>
        </div>
      )}
      {savingNew && (
        <Skeleton className="h-8 w-full" />
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson) => (
            <SortableLessonCard
              key={lesson.id}
              lesson={lesson}
              lessons={lessons}
              onLocalUpdate={(ls) => {
                setLessons(ls);
              }}
              updateLesson={updateLesson}
              deleteLesson={deleteLesson}
              lessonEditHandler={(l) => setEditingLesson({ ...l, courseId: module.courseId })}
            />
          ))}
        </SortableContext>
      </DndContext>

      {editingLesson && (
        <LessonContentEditorModal
          lesson={editingLesson}
          open={!!editingLesson}
          onOpenChange={(o) => { if (!o) setEditingLesson(null); }}
          onSaved={handleLessonSaved}
        />
      )}
    </div>
  );
} 