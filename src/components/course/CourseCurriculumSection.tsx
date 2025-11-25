'use client';

import React from 'react';
import { PlayCircle, FileText, Lock, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { NetflixEpisodeCard, NetflixEpisodeLesson } from './NetflixEpisodeCard';

interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  type: string;
  completed: boolean;
  locked: boolean;
  preview: boolean;
  // Netflix episode data (optional, used when netflixStyle=true)
  durationSeconds?: number;
  muxDuration?: number;
  muxThumbnailUrl?: string;
  muxPlaybackId?: string;
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
  /** Section title (default: "Tananyag") */
  sectionTitle?: string;
  /** Module label for single (default: "modul") */
  moduleLabel?: string;
  /** Lesson label for single (default: "lecke") */
  lessonLabel?: string;
  /** Lessons label for plural (default: "lecke") */
  lessonsLabel?: string;
  /** Hide module accordion for flat lesson lists */
  flatLessonMode?: boolean;
  /** Dark mode styling */
  darkMode?: boolean;
  /** Netflix-style episode layout */
  netflixStyle?: boolean;
  /** Course thumbnail (fallback for lessons without thumbnails) */
  courseThumbnail?: string;
}

export function CourseCurriculumSection({
  modules,
  totalLessons,
  totalDuration,
  sectionTitle = 'Tananyag',
  moduleLabel = 'modul',
  lessonLabel = 'lecke',
  lessonsLabel = 'lecke',
  flatLessonMode = false,
  darkMode = false,
  netflixStyle = false,
  courseThumbnail
}: CourseCurriculumSectionProps) {
  // Flat lesson mode: combine all lessons into a single list
  const allLessons = flatLessonMode || netflixStyle
    ? modules.flatMap(m => m.lessons)
    : [];

  // Dark mode styles
  const containerClass = darkMode
    ? 'py-6 border-b border-gray-800'
    : 'bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-8';

  const headingClass = darkMode ? 'text-white' : 'text-gray-900';
  const subtextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const lessonListBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const lessonItemBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const lessonBorder = darkMode ? 'border-gray-700' : 'border-gray-100';
  const lessonText = darkMode ? 'text-gray-300' : 'text-gray-700';
  const lessonTextCompleted = darkMode ? 'text-gray-500 line-through' : 'text-gray-900 line-through';
  const moduleSummaryBg = darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100';
  const moduleContentBg = darkMode ? 'bg-gray-850' : 'bg-white';

  // Convert lesson to Netflix episode format
  const toNetflixEpisode = (lesson: Lesson): NetflixEpisodeLesson => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    type: (lesson.type?.toUpperCase() || 'VIDEO') as NetflixEpisodeLesson['type'],
    duration: lesson.durationSeconds,
    muxDuration: lesson.muxDuration,
    muxThumbnailUrl: lesson.muxThumbnailUrl,
    muxPlaybackId: lesson.muxPlaybackId,
  });

  // Netflix-style episode layout
  if (netflixStyle) {
    return (
      <motion.section
        className={containerClass}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-2xl font-bold ${headingClass}`}>
            Epizódok
          </h2>
          <span className={subtextClass}>
            {totalLessons} epizód
          </span>
        </div>

        {/* Episode list */}
        <div>
          {allLessons.map((lesson, index) => (
            <NetflixEpisodeCard
              key={lesson.id}
              lesson={toNetflixEpisode(lesson)}
              episodeNumber={index + 1}
              courseThumbnail={courseThumbnail}
            />
          ))}
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      className={containerClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${headingClass} mb-2`}>
          {sectionTitle}
        </h2>
        <p className={subtextClass}>
          {flatLessonMode
            ? `${totalLessons} ${lessonsLabel.toLowerCase()} • ${totalDuration}`
            : `${modules.length} ${moduleLabel} • ${totalLessons} ${lessonsLabel.toLowerCase()} • ${totalDuration}`
          }
        </p>
      </div>

      <div className="space-y-4">
        {/* Flat lesson mode: show all lessons in a single list */}
        {flatLessonMode ? (
          <div className={`border rounded-lg overflow-hidden ${lessonListBg}`}>
            {allLessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className={`flex items-center justify-between p-4 border-b ${lessonBorder} last:border-0 ${lessonItemBg} transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  {lesson.type === 'video' ? (
                    <PlayCircle className="w-5 h-5 text-brand-secondary" />
                  ) : (
                    <FileText className={darkMode ? 'w-5 h-5 text-gray-500' : 'w-5 h-5 text-gray-400'} />
                  )}
                  <span className={lesson.completed ? lessonTextCompleted : lessonText}>
                    {lesson.title}
                  </span>
                  {lesson.preview && (
                    <span className="text-xs bg-brand-secondary/10 text-brand-secondary px-2 py-1 rounded">
                      Előnézet
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {lesson.duration && (
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{lesson.duration}</span>
                  )}
                  {lesson.completed && <Check className="w-4 h-4 text-green-500" />}
                  {lesson.locked && <Lock className={darkMode ? 'w-4 h-4 text-gray-600' : 'w-4 h-4 text-gray-400'} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Module accordion mode: group lessons by module */
          modules.map((module, index) => (
            <details key={module.id} className={`group border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg overflow-hidden`}>
              <summary className={`cursor-pointer list-none p-4 ${moduleSummaryBg} transition-colors duration-200`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-bold ${headingClass}`}>
                      {index + 1}. {module.title}
                    </h3>
                    {module.description && (
                      <p className={`text-sm ${subtextClass} mt-1`}>{module.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {module.lessons.length} {module.lessons.length === 1 ? lessonLabel : lessonsLabel}
                    </span>
                    <svg
                      className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-500'} transition-transform duration-200 group-open:rotate-180`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </summary>

              <div className={`${moduleContentBg} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-4 border-b ${lessonBorder} last:border-0 ${lessonItemBg} transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      {lesson.type === 'video' ? (
                        <PlayCircle className="w-5 h-5 text-brand-secondary" />
                      ) : (
                        <FileText className={darkMode ? 'w-5 h-5 text-gray-500' : 'w-5 h-5 text-gray-400'} />
                      )}
                      <span className={lesson.completed ? lessonTextCompleted : lessonText}>
                        {lesson.title}
                      </span>
                      {lesson.preview && (
                        <span className="text-xs bg-brand-secondary/10 text-brand-secondary px-2 py-1 rounded">
                          Előnézet
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {lesson.duration && (
                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{lesson.duration}</span>
                      )}
                      {lesson.completed && <Check className="w-4 h-4 text-green-500" />}
                      {lesson.locked && <Lock className={darkMode ? 'w-4 h-4 text-gray-600' : 'w-4 h-4 text-gray-400'} />}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </motion.section>
  );
}
