'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CourseType, COURSE_TYPE_LABELS } from '@/types';
import { useCoursesByType } from '@/hooks/useCoursesByType';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { NavDropdownCourseCard } from './NavDropdownCourseCard';

interface CourseTypeDropdownProps {
  courseType: CourseType;
  isOpen: boolean;
}

const TYPE_CONFIG: Record<CourseType, { url: string; color: string; hoverBg: string }> = {
  WEBINAR: { url: '/webinar', color: 'text-purple-600', hoverBg: 'hover:bg-purple-50' },
  ACADEMIA: { url: '/akademia', color: 'text-blue-600', hoverBg: 'hover:bg-blue-50' },
  MASTERCLASS: { url: '/masterclass', color: 'text-amber-600', hoverBg: 'hover:bg-amber-50' },
  PODCAST: { url: '/podcast', color: 'text-green-600', hoverBg: 'hover:bg-green-50' },
};

export function CourseTypeDropdown({ courseType, isOpen }: CourseTypeDropdownProps) {
  const { data: courses, isLoading } = useCoursesByType(courseType, 4);
  const { data: instructors } = useInstructors();

  const config = TYPE_CONFIG[courseType];
  const label = COURSE_TYPE_LABELS[courseType];

  if (!isOpen) return null;

  const featuredCourse = courses?.[0];
  const gridCourses = courses?.slice(1, 4) || [];

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[420px] z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4">
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-40 h-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="w-12 h-9 bg-gray-100 rounded animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-2 bg-gray-100 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="space-y-4">
          {/* Featured course */}
          {featuredCourse && (
            <NavDropdownCourseCard
              course={featuredCourse}
              variant="featured"
              instructors={instructors}
            />
          )}

          {/* Divider */}
          {gridCourses.length > 0 && (
            <div className="border-t border-gray-100" />
          )}

          {/* Grid courses */}
          {gridCourses.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
              {gridCourses.map((course) => (
                <NavDropdownCourseCard
                  key={course.id}
                  course={course}
                  variant="grid"
                  instructors={instructors}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          Nincs elérhető tartalom
        </div>
      )}

      {/* View all link */}
      <div className="border-t border-gray-100 mt-4 pt-3">
        <Link
          href={config.url}
          className={`flex items-center justify-between text-sm font-medium ${config.color} ${config.hoverBg} rounded-lg px-3 py-2 transition-colors`}
        >
          <span>Összes {label.toLowerCase()} megtekintése</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      </div>
    </div>
  );
}
