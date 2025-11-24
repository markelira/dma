'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface FeatureCardTiltedProps {
  title: string;
  description?: string;
  imageUrl?: string;
  rotation?: number;
  className?: string;
  delay?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, rotate: 0 },
  visible: (rotation: number) => ({
    opacity: 1,
    y: 0,
    rotate: rotation,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 150,
    },
  }),
};

export function FeatureCardTilted({
  title,
  description,
  imageUrl,
  rotation = 0,
  className = '',
  delay = 0,
}: FeatureCardTiltedProps) {
  return (
    <motion.div
      className={`relative group ${className}`}
      custom={rotation}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, rotate: 0 }}
    >
      <div className="relative overflow-hidden rounded-3xl bg-[rgb(23,23,23)] border border-[rgb(41,41,41)] h-[280px] md:h-[320px] transition-all duration-300 group-hover:border-white/20 group-hover:shadow-2xl">
        {/* Background image */}
        {imageUrl && (
          <div
            className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(18,17,17)] via-[rgb(18,17,17)]/60 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
            {title}
          </h3>
          {description && (
            <p className="text-white/60 text-sm leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Arrow indicator */}
          <motion.div
            className="mt-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.1 }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default FeatureCardTilted;
