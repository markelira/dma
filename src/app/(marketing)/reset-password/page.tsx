'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Token ellenőrzése...</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!tokenValid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              Érvénytelen token
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                A jelszó visszaállítási link érvénytelen vagy lejárt.
              </p>
              <p className="text-sm text-gray-600">
                Kérj új jelszó visszaállítási linket.
              </p>
            </div>
            <div className="flex justify-center">
              <Link href="/forgot-password">
                <Button variant="outline">
                  Új link kérése
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-green-600">
              Sikeres jelszóváltoztatás!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                A jelszavad sikeresen megváltozott. Átirányítunk a bejelentkezési oldalra...
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Link href="/login">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Bejelentkezés
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Új jelszó beállítása
          </CardTitle>
          <CardDescription className="text-center">
            {tokenEmail && (
              <span className="text-sm">
                Email: <strong>{tokenEmail}</strong>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Új jelszó</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Jelszó megerősítése</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Írd be újra a jelszót"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Jelszó változtatása...
                </>
              ) : (
                'Jelszó változtatása'
              )}
            </Button>

            <div className="text-center text-sm">
              <Link 
                href="/login" 
                className="text-purple-600 hover:text-purple-800 hover:underline"
              >
                Vissza a bejelentkezéshez
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}