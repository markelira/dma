"use client";

import React, { useEffect, useMemo, useState } from "react";
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { GripVertical, Plus, Trash2, Check, X, Loader2, BookOpen } from "lucide-react";
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
// @ts-ignore - dynamically created component
import LessonList from "./LessonList";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useCourseWizardStore } from "@/stores/courseWizardStore";

interface Lesson {
  id: string;
  title: string;
  type: "VIDEO" | "TEXT" | "READING" | "QUIZ";
  order: number;
  moduleId: string;
  courseId: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
  courseId: string;
  lessons: Lesson[];
}

interface Props {
  courseId: string;
}

interface SidebarItemProps {
  mod: Module;
  selected: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

function SortableModuleSidebarItem({ mod, selected, onSelect, onRename, onDelete }: SidebarItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: mod.id });
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted ${selected ? 'bg-primary/10' : ''}`}
      onClick={onSelect}
    >
      <GripVertical
        {...listeners}
        className="h-4 w-4 text-muted-foreground cursor-grab group-active:cursor-grabbing"
      />
      <input
        defaultValue={mod.title}
        onBlur={(e)=>{
          const v = e.target.value.trim();
          if(v && v!==mod.title) onRename(v);
        }}
        className="bg-transparent flex-1 text-sm outline-none"
      />
      <Badge className="flex items-center gap-1 text-xs">
        <BookOpen className="h-3 w-3" />
        {mod.lessons?.length || 0}
      </Badge>
      <Button variant="ghost" size="icon" onClick={(e)=>{e.stopPropagation(); onDelete();}}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}

export default function CurriculumStructureStep({ courseId }: Props) {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  // Zustand store integration
  const { 
    modules: storeModules, 
    addModule, 
    updateModule: updateStoreModule,
    deleteModule: deleteStoreModule,
    addLesson: addStoreLesson,
    updateLesson: updateStoreLesson,
    deleteLesson: deleteStoreLesson 
  } = useCourseWizardStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Realtime Firestore subscription a kurzus moduljaira
    const courseRef = doc(db, "courses", courseId);
    const modsQ = query(collection(courseRef, "modules"), orderBy("order"));
    const unsub = onSnapshot(
      modsQ,
      (snap) => {
        const mods: Module[] = snap.docs.map((d) => ({
          id: d.id,
          courseId,
          lessons: [], // a LessonList fogja feltölteni
          ...(d.data() as any),
        }));
        setModules(mods);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Modulok betöltése sikertelen");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [courseId]);

  // Simple sync to store when modules change
  useEffect(() => {
    if (modules.length > 0) {
      console.log('🔄 Found', modules.length, 'modules in Firestore, syncing to store');
      console.log('🔍 Current store modules:', storeModules.length);
      
      // Simple sync - add any missing modules to store
      modules.forEach(mod => {
        const existsInStore = storeModules.find(m => 
          (m.id && m.id === mod.id) || (m.tempId && m.tempId === mod.id)
        );
        
        if (!existsInStore) {
          console.log('➕ Adding module to store:', mod.title);
          addModule({
            id: mod.id,
            title: mod.title,
            description: '',
            order: mod.order,
            lessons: [] // Will be populated by LessonList
          });
        }
      });
    }
  }, [modules]);

  // Keep selectedId valid
  useEffect(()=>{
    if(selectedId===null && modules.length) setSelectedId(modules[0].id);
    if(selectedId && !modules.find(m=>m.id===selectedId)) setSelectedId(modules[0]?.id ?? null);
  }, [modules, selectedId]);

  // --- Module API helpers ---
  const createModule = async () => {
    if (!newTitle.trim()) {
      toast.error("Adj címet a modulnak");
      return;
    }
    setSavingNew(true);
    try {
      const courseRef = doc(db, "courses", courseId);
      await addDoc(collection(courseRef, "modules"), {
        title: newTitle.trim(),
        order: modules.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setNewTitle("");
      setAdding(false);
      toast.success("Modul létrehozva");
    } catch (err: any) {
      console.error(err);
      toast.error("Modul létrehozása sikertelen");
    } finally {
      setSavingNew(false);
    }
  };

  const updateModule = async (id: string, payload: Partial<Module>) => {
    try {
      const moduleRef = doc(db, "courses", courseId, "modules", id);
      await updateDoc(moduleRef, { ...payload, updatedAt: new Date().toISOString() });
    } catch (err: any) {
      console.error(err);
      toast.error("Modul frissítése sikertelen");
    }
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Biztosan törölni szeretnéd a modult?")) return;
    try {
      const moduleRef = doc(db, "courses", courseId, "modules", id);
      await deleteDoc(moduleRef);
      toast.success("Modul törölve");
    } catch (err: any) {
      console.error(err);
      toast.error("Modul törlése sikertelen");
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    const newOrder = arrayMove(modules, oldIndex, newIndex).map((m, idx) => ({ ...m, order: idx }));
    setModules(newOrder);
    // Persist order updates Firestore-ben
    newOrder.forEach((mod) => updateModule(mod.id, { order: mod.order }));
  };

  const moduleIds = useMemo(() => modules.map((m) => m.id), [modules]);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r pr-4">
        <div className="sticky top-14 bg-background/90 backdrop-blur pb-3 z-10">
          {!adding ? (
            <Button size="sm" className="w-full" onClick={()=>setAdding(true)}>
              <Plus className="h-4 w-4 mr-1" /> Új modul
            </Button>
          ) : (
            <div className="flex items-center gap-2 py-1">
              <Input placeholder="Modul címe" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)} />
              <Button size="icon" onClick={createModule} disabled={savingNew}>
                {savingNew ? <Loader2 className="animate-spin"/> : <Check/>}
              </Button>
              <Button variant="ghost" size="icon" onClick={()=>{setAdding(false); setNewTitle('')}}>
                <X/>
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-4 space-y-2">
            {[1,2,3].map(i=> <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        )}

        {!loading && modules.length===0 && (
          <p className="italic text-muted-foreground mt-4">Nincsenek modulok.</p>
        )}

        {/* Modules list */}
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={modules.map(m=>m.id)} strategy={verticalListSortingStrategy}>
            {modules.map(mod=> (
              <SortableModuleSidebarItem
                key={mod.id}
                mod={mod}
                selected={mod.id===selectedId}
                onSelect={()=>setSelectedId(mod.id)}
                onRename={(title)=> updateModule(mod.id,{title})}
                onDelete={()=> deleteModule(mod.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Main panel */}
      <div className="flex-1">
        {selectedId && modules.find(m=>m.id===selectedId) ? (
          (()=>{
            const sel= modules.find(m=>m.id===selectedId)!;
            return (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Input
                    className="text-lg font-bold"
                    defaultValue={sel.title}
                    onBlur={(e)=>{
                      const v=e.target.value.trim(); if(v && v!==sel.title) updateModule(sel.id,{title:v});
                    }}
                  />
                  <Badge variant="metric" className="flex items-center gap-1" title="Leckék száma">
                    <BookOpen className="h-3 w-3" />
                    {sel.lessons?.length || 0} lecke
                  </Badge>
                </div>

                <LessonList module={sel as any} onModuleUpdate={(u:any)=> setModules((prev: any)=> prev.map((m:any)=> m.id===u.id? u: m))} />
              </div>
            );
          })()
        ) : (
          <p className="italic text-muted-foreground">Válassz egy modult bal oldalt a leckék szerkesztéséhez.</p>
        )}
      </div>
    </div>
  );
} 