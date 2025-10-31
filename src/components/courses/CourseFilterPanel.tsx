'use client'

import { Filter, X } from 'lucide-react'

interface CourseFilterPanelProps {
  selectedCategory: string
  selectedLevel: string
  selectedPrice: string
  categories: string[]
  onCategoryChange: (category: string) => void
  onLevelChange: (level: string) => void
  onPriceChange: (price: string) => void
  onResetFilters: () => void
}

/**
 * CourseFilterPanel component
 * Sidebar panel for filtering courses
 */
export function CourseFilterPanel({
  selectedCategory,
  selectedLevel,
  selectedPrice,
  categories,
  onCategoryChange,
  onLevelChange,
  onPriceChange,
  onResetFilters
}: CourseFilterPanelProps) {
  return (
    <div className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-lg text-gray-900">Szűrők</h3>
        </div>
        {selectedCategory !== 'all' && (
          <button
            onClick={onResetFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Törlés
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Kategória</h4>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="form-input w-full py-2"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'Összes kategória' : category}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
