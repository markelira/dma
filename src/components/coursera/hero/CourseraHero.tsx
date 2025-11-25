'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function CourseraHero() {
  return (
    <section className="relative bg-gradient-to-br from-coursera-blue-light via-white to-coursera-blue-light/50 py-16 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-coursera-text-primary mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Learn without limits
          </motion.h1>
          
          <motion.p
            className="text-lg md:text-xl text-coursera-text-secondary mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Start, switch, or advance your career with thousands of courses,
            Professional Certificates, and degrees from world-class universities
            and companies.
          </motion.p>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href="/register"
              className="inline-block px-8 py-3 text-base font-bold text-white bg-coursera-blue rounded-md hover:bg-coursera-blue-hover transition-colors shadow-md hover:shadow-lg"
            >
              Join for Free
            </Link>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-coursera-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center space-x-2">
              <span className="font-bold text-coursera-text-primary">7,000+</span>
              <span>courses</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-coursera-text-primary">300+</span>
              <span>partners</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-coursera-text-primary">100M+</span>
              <span>learners</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

