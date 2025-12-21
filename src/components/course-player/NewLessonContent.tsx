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
 * Helper function to format plain text content into readable HTML
 * Converts double newlines to paragraphs, single newlines to <br>
 */
function formatTextContent(content: string): string {
  // Check if content already has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtmlTags) {
    return content;
  }

  // Plain text - convert to readable HTML with paragraphs
  const paragraphs = content.split(/\n\s*\n/);

  return paragraphs
    .map(para => {
      const withBreaks = para.trim().replace(/\n/g, '<br>');
      return `<p>${withBreaks}</p>`;
    })
    .filter(p => p !== '<p></p>')
    .join('\n');
}

/**
 * NewLessonContent Component
 * Displays lesson information below the video player
 * Includes: title, breadcrumb, description, learning outcomes
 *
 * Wrapped in React.memo to prevent unnecessary re-renders
 */
export const NewLessonContent = React.memo(function NewLessonContent({
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
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Tartalom</h2>
          <div
            className="prose prose-lg prose-gray max-w-none
                       prose-headings:text-gray-900 prose-headings:font-bold prose-headings:leading-tight
                       prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                       prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                       prose-p:text-gray-700 prose-p:leading-loose prose-p:mb-6 prose-p:text-lg
                       prose-li:text-gray-700 prose-li:text-lg prose-li:leading-relaxed
                       prose-ul:my-6 prose-ol:my-6
                       prose-a:text-brand-secondary prose-a:no-underline hover:prose-a:underline
                       prose-strong:text-gray-900 prose-strong:font-semibold
                       prose-blockquote:border-l-brand-secondary prose-blockquote:text-gray-600 prose-blockquote:italic
                       prose-img:rounded-lg prose-img:shadow-md
                       [&_*]:!bg-transparent
                       [&_p]:mb-6 [&_p]:leading-loose [&_p]:text-lg
                       bg-white rounded-lg"
            dangerouslySetInnerHTML={{ __html: formatTextContent(lesson.content) }}
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
});

