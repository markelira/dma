'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { motion } from "motion/react";
import Link from 'next/link';
import { useTrialCTA } from '@/hooks/useTrialCTA';

interface CourseData {
  certificateEnabled?: boolean;
  duration?: string;
  language?: string;
  enrollmentCount?: number;
  contentCreatedAt?: string;
}

interface CourseFeaturesSectionProps {
  features?: string[];
  course?: CourseData;
  darkMode?: boolean;
  isSubscriber?: boolean;
}

const offerFeatures = [
  'Teljes hozzáférés 150+ struktúraépítő tartalomhoz',
  'Több mint 200 órányi azonnal alkalmazható, működő rendszer',
  '5 munkatárs díjmentes hozzáadása',
  'Hetente frissülő tartalmak',
  'Bármikor lemondható',
];

export function CourseFeaturesSection({ darkMode = false, isSubscriber = false }: CourseFeaturesSectionProps) {
  const { handleTrialClick } = useTrialCTA();

  // Hide sales section for subscribers
  if (isSubscriber) {
    return null;
  }

  const containerClass = darkMode
    ? 'py-6 border-b border-gray-800'
    : 'bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 lg:p-8';

  const headingClass = darkMode ? 'text-white' : 'text-gray-900';
  const textClass = darkMode ? 'text-gray-300' : 'text-gray-600';
  const priceClass = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <motion.section
      className={containerClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className={`text-2xl font-bold ${headingClass} mb-2`}>
        Vágj bele a kalandba
      </h2>
      <p className={`${textClass} mb-6`}>
        Fedezd fel a 150+ cégépítési tartalmat, hogy vállalkozásod végre strukturált és önjáró legyen.
      </p>

      <div className="flex items-baseline gap-1 mb-6">
        <span className={`text-4xl font-bold ${priceClass}`}>14 990</span>
        <span className={`text-xl ${textClass}`}>Ft</span>
        <span className={`text-lg ${textClass}`}>/hó</span>
      </div>

      <ul className="space-y-3 mb-6">
        {offerFeatures.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-secondary/20 flex items-center justify-center">
              <Check className="w-3 h-3 text-brand-secondary" />
            </div>
            <span className={textClass}>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={handleTrialClick}
        className="inline-flex items-center justify-center w-full px-6 py-3 bg-brand-secondary text-white rounded-lg font-semibold hover:bg-brand-secondary/90 transition-colors"
      >
        Fedezd fel
      </button>
    </motion.section>
  );
}
