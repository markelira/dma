'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, Copy, Gift, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RiddleDiscountCardProps {
  onSkip: () => void;
}

type RiddleState = 'riddle' | 'celebrating' | 'revealed';

const ANSWERS = [
  { label: 'Attila', code: 'ATTILA' },
  { label: 'kecske', code: 'KECSKE' },
  { label: 'asztal', code: 'ASZTAL' },
  { label: 'sz\u00e9k', code: 'SZEK' },
] as const;

const SESSION_KEY = 'riddle_coupon_code';

export function RiddleDiscountCard({ onSkip }: RiddleDiscountCardProps) {
  const [state, setState] = useState<RiddleState>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return 'revealed';
    }
    return 'riddle';
  });

  const [couponCode, setCouponCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_KEY) || '';
    }
    return '';
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fireConfetti = useCallback(() => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 60,
      startVelocity: 25,
      spread: 360,
      ticks: 50,
      zIndex: 100,
      origin: { x, y },
      colors: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'],
    });
  }, []);

  const handleAnswer = useCallback((code: string, label: string) => {
    if (state !== 'riddle') return;

    setSelectedAnswer(label);
    setCouponCode(code);
    sessionStorage.setItem(SESSION_KEY, code);
    setState('celebrating');
    fireConfetti();
  }, [state, fireConfetti]);

  useEffect(() => {
    if (state !== 'celebrating') return;
    const timer = setTimeout(() => setState('revealed'), 1500);
    return () => clearTimeout(timer);
  }, [state]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = couponCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [couponCode]);

  return (
    <div ref={cardRef}>
      <AnimatePresence mode="wait">
        {/* RIDDLE STATE */}
        {state === 'riddle' && (
          <motion.div
            key="riddle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/50 to-yellow-50 p-5 sm:p-6"
          >
            {/* Decorative corner sparkle */}
            <div className="absolute -top-1 -right-1 text-amber-300/40">
              <Sparkles className="w-16 h-16" />
            </div>

            {/* Icon + Question */}
            <div className="relative flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-sm">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900 leading-tight">
                  {`4 l\u00e1ba van, asztal, de nem sz\u00e9k. Mi az?`}
                </h3>
                <p className="text-sm text-amber-700/80 mt-1">
                  {`V\u00e1lassz egy v\u00e1laszt \u00e9s szerezz kedvezm\u00e9nyt!`}
                </p>
              </div>
            </div>

            {/* Answer Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {ANSWERS.map((answer) => (
                <motion.button
                  key={answer.code}
                  type="button"
                  onClick={() => handleAnswer(answer.code, answer.label)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-amber-200 bg-white/80 hover:bg-white hover:border-amber-400 text-amber-900 font-medium text-sm transition-colors shadow-sm hover:shadow-md cursor-pointer"
                >
                  {answer.label}
                </motion.button>
              ))}
            </div>

            {/* Skip link */}
            <div className="text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-xs text-amber-600/60 hover:text-amber-700 transition-colors cursor-pointer"
              >
                Kihagyom
              </button>
            </div>
          </motion.div>
        )}

        {/* CELEBRATING STATE */}
        {state === 'celebrating' && (
          <motion.div
            key="celebrating"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
            className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-5 sm:p-6"
          >
            <div className="flex flex-col items-center text-center py-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-3 shadow-lg shadow-emerald-200"
              >
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-bold text-emerald-800"
              >
                {`Szuper! Megtal\u00e1ltad a kedvezm\u00e9nyt!`}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-emerald-600 mt-1"
              >
                {selectedAnswer ? `V\u00e1lasz: ${selectedAnswer}` : ''}
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* REVEALED STATE */}
        {state === 'revealed' && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-green-50/60 p-5 sm:p-6"
          >
            <div className="flex flex-col items-center text-center">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-emerald-800">
                  {`Gratul\u00e1lunk!`}
                </h3>
              </div>

              {/* Coupon code box */}
              <div className="w-full max-w-xs mb-3">
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-emerald-300 bg-white">
                  <span className="text-xl font-bold tracking-widest text-emerald-700 font-mono">
                    {couponCode}
                  </span>
                  <motion.button
                    type="button"
                    onClick={handleCopy}
                    whileTap={{ scale: 0.9 }}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      copied
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        {`M\u00e1solva!`}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        {`M\u00e1sol\u00e1s`}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Instruction */}
              <p className="text-sm text-emerald-600/80 flex items-center gap-1">
                {`Illeszd be lent a kuponk\u00f3d mez\u0151be`}
                <ChevronDown className="w-3.5 h-3.5" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
