'use client';

import React from 'react';
import { Infinity, Smartphone, Download, MessageSquare, Trophy } from 'lucide-react';
import { motion } from "motion/react";

interface CourseFeaturesSectionProps {
  features?: string[];
}

export function CourseFeaturesSection({ features }: CourseFeaturesSectionProps) {
  // Default features if none provided
  const defaultFeatures = [
    { icon: Infinity, title: 'Korlátlan hozzáférés', description: 'Élethosszig tartó hozzáférés a tartalomhoz' },
    { icon: Smartphone, title: 'Mobilon is elérhető', description: 'Tanulj bárhol, bármikor, bármilyen eszközön' },
    { icon: Download, title: 'Letölthető anyagok', description: 'Gyakorlati feladatok és segédletek' },
    { icon: MessageSquare, title: 'Közösségi hozzáférés', description: 'Csatlakozz más tanulókhoz és oszd meg tapasztalataidat' },
    { icon: Trophy, title: 'Kvízek és feladatok', description: 'Ellenőrizd tudásod interaktív feladatokkal' }
  ];

  return (
    <motion.section
      className="bg-white/60 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg p-6 lg:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Mit kapsz a tartalommal?
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {defaultFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex gap-4 items-start p-4 rounded-lg bg-white/40 hover:bg-white/60 transition-all duration-200 border border-gray-100/50"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/5 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-brand-secondary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
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
