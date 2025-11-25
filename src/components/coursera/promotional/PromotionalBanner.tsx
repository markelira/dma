'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export function PromotionalBanner() {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-coursera-blue text-white py-3 px-4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <p className="text-sm md:text-base">
              <span className="font-bold">Save up to 50% on Coursera Plus!</span>
              <span className="ml-2">Limited time offer</span>
            </p>
            <Link
              href="/coursera-plus"
              className="hidden sm:inline-block px-4 py-1.5 text-sm font-bold bg-white text-coursera-blue rounded-md hover:bg-gray-100 transition-colors"
            >
              Get Coursera Plus
            </Link>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="sm:hidden mt-2">
          <Link
            href="/coursera-plus"
            className="inline-block px-4 py-1.5 text-sm font-bold bg-white text-coursera-blue rounded-md hover:bg-gray-100 transition-colors"
          >
            Get Coursera Plus
          </Link>
        </div>
      </div>
    </div>
  );
}

