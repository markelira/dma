'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, X } from 'lucide-react';

export function WelcomePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showWelcomePopup');
    if (shouldShow === 'true') {
      setShow(true);
      sessionStorage.removeItem('showWelcomePopup');
    }
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4"
          >
            <button
              onClick={() => setShow(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-4 bg-gradient-to-t from-brand-secondary to-brand-secondary/50 rounded-full flex items-center justify-center"
              >
                <PartyPopper className="w-8 h-8 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Örülünk, hogy itt vagy!
              </h2>

              <p className="text-gray-600 mb-6 leading-relaxed">
                Most 7 napig ingyen férsz hozzá minden tartalomhoz.
                Fedezd fel a platformot és kezdd el a tanulást!
              </p>

              <button
                onClick={() => setShow(false)}
                className="btn w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%]"
              >
                Kezdjük!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
