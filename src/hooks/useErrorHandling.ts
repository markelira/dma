/**
 * Enhanced error handling hooks for ELIRA platform
 * Provides consistent error handling across components
 */

import { useState, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { errorHandler, ErrorType, ErrorSeverity, RecoveryAction, executeRecoveryAction } from '@/lib/errorHandler'
import { useAuthStore } from '@/stores/authStore'

// Generic error state interface
interface ErrorState {
  hasError: boolean
  error: Error | null
  errorType: ErrorType
  severity: ErrorSeverity
  recoveryActions: RecoveryAction[]
  retryCount: number
  isRetrying: boolean
}

// Hook for generic error handling
export const useErrorHandling = (component?: string) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorType: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    recoveryActions: [],
    retryCount: 0,
    isRetrying: false
  })

  const handleError = useCallback((
    error: any,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ) => {
    const appError = errorHandler.handleError(error, type, severity, component)
    
    setErrorState({
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
      errorType: type,
      severity,
      recoveryActions: appError.recoveryActions || [],
      retryCount: 0,
      isRetrying: false
    })

    return appError
  }, [component])

  const clearError = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      hasError: false,
      error: null,
      isRetrying: false
    }))
  }, [])

  const retry = useCallback((retryFunction?: () => void | Promise<void>) => {
    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1
    }))

    if (retryFunction) {
      Promise.resolve(retryFunction())
        .then(() => clearError())
        .catch((error) => {
          setErrorState(prev => ({
            ...prev,
            isRetrying: false,
            error: error instanceof Error ? error : new Error(String(error))
          }))
        })
    } else {
      // Default retry behavior - clear error after short delay
      setTimeout(() => {
        clearError()
      }, 1000)
    }
  }, [clearError])

  const executeRecovery = useCallback((action: RecoveryAction, context?: any) => {
    executeRecoveryAction(action, {
      ...context,
      retryFunction: context?.retryFunction || (() => retry(context?.retryFunction))
    })
  }, [retry])

  return {
    errorState,
    handleError,
    clearError,
    retry,
    executeRecovery
  }
}

// Hook for network/API error handling with React Query integration
export const useNetworkErrorHandling = () => {
  const queryClient = useQueryClient()
  const { handleError, ...errorHandling } = useErrorHandling('NetworkHandler')

  const handleNetworkError = useCallback((error: any, queryKey?: string[]) => {
    // Determine if it's a network error
    const isNetworkError = !navigator.onLine || 
                          error?.code === 'NETWORK_ERROR' ||
                          error?.message?.includes('fetch')

    const errorType = isNetworkError ? ErrorType.NETWORK : ErrorType.UNKNOWN
    const severity = isNetworkError ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH

    const appError = handleError(error, errorType, severity)

    // Invalidate related queries on network errors
    if (queryKey && isNetworkError) {
      queryClient.invalidateQueries({ queryKey })
    }

    return appError
  }, [handleError, queryClient])

  const retryWithInvalidation = useCallback((queryKey?: string[]) => {
    if (queryKey) {
      queryClient.invalidateQueries({ queryKey })
    }
    errorHandling.retry()
  }, [queryClient, errorHandling])

  return {
    ...errorHandling,
    handleNetworkError,
    retryWithInvalidation
  }
}

// Hook for authentication error handling
export const useAuthErrorHandling = () => {
  const router = useRouter()
  const { logout } = useAuthStore()
  const { handleError, ...errorHandling } = useErrorHandling('AuthHandler')

  const handleAuthError = useCallback((error: any) => {
    // Check if it's an authentication error
    const isAuthError = error?.status === 401 || 
                       error?.code === 'UNAUTHENTICATED' ||
                       error?.message?.includes('unauthorized')

    if (isAuthError) {
      // Auto-logout on auth errors
      logout()
      
      const appError = handleError(error, ErrorType.AUTHENTICATION, ErrorSeverity.HIGH)
      
      // Redirect to login after short delay
      setTimeout(() => {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      }, 2000)
      
      return appError
    }

    return handleError(error, ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM)
  }, [handleError, logout, router])

  return {
    ...errorHandling,
    handleAuthError
  }
}

// Hook for video player error handling
export const useVideoErrorHandling = (videoId?: string) => {
  const { handleError, ...errorHandling } = useErrorHandling(`VideoPlayer-${videoId}`)
  const [fallbackAttempted, setFallbackAttempted] = useState(false)

  const handleVideoError = useCallback((error: any, currentSource?: string) => {
    const appError = handleError(error, ErrorType.VIDEO_PLAYBACK, ErrorSeverity.HIGH)
    
    // Track fallback attempts
    if (currentSource?.includes('mux') && !fallbackAttempted) {
      setFallbackAttempted(true)
    }

    return appError
  }, [handleError, fallbackAttempted])

  const retryWithFallback = useCallback((
    primarySource: string,
    fallbackSource?: string,
    onSourceChange?: (source: string) => void
  ) => {
    if (!fallbackAttempted && fallbackSource) {
      setFallbackAttempted(true)
      onSourceChange?.(fallbackSource)
      errorHandling.clearError()
    } else {
      errorHandling.retry()
    }
  }, [fallbackAttempted, errorHandling])

  const resetFallback = useCallback(() => {
    setFallbackAttempted(false)
  }, [])

  return {
    ...errorHandling,
    handleVideoError,
    retryWithFallback,
    resetFallback,
    fallbackAttempted
  }
}

// Hook for quiz error handling with progress persistence
export const useQuizErrorHandling = (quizId?: string, lessonId?: string) => {
  const { handleError, ...errorHandling } = useErrorHandling(`Quiz-${quizId}`)
  const [progressSaved, setProgressSaved] = useState(false)

  const handleQuizError = useCallback((error: any, quizState?: any) => {
    // Save progress to localStorage on error
    if (quizState && lessonId && !progressSaved) {
      try {
        const progressKey = `quiz_progress_${lessonId}_${quizId}`
        localStorage.setItem(progressKey, JSON.stringify({
          ...quizState,
          timestamp: Date.now()
        }))
        setProgressSaved(true)
      } catch (storageError) {
        console.warn('Failed to save quiz progress:', storageError)
      }
    }

    return handleError(error, ErrorType.QUIZ_SUBMISSION, ErrorSeverity.HIGH)
  }, [handleError, quizId, lessonId, progressSaved])

  const loadSavedProgress = useCallback(() => {
    if (!lessonId || !quizId) return null

    try {
      const progressKey = `quiz_progress_${lessonId}_${quizId}`
      const saved = localStorage.getItem(progressKey)
      if (saved) {
        const progress = JSON.parse(saved)
        // Only return progress saved within last hour
        if (Date.now() - progress.timestamp < 3600000) {
          return progress
        }
        // Clean up old progress
        localStorage.removeItem(progressKey)
      }
    } catch (error) {
      console.warn('Failed to load saved quiz progress:', error)
    }
    return null
  }, [lessonId, quizId])

  const clearSavedProgress = useCallback(() => {
    if (lessonId && quizId) {
      const progressKey = `quiz_progress_${lessonId}_${quizId}`
      localStorage.removeItem(progressKey)
      setProgressSaved(false)
    }
  }, [lessonId, quizId])

  return {
    ...errorHandling,
    handleQuizError,
    loadSavedProgress,
    clearSavedProgress,
    progressSaved
  }
}

// Hook for file upload error handling
export const useFileUploadErrorHandling = () => {
  const { handleError, ...errorHandling } = useErrorHandling('FileUpload')
  const [uploadState, setUploadState] = useState<{
    isUploading: boolean
    progress: number
    fileName?: string
  }>({
    isUploading: false,
    progress: 0
  })

  const handleFileError = useCallback((error: any, fileName?: string) => {
    setUploadState(prev => ({
      ...prev,
      isUploading: false,
      fileName
    }))

    // Determine error type based on error details
    let errorType = ErrorType.FILE_UPLOAD
    if (error?.message?.includes('size')) {
      errorType = ErrorType.VALIDATION
    } else if (error?.message?.includes('format') || error?.message?.includes('type')) {
      errorType = ErrorType.VALIDATION
    }

    return handleError(error, errorType, ErrorSeverity.MEDIUM)
  }, [handleError])

  const startUpload = useCallback((fileName: string) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      fileName
    })
    errorHandling.clearError()
  }, [errorHandling])

  const updateProgress = useCallback((progress: number) => {
    setUploadState(prev => ({ ...prev, progress }))
  }, [])

  const completeUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: 100
    })
  }, [])

  return {
    ...errorHandling,
    handleFileError,
    uploadState,
    startUpload,
    updateProgress,
    completeUpload
  }
}

// Hook for offline/network status handling
export const useOfflineHandling = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const { handleError } = useErrorHandling('OfflineHandler')

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      handleError(
        'Nincs internetkapcsolat',
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM
      )
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleError])

  return { isOnline }
}