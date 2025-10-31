'use client';

import { motion } from 'framer-motion';
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface FloatingCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function FloatingCard({
  children,
  className,
  delay = 0,
  duration = 3,
  ...props
}: FloatingCardProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{
        y: [-10, 10, -10],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={cn(
        'rounded-lg border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-800/30',
        'backdrop-blur-sm shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
