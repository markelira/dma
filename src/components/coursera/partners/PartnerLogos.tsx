'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';

const partners = [
  { id: 1, name: 'Stanford', logo: 'S' },
  { id: 2, name: 'Yale', logo: 'Y' },
  { id: 3, name: 'Google', logo: 'G' },
  { id: 4, name: 'IBM', logo: 'IBM' },
  { id: 5, name: 'Duke', logo: 'D' },
  { id: 6, name: 'Microsoft', logo: 'M' },
  { id: 7, name: 'Penn', logo: 'P' },
  { id: 8, name: 'Meta', logo: 'M' },
  { id: 9, name: 'Michigan', logo: 'M' },
  { id: 10, name: 'Amazon', logo: 'A' },
];

export function PartnerLogos() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-coursera-text-primary text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Learn from 300+ leading companies and universities
        </motion.h2>

        <div className="relative">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-coursera-border rounded-full p-2 shadow-md hover:bg-coursera-bg-light transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-5 w-5 text-coursera-text-primary" />
            </button>
          )}

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex space-x-8 overflow-x-auto scrollbar-hide scroll-smooth px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {partners.map((partner) => (
              <motion.div
                key={partner.id}
                className="flex-shrink-0 flex items-center justify-center w-32 h-16 grayscale hover:grayscale-0 transition-all duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-2xl font-bold text-coursera-text-secondary hover:text-coursera-blue transition-colors">
                  {partner.logo}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-coursera-border rounded-full p-2 shadow-md hover:bg-coursera-bg-light transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-5 w-5 text-coursera-text-primary" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

