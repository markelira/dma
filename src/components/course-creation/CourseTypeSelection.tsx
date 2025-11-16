'use client';

import { useState } from 'react';
import { CourseType, COURSE_TYPE_LABELS, COURSE_TYPE_DESCRIPTIONS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Video, GraduationCap, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseTypeSelectionProps {
  onSelect: (type: CourseType) => void;
  initialSelection?: CourseType;
}

const courseTypeConfig: Record<CourseType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
  examples: string[];
}> = {
  ACADEMIA: {
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-400',
    examples: [
      'Többhetes képzések videókkal',
      '5-50 leckéből álló kurzusok',
      'Strukturált tananyag modulokkal',
    ],
  },
  WEBINAR: {
    icon: Video,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-400',
    examples: [
      'Egyszeri előadások',
      '1 videó leckével',
      'Letölthető erőforrásokkal',
    ],
  },
  MASTERCLASS: {
    icon: GraduationCap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-400',
    examples: [
      'Átfogó mesterkurzusok',
      'Több modul és lecke',
      'Komplex témakörök',
    ],
  },
};

export default function CourseTypeSelection({ onSelect, initialSelection }: CourseTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<CourseType | null>(initialSelection || null);
  const [hoveredType, setHoveredType] = useState<CourseType | null>(null);

  const handleSelect = (type: CourseType) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Milyen típusú kurzust szeretnél létrehozni?
        </h2>
        <p className="text-gray-600 text-lg">
          Válaszd ki a kurzus típusát az induláshoz
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {(Object.entries(courseTypeConfig) as [CourseType, typeof courseTypeConfig[CourseType]][]).map(
          ([type, config]) => {
            const Icon = config.icon;
            const isSelected = selectedType === type;
            const isHovered = hoveredType === type;

            return (
              <Card
                key={type}
                className={cn(
                  'relative cursor-pointer transition-all duration-200 border-2',
                  config.borderColor,
                  isSelected && 'ring-2 ring-offset-2 ring-primary shadow-lg scale-105',
                  isHovered && !isSelected && 'shadow-md scale-102'
                )}
                onClick={() => handleSelect(type)}
                onMouseEnter={() => setHoveredType(type)}
                onMouseLeave={() => setHoveredType(null)}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-primary text-white rounded-full p-2 shadow-lg z-10">
                    <Check className="h-5 w-5" />
                  </div>
                )}

                <CardContent className="p-6">
                  <div className={cn('rounded-lg p-4 mb-4', config.bgColor)}>
                    <Icon className={cn('h-12 w-12 mx-auto', config.color)} />
                  </div>

                  <h3 className="text-xl font-bold text-center mb-2">
                    {COURSE_TYPE_LABELS[type]}
                  </h3>

                  <p className="text-gray-600 text-center mb-4 min-h-[48px]">
                    {COURSE_TYPE_DESCRIPTIONS[type]}
                  </p>

                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Jellemzők:</p>
                    <ul className="space-y-1">
                      {config.examples.map((example, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-start">
                          <span className="text-primary mr-2 mt-0.5">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedType}
          className="min-w-[200px]"
        >
          Tovább
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">{COURSE_TYPE_LABELS[selectedType]}</span> típusú kurzust választottál.
            Kattints a "Tovább" gombra a folytatáshoz.
          </p>
        </div>
      )}
    </div>
  );
}
