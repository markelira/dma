'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenEmail, setTokenEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Validate token on page load
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Hiányzó vagy érvénytelen token.')
        setIsValidating(false)
        return
      }

      try {
        const validateResetToken = httpsCallable(functions, 'validateResetToken')
        const result = await validateResetToken({ token }) as any

        if (result.data.valid) {
          setTokenValid(true)
          setTokenEmail(result.data.email || '')
        } else {
          setError(result.data.message || 'Érvénytelen vagy lejárt token.')
        }
      } catch (err: any) {
        setError('Hiba történt a token ellenőrzése során.')
        console.error('Token validation error:', err)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords
    if (newPassword.length < 6) {
      setError('A jelszónak legalább 6 karakternek kell lennie.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('A két jelszó nem egyezik.')
      return
    }

    setIsLoading(true)

    try {
      const resetPassword = httpsCallable(functions, 'resetPassword')
      const result = await resetPassword({
        token,
        newPassword
      }) as any

      if (result.data.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.data.message || 'Hiba történt a jelszó visszaállítása során.')
      }
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Hiba történt a jelszó visszaállítása során.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <main className="relative flex grow">
        {/* Blue glow background */}
        <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3">
          <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-brand-secondary/50 opacity-70 blur-[160px]"></div>
        </div>

        <div className="w-full">
          <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1">
            <div className="px-4 sm:px-6">
              <div className="mx-auto w-full max-w-sm">
                <div className="py-16 md:py-20">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-brand-secondary" />
                    <p className="text-gray-600">Token ellenőrzése...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!tokenValid) {
    return (
      <main className="relative flex grow">
        {/* Blue glow background */}
        <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3">
          <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-brand-secondary/50 opacity-70 blur-[160px]"></div>
        </div>

        <div className="w-full">
          <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1">
            <div className="px-4 sm:px-6">
              <div className="mx-auto w-full max-w-sm">
                <div className="py-16 md:py-20">
                  {/* Header */}
                  <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900">Érvénytelen token</h1>
                    <p className="mt-2 text-sm text-gray-600">
                      A jelszó visszaállítási link érvénytelen vagy lejárt.
                    </p>
                  </div>

                  {/* Error alert */}
                  <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium mb-1">Hiba történt</p>
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center">
                      Kérj új jelszó visszaállítási linket.
                    </p>
                    <Link href="/login">
                      <button className="btn w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] transition-all duration-200">
                        Vissza a bejelentkezéshez
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="relative flex grow">
        {/* Blue glow background */}
        <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3">
          <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-brand-secondary/50 opacity-70 blur-[160px]"></div>
        </div>

        <div className="w-full">
          <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1">
            <div className="px-4 sm:px-6">
              <div className="mx-auto w-full max-w-sm">
                <div className="py-16 md:py-20">
                  {/* Header */}
                  <div className="mb-10">
                    <h1 className="text-4xl font-bold text-gray-900">Sikeres!</h1>
                    <p className="mt-2 text-sm text-gray-600">
                      A jelszavad sikeresen megváltozott.
                    </p>
                  </div>

                  {/* Success alert */}
                  <div className="mb-6 rounded-lg bg-green-50 p-4 border border-green-200">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Jelszó megváltoztatva!</p>
                        <p>Most már bejelentkezhetsz az új jelszavaddal. Átirányítunk a bejelentkezési oldalra...</p>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <Link href="/login">
                    <button className="btn w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] transition-all duration-200">
                      Bejelentkezés
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex grow">
      {/* Blue glow background */}
      <div className="pointer-events-none absolute bottom-0 left-0 -translate-x-1/3">
        <div className="h-80 w-80 rounded-full bg-gradient-to-tr from-brand-secondary/50 opacity-70 blur-[160px]"></div>
      </div>

      <div className="w-full">
        <div className="flex h-full flex-col justify-center before:min-h-[4rem] before:flex-1 after:flex-1">
          <div className="px-4 sm:px-6">
            <div className="mx-auto w-full max-w-sm">
              <div className="py-16 md:py-20">
                {/* Header */}
                <div className="mb-10">
                  <h1 className="text-4xl font-bold text-gray-900">Új jelszó beállítása</h1>
                  {tokenEmail && (
                    <p className="mt-2 text-sm text-gray-600">
                      Email: <span className="font-medium text-gray-900">{tokenEmail}</span>
                    </p>
                  )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="newPassword">
                        Új jelszó
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          className="form-input w-full py-2"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimum 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                        Jelszó megerősítése
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          className="form-input w-full py-2"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Írd be újra a jelszót"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                            {error}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6 space-y-3">
                    {/* Submit button */}
                    <button
                      type="submit"
                      className="btn w-full bg-gradient-to-t from-brand-secondary to-brand-secondary/50 bg-[length:100%_100%] bg-[bottom] text-white shadow-sm hover:bg-[length:100%_150%] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Jelszó változtatása...
                        </span>
                      ) : (
                        'Jelszó változtatása'
                      )}
                    </button>
                  </div>
                </form>

                {/* Footer links */}
                <div className="mt-6 text-center text-sm text-gray-600">
                  <Link href="/login" className="text-brand-secondary hover:text-brand-secondary-hover hover:underline font-medium">
                    Vissza a bejelentkezéshez
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
