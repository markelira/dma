'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class UniversityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error 
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('University page error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Hiba történt az oldal betöltése során
              </h1>
              
              <p className="text-gray-600 mb-6">
                Sajnáljuk, de nem sikerült betölteni az egyetem oldalát. 
                Kérjük, próbálja meg újra vagy térjen vissza a főoldalra.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Oldal frissítése
                </button>
                
                <Link
                  href="/"
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Főoldal
                </Link>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technikai részletek (fejlesztői mód)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Specific error components
export function UniversityNotFoundError({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">🏫</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Egyetem nem található
          </h1>
          
          <p className="text-gray-600 mb-6">
            A keresett egyetem ({slug}) nem létezik vagy nem érhető el. 
            Ellenőrizze az URL-t, vagy böngésszen az elérhető egyetemek között.
          </p>

          <div className="space-y-3">
            <Link
              href="/universities"
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              Egyetemek böngészése
            </Link>
            
            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Főoldal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UniversityLoadingError({ onRetry, slug }: { onRetry?: () => void; slug?: string }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Betöltési hiba
          </h2>
          
          <p className="text-gray-600 mb-6">
            Nem sikerült betölteni az egyetem adatait. 
            Kérjük, ellenőrizze az internetkapcsolatát és próbálja meg újra.
          </p>

          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Újrapróbálás
              </button>
            )}
            
            <Link
              href="/universities"
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Egyetemek listája
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}