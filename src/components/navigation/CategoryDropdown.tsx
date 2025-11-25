'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useCourses } from '@/hooks/useCourseQueries';

interface CategoryDropdownProps {
  isOpen: boolean;
}

export function CategoryDropdown({ isOpen }: CategoryDropdownProps) {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: courses } = useCourses();

  if (!isOpen) return null;

  // Count courses per category
  const getCourseCount = (categoryId: string): number => {
    if (!courses) return 0;
    return courses.filter(course =>
      course.categoryIds?.includes(categoryId) || course.categoryId === categoryId
    ).length;
  };

  // Filter categories that have at least one course and sort by course count
  const categoriesWithCourses = categories
    ?.map(cat => ({ ...cat, count: getCourseCount(cat.id) }))
    .filter(cat => cat.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Show top 8 categories

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-64 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
      {categoriesLoading ? (
        // Loading skeleton
        <div className="px-3 py-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-8" />
            </div>
          ))}
        </div>
      ) : categoriesWithCourses && categoriesWithCourses.length > 0 ? (
        <>
          {categoriesWithCourses.map((category) => (
            <Link
              key={category.id}
              href={`/courses?category=${category.id}`}
              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">{category.name}</span>
              <span className="text-gray-400 text-xs">({category.count})</span>
            </Link>
          ))}
        </>
      ) : (
        <div className="px-4 py-3 text-center text-gray-500 text-sm">
          Nincsenek kategóriák
        </div>
      )}

      {/* View all link */}
      <div className="border-t border-gray-100 mt-2 pt-2 px-2">
        <Link
          href="/courses"
          className="flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg px-2 py-2 transition-colors"
        >
          <span>Összes tartalom</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      </div>
    </div>
  );
}
