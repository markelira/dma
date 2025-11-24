'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Infinity } from 'lucide-react';

interface StickyBottomCTAProps {
  courseTitle: string;
  onEnroll: () => void;
  isEnrolled: boolean;
}

export function StickyBottomCTA({ courseTitle, onEnroll, isEnrolled }: StickyBottomCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show CTA when user scrolls past 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || isEnrolled) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300">
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-1">Tartalom</p>
            <p className="text-sm font-bold text-gray-900 truncate">{courseTitle}</p>
          </div>
          <Button
            onClick={onEnroll}
            className="flex-shrink-0 bg-gradient-to-t from-blue-600 to-blue-500 hover:shadow-xl text-white font-bold px-6 py-3 rounded-lg transition-all"
          >
            <Infinity className="w-4 h-4 mr-2" />
            Feliratkozás
          </Button>
        </div>
      </div>
    </div>
  );
}
