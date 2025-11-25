'use client';

import { motion } from 'motion/react';
import { Filter, X, ChevronDown } from 'lucide-react';

interface CourseFilterBarProps {
  categories: Array<{ id: string; name: string }>;
  targetAudiences: Array<{ id: string; name: string }>;
  selectedCategory: string;
  selectedTargetAudience: string;
  onCategoryChange: (id: string) => void;
  onTargetAudienceChange: (id: string) => void;
  onClearFilters: () => void;
}

export function CourseFilterBar({
  categories,
  targetAudiences,
  selectedCategory,
  selectedTargetAudience,
  onCategoryChange,
  onTargetAudienceChange,
  onClearFilters,
}: CourseFilterBarProps) {
  const hasActiveFilters = selectedCategory || selectedTargetAudience;

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name;
  const selectedTargetAudienceName = targetAudiences.find(t => t.id === selectedTargetAudience)?.name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Filter Icon & Label */}
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="w-5 h-5" />
          <span className="font-medium">Szűrők</span>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Category Filter */}
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Kategória
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full appearance-none bg-white/80 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary transition-all cursor-pointer"
              >
                <option value="">Összes kategória</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Target Audience Filter */}
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Célközönség
            </label>
            <div className="relative">
              <select
                value={selectedTargetAudience}
                onChange={(e) => onTargetAudienceChange(e.target.value)}
                className="w-full appearance-none bg-white/80 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-secondary/20 focus:border-brand-secondary transition-all cursor-pointer"
              >
                <option value="">Összes célközönség</option>
                {targetAudiences.map((audience) => (
                  <option key={audience.id} value={audience.id}>
                    {audience.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
            Szűrők törlése
          </motion.button>
        )}
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-white/30"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Aktív szűrők:</span>

            {selectedCategoryName && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-secondary/10 text-brand-secondary rounded-full text-sm font-medium"
              >
                {selectedCategoryName}
                <button
                  onClick={() => onCategoryChange('')}
                  className="hover:bg-brand-secondary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            )}

            {selectedTargetAudienceName && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
              >
                {selectedTargetAudienceName}
                <button
                  onClick={() => onTargetAudienceChange('')}
                  className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
