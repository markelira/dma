/**
 * Global React Query Error Handler
 * Centralizes API error handling across all queries and mutations
 */

import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/errorHandler'
import { toast } from '@/hooks/use-toast'

// Enhanced error interface for API responses
interface ApiError {
  status?: number
  statusText?: string
  code?: string
  message?: string
  details?: any
  response?: {
    data?: any
    status?: number
    statusText?: string
  }
}

// Classify API errors
const classifyApiError = (error: any): { type: ErrorType; severity: ErrorSeverity } => {
  const status = error?.status || error?.response?.status

  // Network errors
  if (!navigator.onLine || error?.code === 'NETWORK_ERROR' || error?.name === 'NetworkError') {
    return { type: ErrorType.NETWORK, severity: ErrorSeverity.MEDIUM }
  }

  // HTTP status-based classification
  switch (status) {
    case 401:
      return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.HIGH }
    case 403:
      return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.MEDIUM }
    case 400:
    case 422:
      return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW }
    case 404:
      return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.LOW }
    case 500:
    case 502:
    case 503:
    case 504:
      return { type: ErrorType.DATABASE, severity: ErrorSeverity.HIGH }
    default:
      return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM }
  }
}

// Global query error handler
const handleQueryError = (error: any, query: any) => {
  const { type, severity } = classifyApiError(error)
  
  // Don't show UI feedback for background refetches or low severity errors
  if (query.state.fetchStatus === 'fetching' && query.state.dataUpdatedAt > 0) {
    return // Silent background refetch failure
  }

  if (severity === ErrorSeverity.LOW) {
    return // Don't interrupt user for minor errors
  }

  // Handle through centralized error system
  errorHandler.handleError(
    error,
    type,
    severity,
    `Query-${query.queryHash}`
  )
}

// Global mutation error handler
const handleMutationError = (error: any, variables: any, context: any, mutation: any) => {
  const { type, severity } = classifyApiError(error)
  
  // Always show mutation errors as they're user-initiated
  errorHandler.handleError(
    error,
    type,
    severity,
    `Mutation-${mutation.options.mutationKey?.join('-') || 'unknown'}`
  )
}

// Create enhanced query client with global error handling
export const createQueryClientWithErrorHandling = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleQueryError
    }),
    mutationCache: new MutationCache({
      onError: handleMutationError
    }),
    defaultOptions: {
      queries: {
        // Enhanced retry strategy
        retry: (failureCount, error) => {
          const { type } = classifyApiError(error)
          
          // Don't retry auth errors
          if (type === ErrorType.AUTHENTICATION || type === ErrorType.AUTHORIZATION) {
            return false
          }
          
          // Don't retry validation errors
          if (type === ErrorType.VALIDATION) {
            return false
          }
          
          // Network errors: retry up to 3 times with exponential backoff
          if (type === ErrorType.NETWORK) {
            return failureCount < 3
          }
          
          // Database errors: retry up to 2 times
          if (type === ErrorType.DATABASE) {
            return failureCount < 2
          }
          
          // Other errors: retry once
          return failureCount < 1
        },
        
        // Exponential backoff delay
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Stale time based on data type
        staleTime: 5 * 60 * 1000, // 5 minutes default
        
        // Refetch on reconnect for important queries
        refetchOnReconnect: 'always',
        
        // Refetch on window focus for data freshness
        refetchOnWindowFocus: false, // Disabled to reduce API calls
        
        // Note: useErrorBoundary is deprecated in newer versions of React Query
        throwOnError: (error: any) => {
          const { severity } = classifyApiError(error)
          return severity === ErrorSeverity.CRITICAL
        }
      },
      mutations: {
        // Retry mutations more conservatively
        retry: (failureCount, error) => {
          const { type } = classifyApiError(error)
          
          // Never retry auth errors
          if (type === ErrorType.AUTHENTICATION || type === ErrorType.AUTHORIZATION) {
            return false
          }
          
          // Never retry validation errors
          if (type === ErrorType.VALIDATION) {
            return false
          }
          
          // Only retry network errors once
          if (type === ErrorType.NETWORK) {
            return failureCount < 1
          }
          
          return false // Don't retry other mutation errors
        },
        
        // Error boundaries for critical mutations
        throwOnError: (error: any) => {
          const { severity } = classifyApiError(error)
          return severity === ErrorSeverity.CRITICAL
        }
      }
    }
  })
}

// Specific query configurations for different data types
export const queryConfigs = {
  // User data - highly cached, important for UX
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retry: 3
  },
  
  // Course content - moderately cached
  course: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  },
  
  // Video/media URLs - short cache due to signed URLs
  media: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 3
  },
  
  // Progress data - always fresh
  progress: {
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // 1 minute
    retry: 2
  },
  
  // Real-time data - always fresh
  realtime: {
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30 seconds
    retry: 1
  }
}

// Helper to create query keys with error context
export const createQueryKey = (
  base: string[],
  params?: Record<string, any>,
  userId?: string
): (string | Record<string, any>)[] => {
  const key: (string | Record<string, any>)[] = [...base]
  
  if (params) {
    key.push(params)
  }
  
  if (userId) {
    key.push({ userId })
  }
  
  return key
}

// Utility to invalidate related queries on errors
export const invalidateRelatedQueries = (
  queryClient: QueryClient,
  error: any,
  queryKey: string[]
) => {
  const { type } = classifyApiError(error)
  
  // Invalidate related queries based on error type
  if (type === ErrorType.AUTHENTICATION) {
    // Invalidate all user-related queries
    queryClient.invalidateQueries({ queryKey: ['user'] })
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  }
  
  if (type === ErrorType.NETWORK) {
    // Invalidate the specific query to retry
    queryClient.invalidateQueries({ queryKey })
  }
}

// Enhanced error context for better debugging
export const addErrorContext = (error: any, context: Record<string, any>) => {
  if (error && typeof error === 'object') {
    error.context = { ...error.context, ...context }
  }
  return error
}

// Success handlers for mutations
export const createMutationSuccessHandler = (
  queryClient: QueryClient,
  invalidateKeys?: string[][]
) => {
  return (data: any, variables: any, context: any) => {
    // Invalidate related queries on successful mutations
    if (invalidateKeys) {
      invalidateKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
    }
    
    // Show success toast for important operations
    toast({
      title: 'Sikeres művelet',
      description: 'A módosítás mentése sikerült.',
      variant: 'default'
    })
  }
}

// Offline query persistence
export const persistOfflineQueries = (queryClient: QueryClient) => {
  // Save failed queries to localStorage for offline retry
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.query?.state?.error) {
      const { type } = classifyApiError(event.query.state.error)
      
      if (type === ErrorType.NETWORK && !navigator.onLine) {
        const offlineKey = `offline_query_${event.query.queryHash}`
        localStorage.setItem(offlineKey, JSON.stringify({
          queryKey: event.query.queryKey,
          timestamp: Date.now()
        }))
      }
    }
  })
  
  // Retry offline queries when back online
  window.addEventListener('online', () => {
    const offlineQueries = Object.keys(localStorage)
      .filter(key => key.startsWith('offline_query_'))
      .map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          localStorage.removeItem(key)
          return data
        } catch {
          return null
        }
      })
      .filter(Boolean)
    
    offlineQueries.forEach(query => {
      queryClient.invalidateQueries({ queryKey: query.queryKey })
    })
  })
}