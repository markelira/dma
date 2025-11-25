'use client';

import { useMemo, memo } from 'react';
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import type { Course, Module, Lesson } from "@/types";

interface SidebarProps {
  course: Course;
  modules: Module[];
  currentLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  completedLessonIds?: string[];
  className?: string;
}

const SidebarComponent = function Sidebar({
  course,
  modules,
  currentLessonId,
  onSelectLesson,
  completedLessonIds = [],
  className
}: SidebarProps) {
  // Find which module the current lesson belongs to, to open that accordion item
  const currentModuleId = useMemo(() => {
    const found = modules.find(m =>
      m.lessons.some(l => l.id === currentLessonId)
    );
    return found?.id || modules[0]?.id; // Fallback to first module if not found
  }, [modules, currentLessonId]);

  // Calculate progress - count published lessons only
  const totalPublishedLessons = useMemo(() => {
    return modules.reduce((acc, m) => {
      return acc + m.lessons.filter((l: any) => l.status === 'PUBLISHED').length;
    }, 0);
  }, [modules]);

  const completed = completedLessonIds.length;
  const progress = totalPublishedLessons > 0 ? Math.round((completed / totalPublishedLessons) * 100) : 0;

  // Get instructor name
  const instructorName = useMemo(() => {
    return course.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : 'DMA';
  }, [course.instructor?.firstName, course.instructor?.lastName]);

  return (
    <div className={cn("flex flex-col h-full bg-sidebar border-r border-sidebar-border", className)}>
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="font-heading font-bold text-xl text-sidebar-foreground mb-2">
          {course.title}
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="whitespace-nowrap">{progress}% Kész</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="single" collapsible defaultValue={currentModuleId} className="w-full">
          {modules.map((module, index) => (
            <AccordionItem key={module.id} value={module.id} className="border-b border-sidebar-border">
              <AccordionTrigger className="px-6 py-4 hover:bg-secondary/50 hover:no-underline text-left transition-colors">
                <div className="flex flex-col items-start text-left gap-1">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    {index + 1}. Modul
                  </span>
                  <span className="font-bold text-foreground text-base leading-tight">
                    {module.title}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-0">
                <div className="flex flex-col">
                  {module.lessons
                    .filter(lesson => lesson.status === 'PUBLISHED')
                    .sort((a, b) => a.order - b.order)
                    .map((lesson) => {
                      const isActive = lesson.id === currentLessonId;
                      const isCompleted = completedLessonIds.includes(lesson.id);
                      const duration = lesson.duration || lesson.muxDuration;
                      const formatDuration = (seconds?: number): string => {
                        if (!seconds) return '';
                        const mins = Math.floor(seconds / 60);
                        const secs = Math.floor(seconds % 60);
                        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
                      };

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson(lesson.id)}
                          className={cn(
                            "flex items-start gap-3 px-6 py-4 text-sm transition-all border-l-4 w-full text-left hover:bg-secondary/30",
                            isActive
                              ? "bg-secondary border-primary"
                              : "border-transparent bg-transparent"
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isActive ? (
                              <PlayCircle className="w-5 h-5 text-primary animate-pulse" />
                            ) : isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "font-medium leading-tight",
                              isActive ? "text-primary" : "text-foreground/80"
                            )}>
                              {lesson.title}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {lesson.type === 'VIDEO' && "Videó •"} {duration ? formatDuration(duration) : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
        <p className="text-xs text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} {instructorName}
        </p>
      </div>
    </div>
  );
};

export const Sidebar = memo(SidebarComponent);
