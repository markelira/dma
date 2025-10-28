"use client"

import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { errorHandler } from '@/lib/errorHandler'
import { PageErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { useOfflineHandling } from '@/hooks/useErrorHandling'
import { Toaster } from '@/components/ui/toaster'

interface ErrorProviderProps {
  children: ReactNode
}

// Global error context
const ErrorContext = createContext<{
  isOnline: boolean
}>({
  isOnline: true
})

export const useErrorContext = () => useContext(ErrorContext)

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const { user } = useAuthStore()
  const { isOnline } = useOfflineHandling()

  // Set global error context when user changes
  useEffect(() => {
    if (user) {
      errorHandler.setContext({
        userId: user.uid,
        sessionId: `session_${Date.now()}`,
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    } else {
      errorHandler.setContext({
        userId: undefined,
        sessionId: `anon_${Date.now()}`,
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    }
  }, [user])

  // Update context on route changes
  useEffect(() => {
    const updateContext = () => {
      errorHandler.setContext({
        url: window.location.href,
        component: undefined // Reset component context on navigation
      })
    }

    // Listen for navigation events
    window.addEventListener('popstate', updateContext)
    
    // For client-side navigation (Next.js)
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      updateContext()
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      updateContext()
    }

    return () => {
      window.removeEventListener('popstate', updateContext)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [])

  // Global error handlers
  useEffect(() => {
    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      errorHandler.handleError(
        event.reason,
        undefined,
        undefined,
        'UnhandledPromise'
      )
      // Prevent default browser behavior
      event.preventDefault()
    }

    // Catch global JavaScript errors
    const handleGlobalError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      errorHandler.handleError(
        event.error || event.message,
        undefined,
        undefined,
        'GlobalError'
      )
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleGlobalError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleGlobalError)
    }
  }, [])

  // Network status indicator
  const NetworkStatusIndicator = () => {
    if (isOnline) return null

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Nincs internetkapcsolat - Az oldal offline módban működik</span>
        </div>
      </div>
    )
  }

  const contextValue = {
    isOnline
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      <PageErrorBoundary context="AppRoot">
        <NetworkStatusIndicator />
        <div className={!isOnline ? 'mt-10' : ''}>
          {children}
        </div>
        <Toaster />
      </PageErrorBoundary>
    </ErrorContext.Provider>
  )
}

// Hook for components to report their context
export const useErrorReporting = (componentName: string) => {
  useEffect(() => {
    errorHandler.setContext({ component: componentName })
    
    return () => {
      errorHandler.setContext({ component: undefined })
    }
  }, [componentName])

  return {
    reportError: (error: any, type?: any, severity?: any) => {
      return errorHandler.handleError(error, type, severity, componentName)
    }
  }
}