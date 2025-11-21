'use client';

import React, { useState } from 'react';
import { Hero1ConversionFocused } from '@/components/course/heroes/Hero1ConversionFocused';
import { Hero2ImmersiveStorytelling } from '@/components/course/heroes/Hero2ImmersiveStorytelling';
import { Hero3CleanEfficient } from '@/components/course/heroes/Hero3CleanEfficient';
import { Monitor, Smartphone, Eye, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type HeroVariant = 'hero1' | 'hero2' | 'hero3';
type ViewportMode = 'desktop' | 'mobile';

export default function HeroesPreviewPage() {
  const [selectedHero, setSelectedHero] = useState<HeroVariant>('hero1');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [copied, setCopied] = useState(false);

  // Mock Course Data (realistic for DMA platform)
  const mockCourseData = {
    title: 'Vezetői készségfejlesztés a modern munkahelyeken',
    description: 'Tanulj meg hatékonyan vezetni, motiválni és építeni egy magas teljesítményű csapatot. Ez a gyakorlatorientált kurzus segít elsajátítani a vezetői készségeket, amelyekkel valódi változást érhetsz el a szervezetedben.',
    transformationStatement: 'Válj magabiztos vezetővé 12 hét alatt',
    categories: ['Vezetés', 'Soft Skills'],
    level: 'Középhaladó',
    rating: 4.9,
    students: 2487,
    lessons: 48,
    reviewCount: 746,
    recommendationPercent: 96,
    imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop',
    courseType: 'ACADEMIA' as const,
    instructors: [
      {
        id: '1',
        name: 'Dr. Nagy Péter',
        title: 'Szervezetfejlesztési szakértő, Executive Coach',
        bio: 'Több mint 15 éves tapasztalattal rendelkezem vezetőfejlesztés és szervezeti kultúra területén.',
        profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'
      }
    ],
    keyOutcomes: [
      'Hatékony csapatépítési és motivációs technikák',
      'Konfliktuskezelés és nehéz beszélgetések vezetése',
      'Stratégiai gondolkodás és döntéshozatal fejlesztése'
    ],
    // Realistic module structure with video durations
    modules: [
      {
        id: 'module-1',
        title: 'Bevezetés a vezetésbe',
        lessons: [
          { id: 'lesson-1-1', title: 'Mi a vezetés?', type: 'VIDEO' as const, duration: 15 },
          { id: 'lesson-1-2', title: 'Vezetési stílusok', type: 'VIDEO' as const, duration: 22 },
          { id: 'lesson-1-3', title: 'Önismeret kvíz', type: 'QUIZ' as const },
        ]
      },
      {
        id: 'module-2',
        title: 'Csapatépítés és motiváció',
        lessons: [
          { id: 'lesson-2-1', title: 'Hatékony csapatok jellemzői', type: 'VIDEO' as const, duration: 28 },
          { id: 'lesson-2-2', title: 'Motivációs technikák', type: 'VIDEO' as const, duration: 35 },
          { id: 'lesson-2-3', title: 'Visszajelzés művészete', type: 'VIDEO' as const, duration: 18 },
          { id: 'lesson-2-4', title: 'Esettanulmány', type: 'TEXT' as const },
        ]
      },
      {
        id: 'module-3',
        title: 'Konfliktuskezelés',
        lessons: [
          { id: 'lesson-3-1', title: 'Konfliktustípusok', type: 'VIDEO' as const, duration: 20 },
          { id: 'lesson-3-2', title: 'Mediációs technikák', type: 'VIDEO' as const, duration: 32 },
          { id: 'lesson-3-3', title: 'Nehéz beszélgetések', type: 'VIDEO' as const, duration: 25 },
        ]
      },
      {
        id: 'module-4',
        title: 'Stratégiai vezetés',
        lessons: [
          { id: 'lesson-4-1', title: 'Vízió és stratégia', type: 'VIDEO' as const, duration: 30 },
          { id: 'lesson-4-2', title: 'Döntéshozatal', type: 'VIDEO' as const, duration: 27 },
          { id: 'lesson-4-3', title: 'Változásmenedzsment', type: 'VIDEO' as const, duration: 38 },
          { id: 'lesson-4-4', title: 'Projektmunka', type: 'TEXT' as const },
        ]
      },
      {
        id: 'module-5',
        title: 'Vezetői kommunikáció',
        lessons: [
          { id: 'lesson-5-1', title: 'Hatékony kommunikáció', type: 'VIDEO' as const, duration: 24 },
          { id: 'lesson-5-2', title: 'Prezentációs készségek', type: 'VIDEO' as const, duration: 29 },
          { id: 'lesson-5-3', title: 'Aktív hallgatás', type: 'VIDEO' as const, duration: 16 },
        ]
      },
      {
        id: 'module-6',
        title: 'Összegzés és gyakorlat',
        lessons: [
          { id: 'lesson-6-1', title: 'Kihívások és megoldások', type: 'VIDEO' as const, duration: 21 },
          { id: 'lesson-6-2', title: 'Személyes fejlesztési terv', type: 'VIDEO' as const, duration: 18 },
          { id: 'lesson-6-3', title: 'Záró kvíz', type: 'QUIZ' as const },
        ]
      }
    ],
    price: 49990,
    isSubscriptionIncluded: true
  };

  const handleCopyComponent = () => {
    const componentName = selectedHero === 'hero1' ? 'Hero1ConversionFocused' :
                          selectedHero === 'hero2' ? 'Hero2ImmersiveStorytelling' :
                          'Hero3CleanEfficient';

    navigator.clipboard.writeText(`import { ${componentName} } from '@/components/course/heroes/${componentName}';`);
    setCopied(true);
    toast.success('Import statement copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const heroVariants = [
    {
      id: 'hero1' as HeroVariant,
      name: 'Conversion-Focused',
      description: 'E-commerce style with sticky card',
      bestFor: 'Paid courses, high-volume',
      color: 'bg-blue-600'
    },
    {
      id: 'hero2' as HeroVariant,
      name: 'Immersive Storytelling',
      description: 'MasterClass style with glassmorphic card',
      bestFor: 'Masterclass, flagship courses',
      color: 'bg-purple-600'
    },
    {
      id: 'hero3' as HeroVariant,
      name: 'Clean & Efficient',
      description: 'Modern SaaS style',
      bestFor: 'Academia, corporate training',
      color: 'bg-teal-600'
    }
  ];

  const renderSelectedHero = () => {
    const commonProps = {
      ...mockCourseData,
      onEnroll: () => toast.success('Enrollment clicked!'),
      onPreview: () => toast.info('Preview clicked!')
    };

    switch (selectedHero) {
      case 'hero1':
        return <Hero1ConversionFocused {...commonProps} />;
      case 'hero2':
        return <Hero2ImmersiveStorytelling {...commonProps} />;
      case 'hero3':
        return <Hero3CleanEfficient {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Fixed Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hero Variants Preview</h1>
              <p className="text-sm text-gray-600">Compare and choose your course hero design</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Viewport Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewportMode('desktop')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewportMode === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  Desktop
                </button>
                <button
                  onClick={() => setViewportMode('mobile')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewportMode === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </button>
              </div>

              {/* Copy Import */}
              <Button
                onClick={handleCopyComponent}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Import
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Hero Selector Tabs */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {heroVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedHero(variant.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedHero === variant.id
                    ? `${variant.color} text-white border-transparent shadow-lg`
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-sm">{variant.name}</div>
                  <div className={`text-xs mt-0.5 ${
                    selectedHero === variant.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {variant.description}
                  </div>
                  <div className={`text-xs mt-1 flex items-center gap-1 ${
                    selectedHero === variant.id ? 'text-white/70' : 'text-gray-400'
                  }`}>
                    <Eye className="w-3 h-3" />
                    {variant.bestFor}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="py-8">
        <div className={`mx-auto transition-all duration-300 ${
          viewportMode === 'mobile'
            ? 'max-w-md border-8 border-gray-800 rounded-3xl overflow-hidden shadow-2xl'
            : 'w-full'
        }`}>
          <div className={viewportMode === 'mobile' ? 'bg-white' : ''}>
            {renderSelectedHero()}
          </div>
        </div>
      </div>

      {/* Info Panel at Bottom */}
      <div className="container mx-auto px-6 pb-12">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {heroVariants.find(v => v.id === selectedHero)?.name}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Best For</h3>
              <p className="text-gray-600">{heroVariants.find(v => v.id === selectedHero)?.bestFor}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Key Features</h3>
              <ul className="text-gray-600 space-y-1">
                {selectedHero === 'hero1' && (
                  <>
                    <li>• Sticky enrollment card</li>
                    <li>• Prominent social proof</li>
                    <li>• Clear CTA hierarchy</li>
                  </>
                )}
                {selectedHero === 'hero2' && (
                  <>
                    <li>• Full-screen background</li>
                    <li>• Glassmorphic design</li>
                    <li>• Emotional storytelling</li>
                  </>
                )}
                {selectedHero === 'hero3' && (
                  <>
                    <li>• Clean, minimal layout</li>
                    <li>• Fast load time</li>
                    <li>• Excellent mobile UX</li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Component Path</h3>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
                {`/components/course/heroes/${
                  selectedHero === 'hero1' ? 'Hero1ConversionFocused' :
                  selectedHero === 'hero2' ? 'Hero2ImmersiveStorytelling' :
                  'Hero3CleanEfficient'
                }.tsx`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
