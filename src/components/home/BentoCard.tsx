'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface BentoCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  variant?: 'default' | 'featured' | 'quote' | 'stat';
  quote?: {
    text: string;
    author: string;
  };
  stat?: {
    value: string;
    label: string;
  };
  backgroundImage?: string;
  delay?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    },
  },
};

export function BentoCard({
  title,
  description,
  icon,
  className = '',
  variant = 'default',
  quote,
  stat,
  backgroundImage,
  delay = 0,
}: BentoCardProps) {
  const baseClasses =
    'relative overflow-hidden rounded-[2.75rem] border border-[rgb(41,41,41)] bg-[rgb(23,23,23)] p-8 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_30px_rgba(0,0,0,0.3)]';

  if (variant === 'quote' && quote) {
    return (
      <motion.div
        className={`${baseClasses} flex flex-col justify-between ${className}`}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay }}
      >
        <div className="mb-6">
          <svg
            className="w-10 h-10 text-[rgb(231,43,54)] opacity-60"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
        <blockquote className="text-xl md:text-2xl text-white/90 leading-relaxed mb-6 font-medium">
          "{quote.text}"
        </blockquote>
        <cite className="text-white/50 text-sm not-italic">— {quote.author}</cite>
      </motion.div>
    );
  }

  if (variant === 'stat' && stat) {
    return (
      <motion.div
        className={`${baseClasses} flex flex-col items-center justify-center text-center ${className}`}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay }}
      >
        <span className="text-5xl md:text-6xl font-bold text-white mb-2">{stat.value}</span>
        <span className="text-white/50 text-lg">{stat.label}</span>
      </motion.div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        className={`${baseClasses} group ${className}`}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        transition={{ delay }}
      >
        {backgroundImage && (
          <div
            className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        <div className="relative z-10">
          {icon && (
            <div className="w-14 h-14 rounded-2xl bg-[rgb(231,43,54)]/10 border border-[rgb(231,43,54)]/20 flex items-center justify-center mb-6 text-[rgb(231,43,54)]">
              {icon}
            </div>
          )}
          <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
          {description && (
            <p className="text-white/65 text-base leading-relaxed">{description}</p>
          )}
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      className={`${baseClasses} group ${className}`}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay }}
    >
      <div className="relative z-10">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 text-white/70 group-hover:text-white group-hover:border-white/20 transition-colors">
            {icon}
          </div>
        )}
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        {description && (
          <p className="text-white/55 text-sm leading-relaxed">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

export default BentoCard;
