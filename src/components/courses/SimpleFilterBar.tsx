'use client'

import { X } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface SimpleFilterBarProps {
  categories: Category[]
  selectedCategory: string
  searchQuery: string
  onCategoryChange: (categoryId: string) => void
  onSearchChange: (query: string) => void
  backgroundColor?: 'light' | 'dark'
  courseType?: 'WEBINAR' | 'ACADEMIA' | 'MASTERCLASS' | 'PODCAST'
}

const TYPE_COLORS = {
  WEBINAR: {
    accent: 'purple-500',
    border: 'border-purple-500',
    focus: 'focus:ring-purple-500/20',
  },
  ACADEMIA: {
    accent: 'blue-500',
    border: 'border-blue-500',
    focus: 'focus:ring-blue-500/20',
  },
  MASTERCLASS: {
    accent: 'amber-500',
    border: 'border-amber-500',
    focus: 'focus:ring-amber-500/20',
  },
  PODCAST: {
    accent: 'green-500',
    border: 'border-green-500',
    focus: 'focus:ring-green-500/20',
  },
}

export function SimpleFilterBar({
  categories,
  selectedCategory,
  searchQuery,
  onCategoryChange,
  onSearchChange,
  backgroundColor = 'light',
  courseType = 'WEBINAR',
}: SimpleFilterBarProps) {
  const isDark = backgroundColor === 'dark'
  const typeConfig = TYPE_COLORS[courseType]

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Dropdown */}
        <div>
          <label htmlFor="category-filter" className="sr-only">
            Kategória szűrés
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium ${typeConfig.border} ${typeConfig.focus} ${
              isDark
                ? 'bg-gray-900/80 text-white border-white/20 hover:border-white/40 focus:bg-gray-900'
                : 'bg-white/80 text-gray-900 border-gray-200 hover:border-gray-300 focus:bg-white'
            }`}
          >
            <option value="all">Összes kategória</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <label htmlFor="search-filter" className="sr-only">
            Keresés
          </label>
          <input
            id="search-filter"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Keresés cím vagy leírás alapján..."
            className={`w-full px-4 py-3 pr-10 rounded-lg border-2 transition-all duration-200 ${typeConfig.border} ${typeConfig.focus} ${
              isDark
                ? 'bg-gray-900/80 text-white placeholder-gray-400 border-white/20 hover:border-white/40 focus:bg-gray-900'
                : 'bg-white/80 text-gray-900 placeholder-gray-500 border-gray-200 hover:border-gray-300 focus:bg-white'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCategory !== 'all' || searchQuery) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Aktív szűrők:
          </span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => onCategoryChange('all')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {categories.find((c) => c.id === selectedCategory)?.name || 'Kategória'}
              <X className="w-3 h-3" />
            </button>
          )}
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              "{searchQuery}"
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => {
              onCategoryChange('all')
              onSearchChange('')
            }}
            className={`text-sm font-medium underline ${
              isDark
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Összes szűrő törlése
          </button>
        </div>
      )}
    </div>
  )
}
