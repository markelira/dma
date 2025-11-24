'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  icon: string;
  title: string;
  description: string;
  courseCount?: number;
  className?: string;
  onClick?: () => void;
}

export function CategoryCard({
  icon,
  title,
  description,
  courseCount,
  className = '',
  onClick,
}: CategoryCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const newRotateX = (y - centerY) / 10;
    const newRotateY = (centerX - x) / 10;

    setRotateX(newRotateX);
    setRotateY(newRotateY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      className={cn(
        'group relative cursor-pointer rounded-2xl bg-white p-6 shadow-lg',
        'border border-gray-100 hover:border-dma-red/20',
        'transition-all duration-300 hover:shadow-2xl',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col items-start space-y-4">
        <div className="text-4xl">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
          {courseCount !== undefined && (
            <p className="text-xs text-dma-red mt-2 font-medium">
              {courseCount} kurzus
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

