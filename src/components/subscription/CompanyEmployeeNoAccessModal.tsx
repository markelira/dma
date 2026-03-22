'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Check, X as CloseIcon, Mail, Loader2, CheckCircle } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface CompanyEmployeeNoAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
  employeeName?: string;
}

export function CompanyEmployeeNoAccessModal({
  open,
  onOpenChange,
  companyId,
  employeeName,
}: CompanyEmployeeNoAccessModalProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  const benefits = [
    'Teljes hozzáférés 150+ struktúraépítő tartalomhoz',
    'Több mint 200 órányi azonnal alkalmazható, működő rendszer',
    '5 munkatárs díjmentes hozzáadása',
    'Hetente frissülő tartalmak',
    'Bármikor lemondható',
    'Havi 14.990 Ft'
  ];

  useEffect(() => {
    setPortalContainer(document.body);
    return () => setPortalContainer(null);
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setNotifySuccess(false);
      setNotifyError(null);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleNotifyBoss = async () => {
    if (!companyId) {
      setNotifyError('Hiba: Nincs cégazonosító');
      return;
    }

    setIsNotifying(true);
    setNotifyError(null);

    try {
      const notifyCompanyAdminFn = httpsCallable(functions, 'notifyCompanyAdmin');
      const result = await notifyCompanyAdminFn({ companyId });
      const data = result.data as { success: boolean; error?: string };

      if (data.success) {
        setNotifySuccess(true);
      } else {
        setNotifyError(data.error || 'Hiba történt az értesítés küldésekor');
      }
    } catch (error: any) {
      console.error('Error notifying company admin:', error);
      setNotifyError('Hiba történt az értesítés küldésekor. Próbáld újra később.');
    } finally {
      setIsNotifying(false);
    }
  };

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
                  {/* Headline */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl font-bold text-white tracking-tight"
                  >
                    Vágj bele a kalandba
                  </motion.h2>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                  {/* Benefits grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-x-4 gap-y-3"
                  >
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700 leading-tight">{benefit}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Success message */}
                  {notifySuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm text-green-700">
                        Sikeresen értesítetted a főnököt!
                      </p>
                    </motion.div>
                  )}

                  {/* Error message */}
                  {notifyError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <p className="text-sm text-red-700">{notifyError}</p>
                    </motion.div>
                  )}

                  {/* CTA Button */}
                  {!notifySuccess && companyId && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Button
                        onClick={handleNotifyBoss}
                        disabled={isNotifying}
                        className="w-full h-14 text-lg font-bold bg-brand-secondary hover:bg-brand-secondary-hover shadow-lg shadow-brand-secondary/30 hover:shadow-brand-secondary/40 transition-all tracking-tight"
                      >
                        {isNotifying ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Küldés...
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5 mr-2" />
                            FŐNÖK ÉRTESÍTÉSE
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
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
