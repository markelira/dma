'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Filter } from 'lucide-react';
import { useCourses } from '@/hooks/useCourseQueries';
import { useCategories } from '@/hooks/useCategoryQueries';
import { useTargetAudiences } from '@/hooks/useTargetAudienceQueries';
import { useInstructors } from '@/hooks/useInstructorQueries';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { cn } from '@/lib/utils';

const COURSE_TYPE_OPTIONS = [
  { value: 'WEBINAR', label: 'Webinár' },
  { value: 'ACADEMIA', label: 'Akadémia' },
  { value: 'MASTERCLASS', label: 'Masterclass' },
  { value: 'PODCAST', label: 'Podcast' },
];

export interface DashboardFilters {
  query: string;
  categoryIds: string[];
  audienceIds: string[];
  courseTypes: string[];
  instructorIds: string[];
}

interface DashboardSearchProps {
  className?: string;
  onFilterChange?: (filters: DashboardFilters) => void;
  courseType?: 'MASTERCLASS' | 'WEBINAR' | 'ACADEMIA' | 'PODCAST';
  hideCourseTypeFilter?: boolean;
}

export function DashboardSearch({ className, onFilterChange, courseType, hideCourseTypeFilter }: DashboardSearchProps) {
  const router = useRouter();
  const { data: courses } = useCourses();
  const { data: categories } = useCategories();
  const { data: targetAudiences } = useTargetAudiences();
  const { data: instructors } = useInstructors();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedCourseTypes, setSelectedCourseTypes] = useState<string[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

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

  // Auto-apply filters when any filter selection changes
  useEffect(() => {
    // Skip initial mount
    if (selectedCategories.length === 0 && selectedAudiences.length === 0 &&
        selectedCourseTypes.length === 0 && selectedInstructors.length === 0) {
      return;
    }

    onFilterChange?.({
      query: query.trim(),
      categoryIds: selectedCategories,
      audienceIds: selectedAudiences,
      courseTypes: selectedCourseTypes,
      instructorIds: selectedInstructors,
    });
  }, [selectedCategories, selectedAudiences, selectedCourseTypes, selectedInstructors]);

  // Filter courses based on query and filters
  const filteredCourses = useMemo(() => {
    if (!courses) return [];

    let results = courses;

    // Filter by courseType if prop is provided (for type-specific pages)
    if (courseType) {
      results = results.filter(course => course.courseType === courseType);
    }

    // Filter by search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      results = results.filter(course =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by categories (OR logic)
    if (selectedCategories.length > 0) {
      results = results.filter(course => {
        return selectedCategories.some(catId => {
          if (course.categoryIds?.includes(catId)) return true;
          if (course.category?.id === catId) return true;
          if ((course as any).categoryId === catId) return true;
          return false;
        });
      });
    }

    // Filter by target audiences (OR logic)
    if (selectedAudiences.length > 0) {
      results = results.filter(course =>
        selectedAudiences.some(audId => course.targetAudienceIds?.includes(audId))
      );
    }

    // Filter by course types (OR logic)
    if (selectedCourseTypes.length > 0) {
      results = results.filter(course =>
        selectedCourseTypes.includes(course.courseType)
      );
    }

    // Filter by instructors (OR logic)
    if (selectedInstructors.length > 0) {
      results = results.filter(course =>
        selectedInstructors.some(instId =>
          (course as any).instructorId === instId ||
          (course as any).instructorIds?.includes(instId)
        )
      );
    }

    return results.slice(0, 8); // Limit to 8 results
  }, [courses, query, selectedCategories, selectedAudiences, selectedCourseTypes, selectedInstructors, courseType]);

  const handleSelect = (courseId: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/courses/${courseId}`);
  };

  const handleSearch = () => {
    // Apply filters in-place instead of redirecting
    onFilterChange?.({
      query: query.trim(),
      categoryIds: selectedCategories,
      audienceIds: selectedAudiences,
      courseTypes: selectedCourseTypes,
      instructorIds: selectedInstructors,
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
    setSelectedCategories([]);
    setSelectedAudiences([]);
    setSelectedCourseTypes([]);
    setSelectedInstructors([]);
    setQuery('');
    onFilterChange?.({
      query: '',
      categoryIds: [],
      audienceIds: [],
      courseTypes: [],
      instructorIds: [],
    });
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedAudiences.length > 0 || selectedCourseTypes.length > 0 || selectedInstructors.length > 0;
  const activeFilterCount = selectedCategories.length + selectedAudiences.length + selectedCourseTypes.length + selectedInstructors.length;

  // Get selected names for badges
  const selectedCategoryNames = selectedCategories.map(id => categories?.find(c => c.id === id)?.name).filter(Boolean);
  const selectedAudienceNames = selectedAudiences.map(id => targetAudiences?.find(a => a.id === id)?.name).filter(Boolean);
  const selectedCourseTypeNames = selectedCourseTypes.map(type => COURSE_TYPE_OPTIONS.find(t => t.value === type)?.label).filter(Boolean);
  const selectedInstructorNames = selectedInstructors.map(id => instructors?.find(i => i.id === id)?.name).filter(Boolean);

  // Prepare options for dropdowns
  const categoryOptions = categories?.map(c => ({ value: c.id, label: c.name })) || [];
  const audienceOptions = targetAudiences?.map(a => ({ value: a.id, label: a.name })) || [];
  const instructorOptions = instructors?.map(i => ({ value: i.id, label: i.name })) || [];

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
              {selectedCategoryNames.slice(0, 1).map((name, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-secondary/10 text-brand-secondary">
                  {name}
                </span>
              ))}
              {selectedCourseTypeNames.slice(0, 1).map((name, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {name}
                </span>
              ))}
              {activeFilterCount > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{activeFilterCount - 2}
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
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search button - Hidden on mobile since filters auto-apply */}
          <button
            onClick={handleSearch}
            className="hidden sm:inline-flex px-4 py-2 mr-1 bg-brand-secondary text-white rounded-lg text-sm font-medium hover:bg-brand-secondary/90 transition-colors"
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
            {/* Category Filter - now "Területek" */}
            <MultiSelectDropdown
              label="Területek"
              placeholder="Összes terület"
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />

            {/* Course Type Filter - now "Tartalmak" */}
            {!hideCourseTypeFilter && (
              <MultiSelectDropdown
                label="Tartalmak"
                placeholder="Összes tartalom"
                options={COURSE_TYPE_OPTIONS}
                selected={selectedCourseTypes}
                onChange={setSelectedCourseTypes}
              />
            )}

            {/* Target Audience Filter */}
            <MultiSelectDropdown
              label="Célközönség"
              placeholder="Összes célközönség"
              options={audienceOptions}
              selected={selectedAudiences}
              onChange={setSelectedAudiences}
            />

            {/* Instructor Filter - now "Mentorok" */}
            <MultiSelectDropdown
              label={courseType === 'PODCAST' ? 'Vendégek' : 'Mentorok'}
              placeholder={courseType === 'PODCAST' ? 'Összes vendég' : 'Összes mentor'}
              options={instructorOptions}
              selected={selectedInstructors}
              onChange={setSelectedInstructors}
            />
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
