'use client';

import { motion } from 'framer-motion';
import { AnimatedSection } from './components/AnimatedSection';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote:
      'A csapatfunkciók miatt választottuk a DMA.hu-t. Most már minden kollégánk hozzáfér a tartalmakhoz, anélkül hogy extra költséget kellene fizetnünk.',
    author: 'Kovács Péter',
    role: 'Marketing vezető',
    company: 'TechStart Kft.',
    rating: 5,
  },
  {
    quote:
      'A tartalmak minősége kiváló, és a platform használata nagyon egyszerű. A csapatom gyorsan megtanulta a használatát.',
    author: 'Nagy Anna',
    role: 'HR Manager',
    company: 'Innovate Ltd.',
    rating: 5,
  },
  {
    quote:
      'A legjobb ár-érték arány az online tanulási platformok között. Korlátlan csapattagokkal egy előfizetés alatt.',
    author: 'Szabó Gábor',
    role: 'CEO',
    company: 'StartupHub',
    rating: 5,
  },
];

const stats = [
  { number: '10,000+', label: 'Felhasználó' },
  { number: '500+', label: 'Tartalom' },
  { number: '4.8/5', label: 'Értékelés' },
  { number: '95%', label: 'Ajánlási arány' },
];

export function TestimonialsSection() {
  return (
    <AnimatedSection className="py-20 md:py-32 bg-dma-navy">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Mit mondanak rólunk
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            10,000+ elégedett felhasználó, 4.8/5 átlagos értékelés
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">
                    ⭐
                  </span>
                ))}
              </div>
              <p className="text-white/90 mb-6 text-lg leading-relaxed">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="text-white font-semibold">{testimonial.author}</p>
                <p className="text-white/70 text-sm">
                  {testimonial.role}, {testimonial.company}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-white/70 text-sm md:text-base">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

