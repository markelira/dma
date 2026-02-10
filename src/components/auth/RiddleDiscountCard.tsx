'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RiddleDiscountCardProps {
  onSkip: () => void;
}

type RiddleState = 'riddle' | 'celebrating' | 'revealed';

const ANSWERS = [
  { label: 'Attila', code: 'ATTILA' },
  { label: 'kecske', code: 'KECSKE' },
  { label: 'asztal', code: 'ASZTAL' },
  { label: 'szék', code: 'SZEK' },
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
      colors: ['#C8A96E', '#8B6F4E', '#D4B896', '#A67C52', '#E8D5B7'],
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
            className="relative rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6"
          >
            {/* Discount badge */}
            <div className="absolute -top-2.5 right-4">
              <span className="inline-block px-2.5 py-0.5 bg-stone-800 text-white text-[11px] font-semibold tracking-wide uppercase rounded">
                -67%
              </span>
            </div>

            {/* Question */}
            <div className="mb-4">
              <p className="text-[13px] font-medium text-stone-400 uppercase tracking-wider mb-1.5">
                Találós kérdés
              </p>
              <h3 className="text-lg font-bold text-stone-900 leading-snug">
                4 lába van, asztal, de nem szék. Mi az?
              </h3>
              <p className="text-sm text-stone-500 mt-1.5">
                Válaszolj helyesen és kapj 67% kedvezményt az első hónapról!
              </p>
            </div>

            {/* Answer Grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {ANSWERS.map((answer) => (
                <motion.button
                  key={answer.code}
                  type="button"
                  onClick={() => handleAnswer(answer.code, answer.label)}
                  whileTap={{ scale: 0.97 }}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg border border-stone-200 bg-white text-stone-800 font-medium text-sm transition-all hover:border-stone-400 hover:bg-stone-800 hover:text-white cursor-pointer"
                >
                  {answer.label}
                </motion.button>
              ))}
            </div>

            {/* Skip */}
            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              Kihagyom
            </button>
          </motion.div>
        )}

        {/* CELEBRATING STATE */}
        {state === 'celebrating' && (
          <motion.div
            key="celebrating"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
            className="relative rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6"
          >
            <div className="flex flex-col items-center text-center py-3">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center mb-3"
              >
                <Check className="w-5 h-5 text-white" strokeWidth={3} />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-bold text-stone-900"
              >
                Szuper! Megtaláltad a kedvezményt!
              </motion.p>
              {selectedAnswer && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-stone-500 mt-1"
                >
                  Válasz: {selectedAnswer}
                </motion.p>
              )}
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
            className="relative rounded-xl border border-stone-200 bg-stone-50 p-5 sm:p-6"
          >
            {/* Discount badge */}
            <div className="absolute -top-2.5 right-4">
              <span className="inline-block px-2.5 py-0.5 bg-stone-800 text-white text-[11px] font-semibold tracking-wide uppercase rounded">
                -67%
              </span>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* Headline */}
              <p className="text-sm font-semibold text-stone-900 mb-1">
                67% kedvezmény az első hónapról
              </p>

              {/* Pricing */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-stone-900">4.946 Ft</span>
                <span className="text-sm text-stone-400 line-through">14.990 Ft</span>
              </div>

              {/* Coupon code */}
              <div className="w-full max-w-xs mb-3">
                <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-stone-200 bg-white">
                  <span className="text-base font-bold tracking-[0.2em] text-stone-800 font-mono">
                    {couponCode}
                  </span>
                  <motion.button
                    type="button"
                    onClick={handleCopy}
                    whileTap={{ scale: 0.9 }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                      copied
                        ? 'bg-stone-800 text-white'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Másolva
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Másolás
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Instruction */}
              <p className="text-xs text-stone-400 flex items-center gap-1">
                Illeszd be a kuponkódot a fizetésnél
                <ChevronDown className="w-3 h-3" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
