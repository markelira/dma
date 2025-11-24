'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CourseTypeCardProps {
  icon: string;
  title: string;
  description: string;
  features?: string[];
  gradient: string;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
}

export function CourseTypeCard({
  icon,
  title,
  description,
  features,
  gradient,
  size = 'medium',
  delay = 0,
}: CourseTypeCardProps) {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-1 md:col-span-1 row-span-1 md:row-span-2',
    large: 'col-span-1 md:col-span-2 row-span-2 md:row-span-3',
  };

  return (
    <motion.div
      className={cn(
        'group relative overflow-hidden rounded-2xl p-6 md:p-8',
        'bg-gradient-to-br border border-white/20',
        'hover:scale-[1.02] hover:shadow-2xl transition-all duration-300',
        sizeClasses[size]
      )}
      style={{
        background: gradient,
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, delay }}
    >
      <div className="flex flex-col h-full">
        <div className="text-5xl md:text-6xl mb-4">{icon}</div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/90 text-sm md:text-base mb-4 flex-1">{description}</p>
        {features && features.length > 0 && (
          <ul className="space-y-2 mt-auto">
            {features.map((feature, index) => (
              <li key={index} className="text-white/80 text-sm flex items-start">
                <span className="text-white mr-2">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </motion.div>
  );
}

