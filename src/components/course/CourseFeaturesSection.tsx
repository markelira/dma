'use client';

import React from 'react';
import { Infinity, Smartphone, Download, MessageSquare, Trophy, Calendar } from 'lucide-react';
import { motion } from "motion/react";

// Helper function to format date in Hungarian locale
const formatHungarianDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

interface CourseData {
  certificateEnabled?: boolean;
  duration?: string;
  language?: string;
  enrollmentCount?: number;
  contentCreatedAt?: string; // Content creation date (YYYY-MM-DD)
}

interface CourseFeaturesSectionProps {
  features?: string[];
  course?: CourseData;
  darkMode?: boolean;
}

export function CourseFeaturesSection({ features, course, darkMode = false }: CourseFeaturesSectionProps) {
  // Build features dynamically based on course data
  const buildFeatures = () => {
    const featuresList: Array<{ icon: typeof Infinity; title: string; description: string }> = [];

    // Add content creation date if available
    if (course?.contentCreatedAt) {
      featuresList.push({
        icon: Calendar,
        title: `Készült: ${formatHungarianDate(course.contentCreatedAt)}`,
        description: 'A tartalom eredeti készítésének dátuma'
      });
    }

    // Always show these core features
    featuresList.push(
      { icon: Infinity, title: 'Korlátlan hozzáférés', description: 'Élethosszig tartó hozzáférés a tartalomhoz' },
      { icon: Smartphone, title: 'Mobilon is elérhető', description: 'Tanulj bárhol, bármikor, bármilyen eszközön' }
    );

    // Add duration if available
    if (course?.duration) {
      featuresList.push({
        icon: Trophy,
        title: course.duration,
        description: 'Teljes időtartam'
      });
    }

    // Add downloadable materials
    featuresList.push(
      { icon: Download, title: 'Letölthető anyagok', description: 'Gyakorlati feladatok és segédletek' }
    );

    // Add community access
    featuresList.push(
      { icon: MessageSquare, title: 'Közösségi hozzáférés', description: 'Csatlakozz más tanulókhoz' }
    );

    return featuresList;
  };

  const defaultFeatures = buildFeatures();

  // Dark mode styles
  const containerClass = darkMode
    ? 'py-6 border-b border-gray-800'
    : 'bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 lg:p-8';

  const headingClass = darkMode ? 'text-white' : 'text-gray-900';
  const featureCardClass = darkMode
    ? 'border-gray-800 hover:border-gray-700'
    : 'bg-white/40 hover:bg-white/60 border-gray-100/50';
  const featureTitleClass = darkMode ? 'text-white' : 'text-gray-900';
  const featureDescClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const iconBgClass = darkMode
    ? 'bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/10'
    : 'bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/5';

  return (
    <motion.section
      className={containerClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className={`text-2xl font-bold ${headingClass} mb-6`}>
        Mit kapsz a tartalommal?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className={`flex gap-4 items-start p-4 rounded-lg ${featureCardClass} transition-all duration-200 border`}
            >
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-lg ${iconBgClass} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-brand-secondary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold ${featureTitleClass} text-sm mb-1`}>
                  {feature.title}
                </h3>
                <p className={`text-xs ${featureDescClass} leading-relaxed`}>
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
