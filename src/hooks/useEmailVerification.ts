import { useState, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

interface UseEmailVerificationReturn {
  sendCode: () => Promise<boolean>
  verifyCode: (code: string) => Promise<boolean>
  resendCode: () => Promise<boolean>
  isSending: boolean
  isVerifying: boolean
  error: string | null
  clearError: () => void
}

export function useEmailVerification(): UseEmailVerificationReturn {
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const sendCode = useCallback(async (): Promise<boolean> => {
    setIsSending(true)
    setError(null)

    try {
      const sendEmailVerificationCode = httpsCallable(functions, 'sendEmailVerificationCode')
      const result = await sendEmailVerificationCode({}) as any

      if (result.data.success) {
        console.log('Verification code sent successfully')

        // In emulator mode, log the code for testing
        if (result.data.code) {
          console.log('🔐 VERIFICATION CODE (emulator):', result.data.code)
        }

        return true
      } else {
        const errorMsg = result.data.error || 'Kód küldése sikertelen'
        setError(errorMsg)
        console.error('Send code error:', errorMsg)
        return false
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Hiba történt a kód küldése során'
      setError(errorMsg)
      console.error('Send code exception:', err)
      return false
    } finally {
      setIsSending(false)
    }
  }, [])

  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    if (!code || code.length !== 4) {
      setError('Kérjük add meg a 4 jegyű kódot')
      return false
    }

    setIsVerifying(true)
    setError(null)

    try {
      const verifyEmailCode = httpsCallable(functions, 'verifyEmailCode')
      const result = await verifyEmailCode({ code }) as any

      if (result.data.success) {
        console.log('Email verified successfully')
        return true
      } else {
        const errorMsg = result.data.error || 'Hibás kód'
        setError(errorMsg)
        console.error('Verify code error:', errorMsg)
        return false
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Hiba történt az ellenőrzés során'
      setError(errorMsg)
      console.error('Verify code exception:', err)
      return false
    } finally {
      setIsVerifying(false)
    }
  }, [])

  const resendCode = useCallback(async (): Promise<boolean> => {
    setIsSending(true)
    setError(null)

    try {
      const resendVerificationCode = httpsCallable(functions, 'resendVerificationCode')
      const result = await resendVerificationCode({}) as any

      if (result.data.success) {
        console.log('Verification code resent successfully')

        // In emulator mode, log the code for testing
        if (result.data.code) {
          console.log('🔐 VERIFICATION CODE (emulator):', result.data.code)
        }

        return true
      } else {
        const errorMsg = result.data.error || 'Új kód küldése sikertelen'
        setError(errorMsg)
        console.error('Resend code error:', errorMsg)
        return false
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Hiba történt az új kód küldése során'
      setError(errorMsg)
      console.error('Resend code exception:', err)
      return false
    } finally {
      setIsSending(false)
    }
  }, [])

  return {
    sendCode,
    verifyCode,
    resendCode,
    isSending,
    isVerifying,
    error,
    clearError
  }
}
