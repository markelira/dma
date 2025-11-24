'use client';

import { motion } from 'framer-motion';
import { AnimatedSection } from './components/AnimatedSection';
import { CourseTypeCard } from './components/CourseTypeCard';

export function CourseTypesSection() {
  const courseTypes = [
    {
      type: 'ACADEMIA',
      icon: '📚',
      title: 'Akadémiai kurzusok',
      description: 'Strukturált leckék, kvízek, tanúsítványok. Minden, amire szükséged van a professzionális fejlődéshez.',
      features: [
        'Oldalsáv navigáció',
        'Modulok és leckék',
        'Interaktív kvízek',
        'Tanúsítványok',
      ],
      gradient: 'linear-gradient(135deg, #2C3E54 0%, #1e2a37 100%)',
      size: 'large' as const,
      delay: 0,
    },
    {
      type: 'WEBINAR',
      icon: '🎥',
      title: 'Webináriumok',
      description: 'Élő vagy felvett egyedi munkamenetek. Fókuszálj egy témára, tanulj hatékonyan.',
      gradient: 'linear-gradient(135deg, #E62935 0%, #C63D2B 100%)',
      size: 'medium' as const,
      delay: 0.1,
    },
    {
      type: 'MASTERCLASS',
      icon: '⭐',
      title: 'Masterclass',
      description: 'Prémium tartalom több kurzusból. A legjobb tananyagok egy helyen.',
      gradient: 'linear-gradient(135deg, #DD9933 0%, #C6891F 100%)',
      size: 'medium' as const,
      delay: 0.2,
    },
    {
      type: 'PODCAST',
      icon: '🎧',
      title: 'Podcast epizódok',
      description: 'Audio és videó podcastok. Tanulj közben, bárhol is vagy.',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      size: 'small' as const,
      delay: 0.3,
    },
  ];

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
          <div className="inline-flex items-center space-x-2 bg-dma-red/10 text-dma-red px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span>Kurzus típusok</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Válassz a formátumodnak megfelelőt
          </h2>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Strukturált kurzusoktól a podcast epizódokig,
            minden tanulási stílushoz van tartalom.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
          {courseTypes.map((courseType) => (
            <CourseTypeCard
              key={courseType.type}
              icon={courseType.icon}
              title={courseType.title}
              description={courseType.description}
              features={courseType.features}
              gradient={courseType.gradient}
              size={courseType.size}
              delay={courseType.delay}
            />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
