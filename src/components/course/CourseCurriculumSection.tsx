'use client';

import React from 'react';
import { PlayCircle, FileText, Lock, Check } from 'lucide-react';
import { motion } from 'motion/react';

interface Lesson {
  id: string;
  title: string;
  duration?: string;
  type: string;
  completed: boolean;
  locked: boolean;
  preview: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  lessons: Lesson[];
}

interface CourseCurriculumSectionProps {
  modules: Module[];
  totalLessons: number;
  totalDuration: string;
}

export function CourseCurriculumSection({
  modules,
  totalLessons,
  totalDuration
}: CourseCurriculumSectionProps) {
  return (
    <motion.section
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tananyag
        </h2>
        <p className="text-gray-600">
          {modules.length} modul • {totalLessons} lecke • {totalDuration}
        </p>
      </div>

      <div className="space-y-4">
        {modules.map((module, index) => (
          <details key={module.id} className="group border border-gray-200 rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none p-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {index + 1}. {module.title}
                  </h3>
                  {module.description && (
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {module.lessons.length} lecke
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-500 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </summary>

            <div className="bg-white border-t border-gray-200">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {lesson.type === 'video' ? (
                      <PlayCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={lesson.completed ? 'text-gray-900 line-through' : 'text-gray-700'}>
                      {lesson.title}
                    </span>
                    {lesson.preview && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Előnézet
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {lesson.duration && (
                      <span className="text-sm text-gray-500">{lesson.duration}</span>
                    )}
                    {lesson.completed && <Check className="w-4 h-4 text-green-600" />}
                    {lesson.locked && <Lock className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </motion.section>
  );
}
