'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Sparkles, Target, Book, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { UserPreferences, OnboardingState } from '@/types';

interface OnboardingWizardProps {
  onComplete: (preferences: Partial<UserPreferences>) => Promise<void>;
  onSkip: () => void;
  initialData?: Partial<UserPreferences>;
}

const TOTAL_STEPS = 5;

const INTERESTS_OPTIONS = [
  { id: 'marketing', label: 'Marketing', icon: '📈' },
  { id: 'sales', label: 'Értékesítés', icon: '💼' },
  { id: 'leadership', label: 'Vezetés', icon: '👥' },
  { id: 'management', label: 'Menedzsment', icon: '⚙️' },
  { id: 'communication', label: 'Kommunikáció', icon: '💬' },
  { id: 'productivity', label: 'Produktivitás', icon: '🚀' },
  { id: 'strategy', label: 'Stratégia', icon: '🎯' },
  { id: 'innovation', label: 'Innováció', icon: '💡' },
];

const GOALS_OPTIONS = [
  { id: 'career_growth', label: 'Karrierfejlesztés' },
  { id: 'skill_upgrade', label: 'Készségfejlesztés' },
  { id: 'certification', label: 'Szakmai bizonyítványok' },
  { id: 'team_leadership', label: 'Csapatvezetés' },
  { id: 'business_strategy', label: 'Üzleti stratégia' },
  { id: 'personal_development', label: 'Személyes fejlődés' },
];

const LEARNING_STYLES = [
  {
    id: 'visual' as const,
    label: 'Vizuális',
    description: 'Videók, infografikák és diagramok',
    icon: '👁️'
  },
  {
    id: 'reading' as const,
    label: 'Olvasás',
    description: 'Szöveges anyagok és dokumentumok',
    icon: '📚'
  },
  {
    id: 'interactive' as const,
    label: 'Interaktív',
    description: 'Kvízek, feladatok és gyakorlatok',
    icon: '🎮'
  },
  {
    id: 'mixed' as const,
    label: 'Vegyes',
    description: 'Minden típusú tartalom',
    icon: '🔄'
  },
];

const WEEKLY_GOAL_PRESETS = [
  { minutes: 180, label: '3 óra', description: 'Kezdő tempó' },
  { minutes: 300, label: '5 óra', description: 'Ajánlott' },
  { minutes: 420, label: '7 óra', description: 'Intenzív' },
  { minutes: 600, label: '10+ óra', description: 'Elkötelezett' },
];

export function OnboardingWizard({ onComplete, onSkip, initialData }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [onboardingData, setOnboardingData] = useState<Partial<UserPreferences>>({
    role: initialData?.role || '',
    interests: initialData?.interests || [],
    goals: initialData?.goals || [],
    learningStyle: initialData?.learningStyle || 'mixed',
    weeklyHoursGoal: initialData?.weeklyHoursGoal || 300, // Default 5 hours
    notifications: {
      email: true,
      push: true,
      reminders: true,
      achievements: true,
      courseUpdates: true,
    },
    darkMode: false,
    onboardingCompleted: false,
  });

  const updateData = (key: keyof UserPreferences, value: any) => {
    setOnboardingData(prev => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interestId: string) => {
    const interests = onboardingData.interests || [];
    if (interests.includes(interestId)) {
      updateData('interests', interests.filter(id => id !== interestId));
    } else {
      updateData('interests', [...interests, interestId]);
    }
  };

  const toggleGoal = (goalId: string) => {
    const goals = onboardingData.goals || [];
    if (goals.includes(goalId)) {
      updateData('goals', goals.filter(id => id !== goalId));
    } else {
      updateData('goals', [...goals, goalId]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return onboardingData.role && onboardingData.role.length > 0;
      case 2:
        return (onboardingData.interests?.length || 0) >= 2;
      case 3:
        return (onboardingData.goals?.length || 0) >= 1;
      case 4:
        return !!onboardingData.learningStyle;
      case 5:
        return onboardingData.weeklyHoursGoal && onboardingData.weeklyHoursGoal > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onComplete({
        ...onboardingData,
        onboardingCompleted: true,
      });
    } catch (error) {
      console.error('Onboarding completion error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 relative overflow-hidden">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-secondary" />
                <h2 className="text-2xl font-bold">Személyre szabás</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground"
              >
                Kihagyás
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-secondary to-purple-600"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              {currentStep}. lépés / {TOTAL_STEPS}
            </p>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentStep === 1 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-brand-secondary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Mi a szerepköröd?</h3>
                        <p className="text-sm text-muted-foreground">
                          Ez segít nekünk releváns tartalmakat ajánlani
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label htmlFor="role">Jelenlegi pozíció vagy cél</Label>
                      <Input
                        id="role"
                        placeholder="pl. Marketing menedzser, Értékesítési vezető, Vállalkozó"
                        value={onboardingData.role || ''}
                        onChange={(e) => updateData('role', e.target.value)}
                        className="text-base"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <Book className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Mik az érdeklődési köreid?</h3>
                        <p className="text-sm text-muted-foreground">
                          Válassz legalább 2 témát, ami érdekel (több is lehet)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {INTERESTS_OPTIONS.map(interest => (
                        <button
                          key={interest.id}
                          onClick={() => toggleInterest(interest.id)}
                          className={`
                            p-4 rounded-lg border-2 transition-all text-left
                            hover:border-purple-300 hover:bg-purple-50/50
                            ${
                              onboardingData.interests?.includes(interest.id)
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-border bg-background'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{interest.icon}</span>
                            <span className="font-medium">{interest.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Target className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Mik a céljaid?</h3>
                        <p className="text-sm text-muted-foreground">
                          Mit szeretnél elérni a tanulással?
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {GOALS_OPTIONS.map(goal => (
                        <button
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className={`
                            w-full p-4 rounded-lg border-2 transition-all text-left
                            hover:border-green-300 hover:bg-green-50/50
                            ${
                              onboardingData.goals?.includes(goal.id)
                                ? 'border-green-600 bg-green-50'
                                : 'border-border bg-background'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{goal.label}</span>
                            {onboardingData.goals?.includes(goal.id) && (
                              <Check className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                        <Book className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Hogyan szeretsz tanulni?</h3>
                        <p className="text-sm text-muted-foreground">
                          Válaszd ki a számodra legmegfelelőbb módszert
                        </p>
                      </div>
                    </div>

                    <RadioGroup
                      value={onboardingData.learningStyle}
                      onValueChange={(value) => updateData('learningStyle', value)}
                      className="space-y-3"
                    >
                      {LEARNING_STYLES.map(style => (
                        <label
                          key={style.id}
                          className={`
                            flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                            hover:border-orange-300 hover:bg-orange-50/50
                            ${
                              onboardingData.learningStyle === style.id
                                ? 'border-orange-600 bg-orange-50'
                                : 'border-border bg-background'
                            }
                          `}
                        >
                          <RadioGroupItem value={style.id} id={style.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{style.icon}</span>
                              <span className="font-medium">{style.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{style.description}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                {currentStep === 5 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-brand-secondary/10 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-brand-secondary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Heti tanulási cél</h3>
                        <p className="text-sm text-muted-foreground">
                          Hány órát szeretnél hetente tanulni?
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                        {WEEKLY_GOAL_PRESETS.map(preset => (
                          <button
                            key={preset.minutes}
                            onClick={() => updateData('weeklyHoursGoal', preset.minutes)}
                            className={`
                              p-4 rounded-lg border-2 transition-all
                              hover:border-brand-secondary/30 hover:bg-brand-secondary/5/50
                              ${
                                onboardingData.weeklyHoursGoal === preset.minutes
                                  ? 'border-brand-secondary bg-brand-secondary/5'
                                  : 'border-border bg-background'
                              }
                            `}
                          >
                            <div className="text-2xl font-bold text-brand-secondary mb-1">
                              {preset.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {preset.description}
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="pt-4 border-t">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Bell className="w-4 h-4" />
                          Értesítési beállítások
                        </h4>
                        <div className="space-y-3">
                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={onboardingData.notifications?.reminders}
                              onCheckedChange={(checked) =>
                                updateData('notifications', {
                                  ...onboardingData.notifications,
                                  reminders: !!checked,
                                })
                              }
                            />
                            <div>
                              <div className="font-medium text-sm">Tanulási emlékeztetők</div>
                              <div className="text-xs text-muted-foreground">
                                Napi értesítések a tanulási célod eléréséhez
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center gap-3">
                            <Checkbox
                              checked={onboardingData.notifications?.achievements}
                              onCheckedChange={(checked) =>
                                updateData('notifications', {
                                  ...onboardingData.notifications,
                                  achievements: !!checked,
                                })
                              }
                            />
                            <div>
                              <div className="font-medium text-sm">Eredmény értesítések</div>
                              <div className="text-xs text-muted-foreground">
                                Értesítés új jelvények és eredmények feloldásakor
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Vissza
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="gap-2 bg-gradient-to-r from-brand-secondary to-purple-600 hover:from-brand-secondary-hover hover:to-purple-700"
            >
              {currentStep === TOTAL_STEPS ? (
                isSubmitting ? (
                  'Mentés...'
                ) : (
                  <>
                    Kezdés
                    <Check className="w-4 h-4" />
                  </>
                )
              ) : (
                <>
                  Következő
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
