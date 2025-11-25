'use client'

import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setPreviewUrl('')

    if (!email) {
      setError('Kérjük, add meg az email címed.')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Kérjük, adj meg egy érvényes email címet.')
      return
    }

    setIsLoading(true)

    try {
      const requestPasswordReset = httpsCallable(functions, 'requestPasswordReset')
      const result = await requestPasswordReset({ email }) as any

      if (result.data.success) {
        setSuccess(true)
        // In development, show the preview URL
        if (result.data.previewUrl) {
          setPreviewUrl(result.data.previewUrl)
        }
      } else {
        setError(result.data.message || 'Hiba történt a jelszó visszaállítási kérelem során.')
      }
    } catch (err: any) {
      console.error('Password reset request error:', err)
      setError('Hiba történt a jelszó visszaállítási kérelem során. Kérjük, próbáld újra később.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Elfelejtett jelszó
          </CardTitle>
          <CardDescription className="text-center">
            Add meg az email címed, és küldünk egy linket a jelszó visszaállításához
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email cím</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="pelda@email.hu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
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
                    Küldés...
                  </>
                ) : (
                  'Jelszó visszaállítási link küldése'
                )}
              </Button>

              <div className="text-center text-sm space-y-2">
                <div>
                  <span className="text-gray-600">Emlékszel a jelszavadra? </span>
                  <Link 
                    href="/login" 
                    className="text-purple-600 hover:text-purple-800 hover:underline"
                  >
                    Bejelentkezés
                  </Link>
                </div>
                <div>
                  <span className="text-gray-600">Még nincs fiókod? </span>
                  <Link 
                    href="/register" 
                    className="text-purple-600 hover:text-purple-800 hover:underline"
                  >
                    Regisztráció
                  </Link>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Ha a megadott email cím regisztrálva van, küldtünk egy jelszó visszaállítási linket.
                  Kérjük, ellenőrizd az email fiókodat (a spam mappát is).
                </AlertDescription>
              </Alert>

              {/* Development only: Show email preview link */}
              {previewUrl && (
                <Alert className="border-brand-secondary/20 bg-brand-secondary/5">
                  <AlertDescription className="space-y-2">
                    <p className="text-brand-secondary-hover font-bold">
                      Fejlesztői mód - Email előnézet:
                    </p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-brand-secondary hover:text-brand-secondary-hover underline text-sm break-all"
                    >
                      Megtekintés Ethereal Email-ben
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    <p className="text-xs text-gray-600">
                      (Ez csak fejlesztői környezetben látható)
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  A link 1 óráig érvényes. Ha nem kaptál emailt, próbáld újra.
                </p>
                
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                      setPreviewUrl('')
                    }}
                    className="w-full"
                  >
                    Új link kérése
                  </Button>
                  
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      Vissza a bejelentkezéshez
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}