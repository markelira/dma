'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3;
  rowSpan?: 1 | 2 | 3;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({ children, className, colSpan = 1, rowSpan = 1 }: BentoCardProps) {
  const colSpanClass = {
    1: 'col-span-1',
    2: 'md:col-span-2',
    3: 'lg:col-span-3',
  }[colSpan];

  const rowSpanClass = {
    1: 'row-span-1',
    2: 'md:row-span-2',
    3: 'lg:row-span-3',
  }[rowSpan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-gray-800',
        'bg-gradient-to-br from-gray-900/90 to-gray-800/50',
        'p-6 backdrop-blur-sm hover:border-gray-700 transition-all duration-300',
        colSpanClass,
        rowSpanClass,
        className
      )}
    >
      {/* Gradient hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-secondary/50/0 via-purple-500/0 to-pink-500/0 group-hover:from-brand-secondary/50/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
