'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ChevronDown, Filter } from 'lucide-react';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useTargetAudiences } from '@/hooks/useTargetAudienceQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { cn } from '@/lib/utils';

const COURSE_TYPE_OPTIONS = [
  { value: 'ACADEMIA', label: 'Akadémia' },
  { value: 'WEBINAR', label: 'Webinár' },
  { value: 'MASTERCLASS', label: 'Masterclass' },
  { value: 'PODCAST', label: 'Podcast' },
];

export interface DashboardFilters {
  query: string;
  categoryId: string | null;
  audienceId: string | null;
  courseType: string | null;
  instructorId: string | null;
}

interface DashboardSearchProps {
  className?: string;
  onFilterChange?: (filters: DashboardFilters) => void;
  courseType?: 'MASTERCLASS' | 'WEBINAR' | 'ACADEMIA' | 'PODCAST';
}

export function DashboardSearch({ className, onFilterChange, courseType }: DashboardSearchProps) {
  const router = useRouter();
  const { data: courses } = useCourses();
  const { data: categories } = useCategories();
  const { data: targetAudiences } = useTargetAudiences();
  const { data: instructors } = useInstructors();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null);
  const [selectedCourseType, setSelectedCourseType] = useState<string | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter courses based on query and filters
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    let results = courses;

    // Filter by search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      results = results.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (selectedCategory) {
      results = results.filter(course => {
        if (course.categoryIds?.includes(selectedCategory)) return true;
        if (course.category?.id === selectedCategory) return true;
        if ((course as any).categoryId === selectedCategory) return true;
        return false;
      });
    }

    // Filter by target audience
    if (selectedAudience) {
      results = results.filter(course =>
        course.targetAudienceIds?.includes(selectedAudience)
      );
    }

    // Filter by course type
    if (selectedCourseType) {
      results = results.filter(course => course.courseType === selectedCourseType);
    }

    // Filter by instructor
    if (selectedInstructor) {
      results = results.filter(course =>
        (course as any).instructorId === selectedInstructor ||
        (course as any).instructorIds?.includes(selectedInstructor)
      );
    }

    return results.slice(0, 8); // Limit to 8 results
  }, [courses, query, selectedCategory, selectedAudience, selectedCourseType, selectedInstructor]);

  const handleSelect = (courseId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/courses/${courseId}`);
  };

  const handleSearch = () => {
    // Apply filters in-place instead of redirecting
    onFilterChange?.({
      query: query.trim(),
      categoryId: selectedCategory,
      audienceId: selectedAudience,
      courseType: selectedCourseType,
      instructorId: selectedInstructor,
    });
    setIsOpen(false);
    setShowFilters(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedAudience(null);
    setSelectedCourseType(null);
    setSelectedInstructor(null);
    setQuery('');
    onFilterChange?.({
      query: '',
      categoryId: null,
      audienceId: null,
      courseType: null,
      instructorId: null,
    });
  };

  const hasActiveFilters = selectedCategory || selectedAudience || selectedCourseType || selectedInstructor;

  const selectedCategoryName = categories?.find(c => c.id === selectedCategory)?.name;
  const selectedAudienceName = targetAudiences?.find(a => a.id === selectedAudience)?.name;
  const selectedCourseTypeName = COURSE_TYPE_OPTIONS.find(t => t.value === selectedCourseType)?.label;
  const selectedInstructorName = instructors?.find(i => i.id === selectedInstructor)?.name;

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-2xl mx-auto', className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm focus-within:border-brand-secondary focus-within:ring-2 focus-within:ring-brand-secondary/20 transition-all">
          <div className="pl-4">
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Tartalom keresése..."
            className="flex-1 px-3 py-3 text-gray-900 placeholder-gray-500 bg-transparent outline-none"
          />

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1 mr-2">
              {selectedCategoryName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">
                  {selectedCategoryName}
                </span>
              )}
              {selectedCourseTypeName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {selectedCourseTypeName}
                </span>
              )}
              {selectedAudienceName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                  {selectedAudienceName}
                </span>
              )}
              {selectedInstructorName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {selectedInstructorName}
                </span>
              )}
            </div>
          )}

          {/* Clear button */}
          {(query || hasActiveFilters) && (
            <button
              onClick={() => {
                setQuery('');
                clearFilters();
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Filter toggle button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1 px-3 py-2 mr-1 rounded-lg text-sm font-medium transition-colors',
              showFilters || hasActiveFilters
                ? 'bg-brand-secondary/10 text-brand-secondary'
                : 'text-gray-500 hover:bg-gray-100'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Szűrők</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-brand-secondary text-white text-xs flex items-center justify-center">
                {(selectedCategory ? 1 : 0) + (selectedAudience ? 1 : 0) + (selectedCourseType ? 1 : 0) + (selectedInstructor ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Search button */}
          <button
            onClick={handleSearch}
            className="px-4 py-2 mr-1 bg-brand-secondary text-white rounded-lg text-sm font-medium hover:bg-brand-secondary/90 transition-colors"
          >
            Keresés
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute left-0 right-0 mt-2 p-4 bg-white rounded-xl border border-gray-200 shadow-lg z-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Szűrők</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-brand-secondary hover:text-brand-secondary/80"
              >
                Szűrők törlése
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Kategória
              </label>
              <div className="relative">
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
                >
                  <option value="">Összes kategória</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Course Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Típus
              </label>
              <div className="relative">
                <select
                  value={selectedCourseType || ''}
                  onChange={(e) => setSelectedCourseType(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
                >
                  <option value="">Összes típus</option>
                  {COURSE_TYPE_OPTIONS.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Target Audience Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Célközönség
              </label>
              <div className="relative">
                <select
                  value={selectedAudience || ''}
                  onChange={(e) => setSelectedAudience(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
                >
                  <option value="">Összes célközönség</option>
                  {targetAudiences?.map(audience => (
                    <option key={audience.id} value={audience.id}>
                      {audience.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Instructor Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {courseType === 'PODCAST' ? 'Vendég' : 'Mentor'}
              </label>
              <div className="relative">
                <select
                  value={selectedInstructor || ''}
                  onChange={(e) => setSelectedInstructor(e.target.value || null)}
                  className="w-full px-3 py-2 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary"
                >
                  <option value="">{courseType === 'PODCAST' ? 'Összes vendég' : 'Összes mentor'}</option>
                  {instructors?.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (query.trim() || filteredCourses.length > 0) && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-10 overflow-hidden">
          {filteredCourses.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b border-gray-100">
                {query.trim() ? 'Találatok' : 'Ajánlott tartalmak'}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {filteredCourses.map((course) => (
                  <li key={course.id}>
                    <button
                      onClick={() => handleSelect(course.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      {/* Thumbnail */}
                      {course.thumbnailUrl && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={course.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {course.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {course.courseType && (
                            <span className="text-xs text-gray-500">
                              {course.courseType === 'MASTERCLASS' && 'Masterclass'}
                              {course.courseType === 'WEBINAR' && 'Webinár'}
                              {course.courseType === 'ACADEMIA' && 'Akadémia'}
                              {course.courseType === 'PODCAST' && 'Podcast'}
                            </span>
                          )}
                          {course.duration && (
                            <span className="text-xs text-gray-400">• {course.duration}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              {/* View all results */}
              {query.trim() && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                  <button
                    onClick={handleSearch}
                    className="text-sm text-brand-secondary hover:text-brand-secondary/80 font-medium"
                  >
                    Összes találat megtekintése →
                  </button>
                </div>
              )}
            </>
          ) : query.trim() ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">Nincs találat</p>
              <p className="text-xs text-gray-400 mt-1">Próbálj más keresési kifejezést</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
