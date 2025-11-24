'use client';

import { CategoryCard } from './CategoryCard';

const categories = [
  { id: 'data-science', name: 'Data Science', icon: '📊', courseCount: 450, color: '#0056D2' },
  { id: 'business', name: 'Business', icon: '💼', courseCount: 380, color: '#0056D2' },
  { id: 'computer-science', name: 'Computer Science', icon: '💻', courseCount: 520, color: '#0056D2' },
  { id: 'it', name: 'Information Technology', icon: '🔧', courseCount: 320, color: '#0056D2' },
  { id: 'language', name: 'Language Learning', icon: '🌍', courseCount: 280, color: '#0056D2' },
  { id: 'health', name: 'Health', icon: '🏥', courseCount: 190, color: '#0056D2' },
  { id: 'personal-development', name: 'Personal Development', icon: '🌱', courseCount: 240, color: '#0056D2' },
  { id: 'engineering', name: 'Physical Science and Engineering', icon: '⚙️', courseCount: 310, color: '#0056D2' },
  { id: 'social-sciences', name: 'Social Sciences', icon: '👥', courseCount: 180, color: '#0056D2' },
  { id: 'arts', name: 'Arts and Humanities', icon: '🎨', courseCount: 220, color: '#0056D2' },
  { id: 'math', name: 'Math and Logic', icon: '🔢', courseCount: 150, color: '#0056D2' },
  { id: 'education', name: 'Education', icon: '📚', courseCount: 170, color: '#0056D2' },
];

export function CategoryGrid() {
  return (
    <section className="py-12 md:py-16 bg-coursera-bg-light">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-coursera-text-primary text-center mb-8">
          Explore our top courses
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} {...category} />
          ))}
        </div>
      </div>
    </section>
  );
}

