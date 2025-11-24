'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
}

const sizeClasses = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-1 md:col-span-1 row-span-1 md:row-span-2',
  large: 'col-span-1 md:col-span-2 row-span-2 md:row-span-3',
};

export function BentoCard({
  children,
  className = '',
  size = 'medium',
  delay = 0,
}: BentoCardProps) {
  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 md:p-8',
        'hover:bg-white/10 hover:border-white/20 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-2xl',
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  );
}

