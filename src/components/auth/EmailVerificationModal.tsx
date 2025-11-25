'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, Loader2, AlertCircle, Mail } from 'lucide-react'
import { OTPInput } from './OTPInput'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface EmailVerificationModalProps {
  email: string
  onVerified: () => void
  userId: string
}

export function EmailVerificationModal({
  email,
  onVerified,
  userId
}: EmailVerificationModalProps) {
  const [code, setCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  // Set up portal container on mount (client-side only)
  useEffect(() => {
    setPortalContainer(document.body)
    return () => setPortalContainer(null)
  }, [])

  // Mask email for display (e.g., j***@example.com)
  const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@')
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`
    }
    return `${localPart[0]}***${localPart[localPart.length - 1]}@${domain}`
  }

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-verify when 4 digits are entered
  useEffect(() => {
    if (code.length === 4 && !isVerifying && !success) {
      handleVerify()
    }
  }, [code])

  const handleVerify = async () => {
    if (code.length !== 4) {
      setError('Kérjük add meg a 4 jegyű kódot')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const verifyEmailCode = httpsCallable(functions, 'verifyEmailCode')
      const result = await verifyEmailCode({ code }) as any

      if (result.data.success) {
        setSuccess(true)
        // Wait for celebration animation before calling onVerified
        setTimeout(() => {
          onVerified()
        }, 2000)
      } else {
        setError(result.data.error || 'Hibás kód')
        setCode('') // Clear code for retry
      }
    } catch (err: any) {
      console.error('Verification error:', err)
      setError(err.message || 'Hiba történt az ellenőrzés során')
      setCode('') // Clear code for retry
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return

    setResending(true)
    setError('')
    setCode('')

    try {
      const resendVerificationCode = httpsCallable(functions, 'resendVerificationCode')
      const result = await resendVerificationCode({}) as any

      if (result.data.success) {
        setResendCooldown(60) // 60 second cooldown
      } else {
        setError(result.data.error || 'Új kód küldése sikertelen')
      }
    } catch (err: any) {
      console.error('Resend error:', err)
      setError(err.message || 'Új kód küldése sikertelen')
    } finally {
      setResending(false)
    }
  }

  // Success state
  if (success) {
    const successModal = (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md mx-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {/* Success animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-t from-green-600 to-green-500 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 text-center mb-3">
              Email megerősítve!
            </h2>
            <p className="text-gray-600 text-center">
              Sikeres azonosítás. Átirányítunk...
            </p>

            {/* Loading indicator */}
            <div className="flex justify-center mt-6">
              <Loader2 className="w-6 h-6 text-brand-secondary animate-spin" />
            </div>
          </div>
        </motion.div>
      </div>
    )

    if (!portalContainer) return null
    return createPortal(successModal, portalContainer)
  }

  // Main verification modal
  const mainModal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Blue glow effect */}
        <div className="absolute -inset-4 bg-gradient-to-tr from-brand-secondary/50 to-brand-secondary opacity-20 blur-2xl rounded-3xl"></div>

        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-t from-brand-secondary to-brand-secondary/50 px-8 py-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Erősítsd meg az email címed
            </h2>
            <p className="text-brand-secondary-light text-sm">
              {maskEmail(email)}
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              4 jegyű kódot küldtünk az email címedre.<br/>
              Add meg az alábbi mezőkben:
            </p>

            {/* OTP Input */}
            <div className="mb-6">
              <OTPInput
                length={4}
                value={code}
                onChange={setCode}
                disabled={isVerifying || success}
                error={!!error}
                autoFocus={true}
              />
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6"
                >
                  <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium">{error}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading state */}
            {isVerifying && (
              <div className="flex items-center justify-center gap-2 mb-6 text-brand-secondary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Ellenőrzés...</span>
              </div>
            )}

            {/* Resend button */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-gray-600">
                Nem kaptad meg a kódot?
              </p>
              <button
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || resending}
                className={`
                  text-sm font-medium transition-all duration-200
                  ${resendCooldown > 0 || resending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-brand-secondary hover:text-brand-secondary-hover hover:underline'
                  }
                `}
              >
                {resending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Küldés...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Újraküldés (${resendCooldown}s)`
                ) : (
                  'Kód újraküldése'
                )}
              </button>
            </div>

            {/* Help text */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                A kód 15 percig érvényes. Ha nem találod az emailt,<br/>
                nézd meg a spam mappát is.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )

  if (!portalContainer) return null
  return createPortal(mainModal, portalContainer)
}
