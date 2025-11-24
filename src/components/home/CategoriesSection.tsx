'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { AnimatedSection } from './components/AnimatedSection';
import { CategoryCard } from './components/CategoryCard';

const categories = [
  {
    id: 'uzleti-es-menedzsment',
    icon: '💼',
    name: 'Üzleti és Menedzsment',
    description: 'Üzleti vezetés, stratégia, projektmenedzsment',
    courseCount: 45,
  },
  {
    id: 'marketing-es-ertekesites',
    icon: '📈',
    name: 'Marketing és Értékesítés',
    description: 'Digitális marketing, közösségi média, értékesítési technikák',
    courseCount: 62,
  },
  {
    id: 'programozas-es-fejlesztes',
    icon: '💻',
    name: 'Programozás és Fejlesztés',
    description: 'Webfejlesztés, mobilappok, szoftverfejlesztés',
    courseCount: 78,
  },
  {
    id: 'design-es-kreativitas',
    icon: '🎨',
    name: 'Design és Kreativitás',
    description: 'Grafikai tervezés, UX/UI, kreatív alkotás',
    courseCount: 52,
  },
  {
    id: 'szemelyes-fejlodes',
    icon: '🌱',
    name: 'Személyes Fejlődés',
    description: 'Önismeret, kommunikáció, produktivitás',
    courseCount: 38,
  },
  {
    id: 'penzugyek-es-befektetes',
    icon: '💰',
    name: 'Pénzügyek és Befektetés',
    description: 'Befektetés, vagyonkezelés, pénzügyi tervezés',
    courseCount: 29,
  },
  {
    id: 'data-science-es-ai',
    icon: '🤖',
    name: 'Data Science és AI',
    description: 'Adatelemzés, gépi tanulás, mesterséges intelligencia',
    courseCount: 41,
  },
  {
    id: 'hr-es-toborzas',
    icon: '👥',
    name: 'HR és Toborzás',
    description: 'Emberi erőforrás menedzsment, toborzás, onboarding',
    courseCount: 33,
  },
];

export function CategoriesSection() {
  return (
    <AnimatedSection className="py-20 md:py-32 bg-[#FFFAF5]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Fedezd fel a kurzus kategóriákat
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            12+ kategória, 500+ kurzus. Minden témában megtalálod, amit keresel.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              icon={category.icon}
              title={category.name}
              description={category.description}
              courseCount={category.courseCount}
              onClick={() => {
                // Navigate to category page
                window.location.href = `/courses?category=${category.id}`;
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/courses"
            className="inline-flex items-center justify-center px-8 py-4 bg-dma-navy text-white font-semibold rounded-full shadow-lg hover:bg-dma-navy-hover hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            Összes kategória megtekintése
          </Link>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}

