'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Filter } from 'lucide-react';
import Link from 'next/link';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { getCourseUrl } from '@/lib/routing';

// Dynamic import of CoursesHero Framer component
const CoursesHero = dynamic(
  () => import('@framer/courses-hero').then(m => m.default.Responsive || m.default),
  { ssr: false, loading: () => <div className="w-full h-[500px] bg-gray-100 animate-pulse" /> }
);

interface Course {
  id: string;
  title: string;
  courseType: string;
  thumbnailUrl?: string;
}

interface Instructor {
  id: string;
  name: string;
}

interface CoursesHeroSectionProps {
  courses: Course[];
  categories: Array<{ id: string; name: string }>;
  targetAudiences: Array<{ id: string; name: string }>;
  instructors?: Instructor[];
  selectedCategories: string[];
  selectedTargetAudiences: string[];
  selectedCourseTypes: string[];
  selectedInstructors: string[];
  onCategoriesChange: (ids: string[]) => void;
  onTargetAudiencesChange: (ids: string[]) => void;
  onCourseTypesChange: (types: string[]) => void;
  onInstructorsChange: (ids: string[]) => void;
  onClearFilters: () => void;
}

const COURSE_TYPE_OPTIONS = [
  { value: 'WEBINAR', label: 'Webinár' },
  { value: 'ACADEMIA', label: 'Akadémia' },
  { value: 'MASTERCLASS', label: 'Masterclass' },
  { value: 'PODCAST', label: 'Podcast' },
];

const COURSE_TYPE_LABELS: Record<string, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
};

export function CoursesHeroSection({
  courses,
  categories,
  targetAudiences,
  instructors = [],
  selectedCategories,
  selectedTargetAudiences,
  selectedCourseTypes,
  selectedInstructors,
  onCategoriesChange,
  onTargetAudiencesChange,
  onCourseTypesChange,
  onInstructorsChange,
  onClearFilters,
}: CoursesHeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters = selectedCategories.length > 0 || selectedTargetAudiences.length > 0 || selectedCourseTypes.length > 0 || selectedInstructors.length > 0;

  // Filter suggestions based on search query
  const suggestions = searchQuery.length >= 2
    ? courses
        .filter(course =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prepare options for dropdowns
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const audienceOptions = targetAudiences.map(a => ({ value: a.id, label: a.name }));
  const instructorOptions = instructors.map(i => ({ value: i.id, label: i.name }));

  // Get selected names for badges
  const activeFilterCount = selectedCategories.length + selectedTargetAudiences.length + selectedCourseTypes.length + selectedInstructors.length;

  return (
    <div>
      {/* Framer Hero - with CSS to hide buttons and stats */}
      <style jsx global>{`
        /* Hide the buttons in the Framer hero */
        .framer-awkb0t {
          display: none !important;
        }
        /* Hide the metrics/stats bar */
        .framer-19nkyt9-container {
          display: none !important;
        }
        /* Hide the "20 éve a magyar vállalkozások mellett" badge */
        .framer-rt7a07-container {
          display: none !important;
        }
      `}</style>

      <CoursesHero width="100%" style={{ width: '100%', maxWidth: '100%' }} />

      {/* Search & Filter Bar - positioned below hero */}
      <div className="bg-[rgb(249,250,251)] relative z-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-12 xl:px-20 pt-12 pb-8">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <motion.div
              ref={searchRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mb-4"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Keress kurzusok, témák vagy oktatók között..."
                  className="w-full pl-14 pr-14 py-4 bg-white rounded-2xl border border-gray-200 shadow-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 focus:border-brand-secondary transition-all text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-10"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  >
                    {suggestions.map((course) => (
                      <Link
                        key={course.id}
                        href={getCourseUrl(course)}
                        onClick={() => {
                          setShowSuggestions(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-secondary to-purple-600 flex items-center justify-center">
                            <Search className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {course.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {COURSE_TYPE_LABELS[course.courseType] || course.courseType}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-lg p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-4">
                {/* Filter Icon */}
                <div className="flex items-center gap-2 text-gray-700 md:pt-6">
                  <Filter className="w-5 h-5" />
                  <span className="font-medium text-sm">Szűrők</span>
                  {hasActiveFilters && (
                    <span className="w-5 h-5 rounded-full bg-brand-secondary text-white text-xs flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                  {/* Category Filter - now "Területek" */}
                  <MultiSelectDropdown
                    label="Területek"
                    placeholder="Összes terület"
                    options={categoryOptions}
                    selected={selectedCategories}
                    onChange={onCategoriesChange}
                  />

                  {/* Course Type Filter - now "Tartalmak" */}
                  <MultiSelectDropdown
                    label="Tartalmak"
                    placeholder="Összes tartalom"
                    options={COURSE_TYPE_OPTIONS}
                    selected={selectedCourseTypes}
                    onChange={onCourseTypesChange}
                  />

                  {/* Target Audience Filter */}
                  <MultiSelectDropdown
                    label="Célközönség"
                    placeholder="Összes célközönség"
                    options={audienceOptions}
                    selected={selectedTargetAudiences}
                    onChange={onTargetAudiencesChange}
                  />

                  {/* Instructor Filter - now "Mentorok" */}
                  <MultiSelectDropdown
                    label="Mentorok"
                    placeholder="Összes mentor"
                    options={instructorOptions}
                    selected={selectedInstructors}
                    onChange={onInstructorsChange}
                  />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onClearFilters}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all md:mt-5"
                  >
                    <X className="w-4 h-4" />
                    Törlés
                  </motion.button>
                )}
              </div>

              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-100"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">Aktív szűrők:</span>

                    {selectedCategories.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      if (!cat) return null;
                      return (
                        <motion.span
                          key={catId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-secondary/10 text-brand-secondary rounded-full text-sm font-medium"
                        >
                          {cat.name}
                          <button
                            onClick={() => onCategoriesChange(selectedCategories.filter(id => id !== catId))}
                            className="hover:bg-brand-secondary/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.span>
                      );
                    })}

                    {selectedCourseTypes.map(type => (
                      <motion.span
                        key={type}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                      >
                        {COURSE_TYPE_LABELS[type]}
                        <button
                          onClick={() => onCourseTypesChange(selectedCourseTypes.filter(t => t !== type))}
                          className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.span>
                    ))}

                    {selectedTargetAudiences.map(audId => {
                      const aud = targetAudiences.find(a => a.id === audId);
                      if (!aud) return null;
                      return (
                        <motion.span
                          key={audId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                        >
                          {aud.name}
                          <button
                            onClick={() => onTargetAudiencesChange(selectedTargetAudiences.filter(id => id !== audId))}
                            className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.span>
                      );
                    })}

                    {selectedInstructors.map(instId => {
                      const inst = instructors.find(i => i.id === instId);
                      if (!inst) return null;
                      return (
                        <motion.span
                          key={instId}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                        >
                          {inst.name}
                          <button
                            onClick={() => onInstructorsChange(selectedInstructors.filter(id => id !== instId))}
                            className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
