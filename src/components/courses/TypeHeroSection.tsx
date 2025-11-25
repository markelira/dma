'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, BookOpen, Video, GraduationCap, Mic, LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  courseType: string;
  thumbnailUrl?: string;
}

interface TypeHeroSectionProps {
  courseType: 'ACADEMIA' | 'WEBINAR' | 'MASTERCLASS' | 'PODCAST';
  courses: Course[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface TypeConfig {
  gradient: string;
  label: string;
  headline: string;
  tagline: string;
  searchPlaceholder: string;
  icon: LucideIcon;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  ACADEMIA: {
    gradient: 'from-brand-secondary to-cyan-600',
    label: 'Akadémia',
    headline: 'Akadémia',
    tagline: 'Hosszú, több leckéből álló képzések videókkal.',
    searchPlaceholder: 'Keress akadémia tartalmak között...',
    icon: BookOpen,
  },
  WEBINAR: {
    gradient: 'from-purple-500 to-purple-700',
    label: 'Webinár',
    headline: 'Webinárok',
    tagline: 'Egyszeri, 1 videós alkalmak erőforrásokkal.',
    searchPlaceholder: 'Keress webinárok között...',
    icon: Video,
  },
  MASTERCLASS: {
    gradient: 'from-amber-500 to-orange-600',
    label: 'Masterclass',
    headline: 'Masterclass',
    tagline: 'Átfogó, több modulból álló mestertartalmak.',
    searchPlaceholder: 'Keress masterclass tartalmak között...',
    icon: GraduationCap,
  },
  PODCAST: {
    gradient: 'from-green-500 to-emerald-600',
    label: 'Podcast',
    headline: 'Podcastok',
    tagline: 'Podcast epizódok audio- vagy videótartalommal.',
    searchPlaceholder: 'Keress podcastok között...',
    icon: Mic,
  },
};

const COURSE_TYPE_LABELS: Record<string, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
};

export function TypeHeroSection({
  courseType,
  courses,
  searchQuery,
  onSearchChange,
}: TypeHeroSectionProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const config = TYPE_CONFIG[courseType];
  const Icon = config.icon;

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

  return (
    <div className="pt-[100px] pb-6">
      <div className="max-w-[1440px] mx-auto px-5 md:px-[26px] lg:px-[80px]">
        {/* Simple Header - Netflix style */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          {/* Title Section */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {config.headline}
              </h1>
              <p className="text-gray-500 mt-1">
                {config.tagline}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <motion.div
            ref={searchRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full md:w-[400px]"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={config.searchPlaceholder}
                className="w-full pl-12 pr-12 py-3 bg-gray-100 rounded-xl border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    onSearchChange('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
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
                      href={`/courses/${course.id}`}
                      onClick={() => {
                        setShowSuggestions(false);
                        onSearchChange('');
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
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
        </div>
      </div>
    </div>
  );
}
