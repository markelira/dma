'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Course, Instructor } from '@/types';

interface NavDropdownCourseCardProps {
  course: Course;
  variant: 'featured' | 'grid';
  instructors?: Instructor[];
}

export function NavDropdownCourseCard({ course, variant, instructors }: NavDropdownCourseCardProps) {
  // Get instructor name
  const getInstructorName = () => {
    if (course.instructorIds && course.instructorIds.length > 0 && instructors) {
      const instructor = instructors.find(i => i.id === course.instructorIds![0]);
      if (instructor) return instructor.name;
    }
    if (course.instructorId && instructors) {
      const instructor = instructors.find(i => i.id === course.instructorId);
      if (instructor) return instructor.name;
    }
    return null;
  };

  const instructorName = getInstructorName();
  const courseUrl = `/courses/${course.slug || course.id}`;

  if (variant === 'featured') {
    return (
      <Link href={courseUrl} className="block group">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <span className="text-gray-400 text-xs">Nincs kép</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
              {course.title}
            </h4>
            {instructorName && (
              <p className="text-xs text-gray-500 mt-1">{instructorName}</p>
            )}
            {course.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {course.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant - compact card
  return (
    <Link href={courseUrl} className="block group">
      <div className="flex gap-3">
        {/* Small thumbnail */}
        <div className="relative w-16 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-xs line-clamp-2 group-hover:text-blue-600 transition-colors">
            {course.title}
          </h4>
          {instructorName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{instructorName}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
