'use client';

import React from 'react';
import { Lesson } from '@/types';

interface NewLessonContentProps {
  lesson: Lesson;
  moduleName?: string;
  moduleNumber?: number;
  showTitle?: boolean; // Control whether to show title/breadcrumb
}

/**
 * NewLessonContent Component
 * Displays lesson information below the video player
 * Includes: title, breadcrumb, description, learning outcomes
 */
export function NewLessonContent({
  lesson,
  moduleName,
  moduleNumber,
  showTitle = false,
}: NewLessonContentProps) {
  return (
    <div className="space-y-8">
      {/* Lesson Title and Breadcrumb (Optional) */}
      {showTitle && (
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {lesson.title}
          </h1>
          {moduleName && (
            <p className="text-sm text-gray-600">
              {moduleNumber}. Modul: {moduleName}
            </p>
          )}
        </div>
      )}

      {/* About the Lesson Section */}
      {lesson.description && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900">A leckéről</h2>
          <p className="text-gray-700 leading-relaxed">
            {lesson.description}
          </p>
        </div>
      )}

      {/* What You'll Learn Section */}
      {lesson.learningOutcomes && lesson.learningOutcomes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Amit megtanulsz:</h2>
          <ul className="space-y-2">
            {lesson.learningOutcomes.map((outcome, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-700"
              >
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-brand-secondary/50 rounded-full mt-2" />
                <span className="leading-relaxed">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lesson Content (for text-based lessons) */}
      {lesson.content && lesson.type !== 'VIDEO' && (
        <div className="space-y-3">
          <div
            className="prose prose-gray max-w-none leading-relaxed"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        </div>
      )}

      {/* Resources Section (if available) */}
      {lesson.resources && lesson.resources.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Források és anyagok</h2>
          <ul className="space-y-2">
            {lesson.resources.map((resource, index) => (
              <li key={index}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-secondary hover:text-brand-secondary-hover hover:underline font-medium"
                >
                  {resource.title}
                </a>
                {resource.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {resource.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

