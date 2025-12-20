'use client';

import React from 'react';
import { PlayCircleIcon, DocumentIcon } from '@/components/icons/CoursePlayerIcons';

export type MobileTab = 'video' | 'lessons';

interface MobileBottomTabsProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  courseType?: string;
}

/**
 * MobileBottomTabs Component
 * Fixed bottom tab navigation for mobile devices
 * Allows switching between video content and lesson list
 */
export function MobileBottomTabs({
  activeTab,
  onTabChange,
  courseType,
}: MobileBottomTabsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden pb-safe">
      <div className="grid grid-cols-2 h-[56px]">
        {/* Video Tab */}
        <button
          onClick={() => onTabChange('video')}
          className={`flex items-center justify-center gap-2 h-full font-medium transition-colors ${
            activeTab === 'video'
              ? 'text-brand-secondary bg-brand-secondary/5 border-t-2 border-brand-secondary'
              : 'text-gray-600 border-t-2 border-transparent'
          }`}
        >
          <PlayCircleIcon size={20} className={activeTab === 'video' ? '' : 'opacity-60'} />
          <span>Videó</span>
        </button>

        {/* Lessons Tab */}
        <button
          onClick={() => onTabChange('lessons')}
          className={`flex items-center justify-center gap-2 h-full font-medium transition-colors ${
            activeTab === 'lessons'
              ? 'text-brand-secondary bg-brand-secondary/5 border-t-2 border-brand-secondary'
              : 'text-gray-600 border-t-2 border-transparent'
          }`}
        >
          <DocumentIcon size={20} className={activeTab === 'lessons' ? '' : 'opacity-60'} />
          <span>{courseType === 'MASTERCLASS' ? 'Részek' : 'Leckék'}</span>
        </button>
      </div>
    </div>
  );
}

