'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedGlobeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function AnimatedGlobe({ className, size = 'lg' }: AnimatedGlobeProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64',
    xl: 'w-96 h-96',
  };

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Main globe */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        className={cn(
          'relative rounded-full',
          sizeClasses[size]
        )}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-secondary/40 via-purple-600/40 to-pink-600/40 blur-3xl" />

        {/* Main sphere */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-brand-secondary/50/20 via-purple-500/20 to-pink-500/20 border border-brand-secondary/30 overflow-hidden">
          {/* Grid lines - horizontal */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent"
              style={{ top: `${(i + 1) * 16.66}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Grid lines - vertical */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-400/40 to-transparent"
              style={{ left: `${(i + 1) * 12.5}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}

          {/* Rotating highlight */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-brand-secondary/20 via-transparent to-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* Pulse effect */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-brand-secondary/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Inner glow */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-brand-secondary/50/10 to-purple-500/10 blur-xl" />
        </div>

        {/* Orbiting dots */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`orbit-${i}`}
            className="absolute top-1/2 left-1/2"
            style={{
              width: `${80 + i * 20}%`,
              height: `${80 + i * 20}%`,
              margin: `-${40 + i * 10}% 0 0 -${40 + i * 10}%`,
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 10 + i * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 rounded-full bg-brand-secondary/60 shadow-lg shadow-brand-secondary/50" />
          </motion.div>
        ))}
      </motion.div>

      {/* Ambient particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-brand-secondary/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}
