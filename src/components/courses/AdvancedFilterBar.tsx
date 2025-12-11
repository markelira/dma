'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, X, Filter } from 'lucide-react'
import Link from 'next/link'
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown'

interface Course {
  id: string
  title: string
  courseType: string
  thumbnailUrl?: string
}

interface Instructor {
  id: string
  name: string
}

interface AdvancedFilterBarProps {
  courses?: Course[]
  categories: Array<{ id: string; name: string }>
  targetAudiences: Array<{ id: string; name: string }>
  instructors?: Instructor[]
  selectedCategories: string[]
  selectedTargetAudiences: string[]
  selectedCourseTypes: string[]
  selectedInstructors: string[]
  onCategoriesChange: (ids: string[]) => void
  onTargetAudiencesChange: (ids: string[]) => void
  onCourseTypesChange: (types: string[]) => void
  onInstructorsChange: (ids: string[]) => void
  onClearFilters: () => void
  backgroundColor?: 'light' | 'dark'
}

const COURSE_TYPE_OPTIONS = [
  { value: 'WEBINAR', label: 'Webinár' },
  { value: 'ACADEMIA', label: 'Akadémia' },
  { value: 'MASTERCLASS', label: 'Masterclass' },
  { value: 'PODCAST', label: 'Podcast' },
]

const COURSE_TYPE_LABELS: Record<string, string> = {
  ACADEMIA: 'Akadémia',
  WEBINAR: 'Webinár',
  MASTERCLASS: 'Masterclass',
  PODCAST: 'Podcast',
}

export function AdvancedFilterBar({
  courses = [],
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
  backgroundColor = 'light',
}: AdvancedFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const isDark = backgroundColor === 'dark'
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedTargetAudiences.length > 0 ||
    selectedCourseTypes.length > 0 ||
    selectedInstructors.length > 0

  // Filter suggestions based on search query
  const suggestions =
    searchQuery.length >= 2
      ? courses
          .filter((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 5)
      : []

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Prepare options for dropdowns
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))
  const audienceOptions = targetAudiences.map((a) => ({ value: a.id, label: a.name }))
  const instructorOptions = instructors.map((i) => ({ value: i.id, label: i.name }))

  // Get selected names for badges
  const activeFilterCount =
    selectedCategories.length +
    selectedTargetAudiences.length +
    selectedCourseTypes.length +
    selectedInstructors.length

  return (
    <div className="w-full">
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
            <Search
              className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 z-10 ${
                isDark ? 'text-gray-400' : 'text-gray-400'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Keress kurzusok, témák vagy oktatók között..."
              className={`w-full pl-14 pr-14 py-4 rounded-2xl border shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary/50 focus:border-brand-secondary transition-all text-base ${
                isDark
                  ? 'bg-gray-900/80 border-white/20 text-white placeholder-gray-400'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setShowSuggestions(false)
                }}
                className={`absolute right-5 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors z-10 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
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
                className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border overflow-hidden z-50 ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
                }`}
              >
                {suggestions.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    onClick={() => {
                      setShowSuggestions(false)
                      setSearchQuery('')
                    }}
                    className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
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
                      <p
                        className={`text-sm font-medium line-clamp-1 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {course.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
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
          className={`rounded-2xl border shadow-lg p-4 md:p-6 ${
            isDark
              ? 'bg-gray-900/80 backdrop-blur-xl border-white/20'
              : 'bg-white/80 backdrop-blur-xl border-gray-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-4">
            {/* Filter Icon */}
            <div
              className={`flex items-center gap-2 md:pt-6 ${isDark ? 'text-white' : 'text-gray-700'}`}
            >
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
              {/* Category Filter - "Területek" */}
              <MultiSelectDropdown
                label="Területek"
                placeholder="Összes terület"
                options={categoryOptions}
                selected={selectedCategories}
                onChange={onCategoriesChange}
                isDark={isDark}
              />

              {/* Course Type Filter - "Tartalmak" */}
              <MultiSelectDropdown
                label="Tartalmak"
                placeholder="Összes tartalom"
                options={COURSE_TYPE_OPTIONS}
                selected={selectedCourseTypes}
                onChange={onCourseTypesChange}
                isDark={isDark}
              />

              {/* Target Audience Filter */}
              <MultiSelectDropdown
                label="Célközönség"
                placeholder="Összes célközönség"
                options={audienceOptions}
                selected={selectedTargetAudiences}
                onChange={onTargetAudiencesChange}
                isDark={isDark}
              />

              {/* Instructor Filter - "Mentorok" */}
              <MultiSelectDropdown
                label="Mentorok"
                placeholder="Összes mentor"
                options={instructorOptions}
                selected={selectedInstructors}
                onChange={onInstructorsChange}
                isDark={isDark}
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onClearFilters}
                className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all md:mt-5 ${
                  isDark
                    ? 'text-gray-300 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
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
              className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Aktív szűrők:
                </span>

                {selectedCategories.map((catId) => {
                  const cat = categories.find((c) => c.id === catId)
                  if (!cat) return null
                  return (
                    <motion.span
                      key={catId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-secondary/10 text-brand-secondary rounded-full text-sm font-medium"
                    >
                      {cat.name}
                      <button
                        onClick={() =>
                          onCategoriesChange(selectedCategories.filter((id) => id !== catId))
                        }
                        className="hover:bg-brand-secondary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  )
                })}

                {selectedCourseTypes.map((type) => (
                  <motion.span
                    key={type}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {COURSE_TYPE_LABELS[type]}
                    <button
                      onClick={() =>
                        onCourseTypesChange(selectedCourseTypes.filter((t) => t !== type))
                      }
                      className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}

                {selectedTargetAudiences.map((audId) => {
                  const aud = targetAudiences.find((a) => a.id === audId)
                  if (!aud) return null
                  return (
                    <motion.span
                      key={audId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                    >
                      {aud.name}
                      <button
                        onClick={() =>
                          onTargetAudiencesChange(
                            selectedTargetAudiences.filter((id) => id !== audId)
                          )
                        }
                        className="hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  )
                })}

                {selectedInstructors.map((instId) => {
                  const inst = instructors.find((i) => i.id === instId)
                  if (!inst) return null
                  return (
                    <motion.span
                      key={instId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                    >
                      {inst.name}
                      <button
                        onClick={() =>
                          onInstructorsChange(selectedInstructors.filter((id) => id !== instId))
                        }
                        className="hover:bg-amber-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  )
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
