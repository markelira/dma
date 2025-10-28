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
  const levels = [
    { value: 'all', label: 'Összes szint' },
    { value: 'beginner', label: 'Kezdő' },
    { value: 'intermediate', label: 'Haladó' },
    { value: 'advanced', label: 'Profi' }
  ]

  const priceOptions = [
    { value: 'all', label: 'Minden ár' },
    { value: 'free', label: 'Ingyenes' },
    { value: 'paid', label: 'Fizetős' }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-lg text-gray-900">Szűrők</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <X className="w-4 h-4" />
          Törlés
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Kategória</h4>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="category"
                value={category}
                checked={selectedCategory === category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700 capitalize">
                {category === 'all' ? 'Összes' : category}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Level Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Szint</h4>
        <div className="space-y-2">
          {levels.map((level) => (
            <label key={level.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="level"
                value={level.value}
                checked={selectedLevel === level.value}
                onChange={(e) => onLevelChange(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">{level.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Ár</h4>
        <div className="space-y-2">
          {priceOptions.map((option) => (
            <label key={option.value} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="price"
                value={option.value}
                checked={selectedPrice === option.value}
                onChange={(e) => onPriceChange(e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
