'use client';

import { motion } from 'motion/react';
import { Filter, X } from 'lucide-react';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';

interface CourseFilterBarProps {
  categories: Array<{ id: string; name: string }>;
  targetAudiences: Array<{ id: string; name: string }>;
  selectedCategories: string[];
  selectedTargetAudiences: string[];
  onCategoriesChange: (ids: string[]) => void;
  onTargetAudiencesChange: (ids: string[]) => void;
  onClearFilters: () => void;
}

export function CourseFilterBar({
  categories,
  targetAudiences,
  selectedCategories,
  selectedTargetAudiences,
  onCategoriesChange,
  onTargetAudiencesChange,
  onClearFilters,
}: CourseFilterBarProps) {
  const hasActiveFilters = selectedCategories.length > 0 || selectedTargetAudiences.length > 0;
  const activeFilterCount = selectedCategories.length + selectedTargetAudiences.length;

  // Prepare options for dropdowns
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));
  const audienceOptions = targetAudiences.map(a => ({ value: a.id, label: a.name }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Filter Icon & Label */}
        <div className="flex items-center gap-2 text-gray-700 lg:pt-6">
          <Filter className="w-5 h-5" />
          <span className="font-medium">Szűrők</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-brand-secondary text-white text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Category Filter - now "Területek" */}
          <div className="flex-1 max-w-xs">
            <MultiSelectDropdown
              label="Területek"
              placeholder="Összes terület"
              options={categoryOptions}
              selected={selectedCategories}
              onChange={onCategoriesChange}
            />
          </div>

          {/* Target Audience Filter */}
          <div className="flex-1 max-w-xs">
            <MultiSelectDropdown
              label="Célközönség"
              placeholder="Összes célközönség"
              options={audienceOptions}
              selected={selectedTargetAudiences}
              onChange={onTargetAudiencesChange}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all lg:mt-5"
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

            {selectedTargetAudiences.map(audId => {
              const aud = targetAudiences.find(a => a.id === audId);
              if (!aud) return null;
              return (
                <motion.span
                  key={audId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                >
                  {aud.name}
                  <button
                    onClick={() => onTargetAudiencesChange(selectedTargetAudiences.filter(id => id !== audId))}
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
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
  );
}
