'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Érvénytelen vagy hiányzó token.')
      return
    }

    // Prevent multiple verification attempts
    if (isVerifying) return
    
    const verifyEmail = async () => {
      setIsVerifying(true)
      try {
        const verifyEmailFn = httpsCallable(functions, 'verifyEmail')
        const result: any = await verifyEmailFn({ token })
        
        if (result.data.success) {
          setStatus('success')
          setMessage(result.data.message || 'Email cím sikeresen megerősítve!')
        } else {
          setStatus('error')
          setMessage(result.data.message || 'Az email megerősítése sikertelen.')
        }
      } catch (error: any) {
        console.error('Email verification error:', error)
        setStatus('error')
        setMessage(error.message || 'Hiba történt az email megerősítése során.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Email Megerősítés
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Email cím ellenőrzése folyamatban...'}
            {status === 'success' && 'Az email címe megerősítve'}
            {status === 'error' && 'Hiba történt'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Email cím megerősítése...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-center text-sm text-muted-foreground">
                Most már bejelentkezhet a fiókjába.
              </p>
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                Tovább a bejelentkezéshez
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {message}
                </AlertDescription>
              </Alert>
              <div className="space-y-2 w-full">
                <Button 
                  onClick={() => router.push('/login')} 
                  className="w-full"
                  variant="outline"
                >
                  Vissza a bejelentkezéshez
                </Button>
                <Button 
                  onClick={() => router.push('/register')} 
                  className="w-full"
                >
                  Új regisztráció
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}