'use client';

import React from 'react';
import { Play, ChevronDown } from 'lucide-react';

interface CourseCardHoverActionsProps {
  /** Callback when Play button is clicked */
  onPlay: (e: React.MouseEvent) => void;
  /** Callback when More Info button is clicked */
  onMoreInfo: (e: React.MouseEvent) => void;
  /** Whether the hover actions are visible (controlled externally) */
  visible?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * CourseCardHoverActions - Overlay with Play and More Info buttons
 * Appears on hover over course card thumbnail
 *
 * Pattern:
 * - Play button (left) - navigates to first lesson/player
 * - More Info / down arrow (right) - opens preview modal
 */
export function CourseCardHoverActions({
  onPlay,
  onMoreInfo,
  visible = true,
  className = '',
}: CourseCardHoverActionsProps) {
  return (
    <div
      className={`
        absolute bottom-0 left-0 right-0
        bg-gradient-to-t from-black/90 via-black/60 to-transparent
        p-3 pt-12
        flex items-center justify-between
        opacity-0 group-hover:opacity-100
        transition-opacity duration-200
        ${visible ? '' : 'hidden'}
        ${className}
      `}
    >
      {/* Play button - navigate to first lesson */}
      <button
        onClick={onPlay}
        className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
        title="Lejátszás"
        aria-label="Kurzus indítása"
      >
        <Play className="w-5 h-5 text-gray-900 ml-0.5 fill-gray-900" />
      </button>

      {/* More Info button - open preview modal */}
      <button
        onClick={onMoreInfo}
        className="w-10 h-10 rounded-full border-2 border-white/70 hover:border-white bg-black/30 hover:bg-black/50 flex items-center justify-center transition-all hover:scale-110"
        title="Részletek"
        aria-label="Részletek megtekintése"
      >
        <ChevronDown className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}

/**
 * MobileCardActions - Action menu for mobile devices (no hover)
 * Shows on long press or via menu icon
 */
interface MobileCardActionsProps {
  /** Callback when Play action is selected */
  onPlay: () => void;
  /** Callback when More Info action is selected */
  onMoreInfo: () => void;
  /** Whether menu is open */
  open: boolean;
  /** Callback to close menu */
  onClose: () => void;
}

export function MobileCardActions({
  onPlay,
  onMoreInfo,
  open,
  onClose,
}: MobileCardActionsProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Action menu */}
      <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-[160px]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
        >
          <Play className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Lejátszás</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoreInfo();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-t border-gray-100"
        >
          <ChevronDown className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Részletek</span>
        </button>
      </div>
    </>
  );
}
