'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  price: number | 'Free';
  level?: string;
}

export function CourseCard({
  id,
  title,
  instructor,
  thumbnail,
  rating,
  reviewCount,
  enrollmentCount,
  price,
  level,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <motion.div
        className="bg-white border border-coursera-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group w-full max-w-sm"
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
      >
        {/* Thumbnail */}
        <div className="relative w-full h-40 bg-coursera-bg-light">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-coursera-blue to-coursera-blue-hover">
            <span className="text-white text-4xl font-bold">
              {title.charAt(0)}
            </span>
          </div>
          {price === 'Free' && (
            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold text-coursera-blue">
              Free
            </div>
          )}
          {typeof price === 'number' && (
            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-bold text-coursera-blue">
              ${price}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-coursera-text-primary mb-2 line-clamp-2 group-hover:text-coursera-blue transition-colors">
            {title}
          </h3>
          <p className="text-sm text-coursera-text-secondary mb-3">
            {instructor}
          </p>

          {/* Rating */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center">
              <span className="text-sm font-bold text-coursera-text-primary mr-1">
                {rating.toFixed(1)}
              </span>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-xs text-coursera-text-secondary">
              ({reviewCount.toLocaleString()})
            </span>
          </div>

          {/* Enrollment */}
          <p className="text-xs text-coursera-text-secondary">
            {enrollmentCount.toLocaleString()} already enrolled
          </p>

          {level && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 bg-coursera-bg-light text-coursera-text-secondary rounded">
                {level}
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

