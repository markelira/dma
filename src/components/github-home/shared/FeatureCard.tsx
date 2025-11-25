'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  className?: string;
  iconColor?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  className,
  iconColor = 'text-brand-secondary',
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'group relative p-6 rounded-lg',
        'border border-gray-800 bg-gray-900/50',
        'hover:border-gray-700 hover:bg-gray-900/70',
        'transition-all duration-300',
        className
      )}
    >
      {/* Icon */}
      {Icon && (
        <div className="mb-4">
          <div className={cn(
            'inline-flex p-3 rounded-lg bg-gray-800/50',
            'group-hover:bg-gray-800/70 transition-colors'
          )}>
            <Icon className={cn('w-6 h-6', iconColor)} />
          </div>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-bold text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed">
        {description}
      </p>

      {/* Hover gradient effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-brand-secondary/50/0 via-purple-500/0 to-transparent group-hover:from-brand-secondary/50/5 group-hover:via-purple-500/5 transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
}
