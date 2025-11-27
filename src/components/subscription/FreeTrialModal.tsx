'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Check,
  Sparkles,
  X as CloseIcon,
  BookOpen,
  Award,
  Clock,
  Users
} from 'lucide-react';

interface FreeTrialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: 'dashboard' | 'course-auth' | 'course-unauth';
  courseName?: string;
  onStartTrial: () => void;
  onDismiss: () => void;
}

export function FreeTrialModal({
  open,
  onOpenChange,
  variant,
  courseName,
  onStartTrial,
  onDismiss
}: FreeTrialModalProps) {
  const handleClose = () => {
    onDismiss();
    onOpenChange(false);
  };

  const handleStartTrial = () => {
    onStartTrial();
    onOpenChange(false);
  };

  // Variant-specific headline
  const getSubheadline = () => {
    switch (variant) {
      case 'dashboard':
        return 'Kezdd el a tanulást most!';
      case 'course-auth':
        return courseName ? `Hozzáférés: ${courseName}` : 'Hozzáférés a kurzushoz';
      case 'course-unauth':
        return courseName ? `Hozzáférés: ${courseName}` : 'Hozzáférés a kurzushoz';
    }
  };

  const benefits = [
    { icon: BookOpen, text: '100+ prémium kurzus' },
    { icon: Users, text: 'Szakértő oktatók' },
    { icon: Award, text: 'Tanúsítványok' },
    { icon: Clock, text: 'Bármikor lemondható' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 hover:bg-gray-100 transition-colors"
        >
          <CloseIcon className="h-5 w-5 text-gray-500" />
        </button>

        {/* Gradient header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-8 pb-6 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-white mb-2">
              7 NAPOS INGYENES PRÓBA
            </DialogTitle>
          </DialogHeader>
          <p className="text-blue-100 text-lg">
            {getSubheadline()}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Benefits list */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              Korlátlan hozzáférés minden kurzushoz
            </p>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleStartTrial}
            className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all"
          >
            PRÓBA INDÍTÁSA INGYEN
          </Button>

          {/* Pricing preview */}
          <div className="text-center space-y-1 pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              A próbaidőszak után: <span className="font-semibold text-gray-700">15 000 Ft/hó</span>
            </p>
            <p className="text-xs text-gray-400">
              6 hó: 13 500 Ft/hó • 12 hó: 13 200 Ft/hó
            </p>
          </div>

          {/* Unauth variant - additional message */}
          {variant === 'course-unauth' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-sm text-amber-800">
                A próba indításához be kell jelentkezned. A bejelentkezés után visszairányítunk ide.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
