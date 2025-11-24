'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { motion } from "motion/react";

interface CourseOutcomesSectionProps {
  outcomes?: string[];
}

export function CourseOutcomesSection({ outcomes }: CourseOutcomesSectionProps) {
  if (!outcomes || outcomes.length === 0) return null;

  return (
    <motion.section
      className="bg-gradient-to-br from-blue-50/50 to-purple-50/30 backdrop-blur-xl border border-blue-200/30 rounded-xl shadow-lg p-6 lg:p-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <Target className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Mit érsz el a tartalom végére?
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {outcomes.map((outcome: string, index: number) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/60">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-gray-800 font-medium text-sm">{outcome}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
