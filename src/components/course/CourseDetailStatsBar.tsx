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
    <div className="bg-white border-y border-gray-200 py-6">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Befejezési arány</p>
              <p className="text-lg font-bold text-gray-900">{completionRate}%</p>
            </div>
          </div>

          {certificateAvailable && (
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Tanúsítvány</p>
                <p className="text-lg font-bold text-gray-900">Igen</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Készségek</p>
              <p className="text-lg font-bold text-gray-900">{skillsGained}</p>
            </div>
          </div>

          {guarantee && (
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Garancia</p>
                <p className="text-lg font-bold text-gray-900">30 nap</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
