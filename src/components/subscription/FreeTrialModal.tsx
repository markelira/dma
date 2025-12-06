'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import {
  Check,
  Play,
  X as CloseIcon
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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Set up portal container on mount (client-side only)
  useEffect(() => {
    setPortalContainer(document.body);
    return () => setPortalContainer(null);
  }, []);

  const handleClose = () => {
    onDismiss();
    onOpenChange(false);
  };

  const handleStartTrial = () => {
    onStartTrial();
    onOpenChange(false);
  };

  // Variant-specific subheadline
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
    'Minden tartalom',
    'Webinárok + Akadémia',
    'Mobil hozzáférés',
    'Nincs elköteleződés'
  ];

  if (!portalContainer || !open) return null;

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-gray-900/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-brand-secondary/50 to-brand-secondary opacity-20 blur-2xl rounded-3xl" />

              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 z-10 rounded-full p-1.5 bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <CloseIcon className="h-5 w-5 text-white" />
                </button>

                {/* Gradient header */}
                <div className="bg-gradient-to-t from-brand-secondary to-brand-secondary/50 px-6 pt-10 pb-8 text-center">
                  {/* Play icon with animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                    className="flex justify-center mb-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </motion.div>

                  {/* Headline */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl font-bold text-white tracking-tight mb-2"
                  >
                    FEDEZD FEL 7 NAPIG INGYEN
                  </motion.h2>

                  {/* Subheadline */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-white/80 text-base"
                  >
                    {getSubheadline()}
                  </motion.p>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                  {/* Benefits grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-3"
                  >
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700 tracking-tight">{benefit}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Button
                      onClick={handleStartTrial}
                      className="w-full h-14 text-lg font-bold bg-brand-secondary hover:bg-brand-secondary-hover shadow-lg shadow-brand-secondary/30 hover:shadow-brand-secondary/40 transition-all tracking-tight"
                    >
                      FEDEZD FEL INGYEN
                    </Button>
                  </motion.div>

                  {/* Unauth variant - subtle text */}
                  {variant === 'course-unauth' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-sm text-gray-500 text-center"
                    >
                      Bejelentkezés szükséges a folytatáshoz
                    </motion.p>
                  )}

                  {/* Pricing preview */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center pt-4 border-t border-gray-100"
                  >
                    <p className="text-sm text-gray-500">
                      A próba után: <span className="font-semibold text-gray-700">14 990 Ft/hó</span>
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, portalContainer);
}
