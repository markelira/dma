'use client';

import React from 'react';
import { TrendingUp, Award, Target, Shield } from 'lucide-react';

interface CourseDetailStatsBarProps {
  completionRate: number;
  certificateAvailable: boolean;
  skillsGained: number;
  guarantee: boolean;
}

export function CourseDetailStatsBar({
  completionRate,
  certificateAvailable,
  skillsGained,
  guarantee
}: CourseDetailStatsBarProps) {
  return (
    <div className="relative py-6 border-b border-gray-200/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Befejezés</p>
                <p className="text-2xl font-semibold text-gray-900">{completionRate}%</p>
              </div>
            </div>

            {certificateAvailable && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tanúsítvány</p>
                  <p className="text-2xl font-semibold text-gray-900">✓</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Készségek</p>
                <p className="text-2xl font-semibold text-gray-900">{skillsGained}</p>
              </div>
            </div>

            {guarantee && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Garancia</p>
                  <p className="text-2xl font-semibold text-gray-900">30</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
