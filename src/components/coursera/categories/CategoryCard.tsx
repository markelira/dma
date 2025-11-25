'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: string;
  courseCount?: number;
  color?: string;
}

export function CategoryCard({ id, name, icon, courseCount, color = '#0056D2' }: CategoryCardProps) {
  return (
    <Link href={`/courses?category=${id}`}>
      <motion.div
        className="bg-white border border-coursera-border rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group"
        whileHover={{ scale: 1.02, y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {icon}
          </div>
          <h3 className="text-lg font-bold text-coursera-text-primary mb-2 group-hover:text-coursera-blue transition-colors">
            {name}
          </h3>
          {courseCount !== undefined && (
            <p className="text-sm text-coursera-text-secondary">
              {courseCount} courses
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

